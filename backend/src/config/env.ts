import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * Rules (see Backend Master Context §18):
 *   - Every environment variable is read here and nowhere else.
 *   - The process fails fast with a readable message on invalid config.
 *   - Variables required for production are optional in development so the
 *     server still boots before Supabase credentials have been filled in.
 *     Features depending on them report themselves as "not configured"
 *     instead of silently pretending to work.
 */

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

/** Treat an unset variable and an empty `KEY=` line as the same thing. */
function blankToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const optionalString = z.preprocess(blankToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

const envSchema = z.object({
  // --- Application ---------------------------------------------------------
  NODE_ENV: z.preprocess(
    blankToUndefined,
    z.enum(["development", "test", "production"]).default("development"),
  ),
  PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).default(4000)),
  HOST: z.preprocess(blankToUndefined, z.string().min(1).default("0.0.0.0")),
  LOG_LEVEL: z.preprocess(blankToUndefined, z.enum(LOG_LEVELS).default("info")),

  // --- CORS ----------------------------------------------------------------
  FRONTEND_URL: z.preprocess(blankToUndefined, z.url().default("http://localhost:3000")),
  ADDITIONAL_CORS_ORIGINS: optionalString,

  // --- Database ------------------------------------------------------------
  DATABASE_URL: optionalString,

  // --- Supabase ------------------------------------------------------------
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,

  // --- Supabase Storage buckets --------------------------------------------
  SUPABASE_BUCKET_PRODUCT_IMAGES: z.preprocess(
    blankToUndefined,
    z.string().min(1).default("product-images"),
  ),
  SUPABASE_BUCKET_STORE_LOGOS: z.preprocess(
    blankToUndefined,
    z.string().min(1).default("store-logos"),
  ),
  SUPABASE_BUCKET_AVATARS: z.preprocess(blankToUndefined, z.string().min(1).default("avatars")),
  SUPABASE_BUCKET_PAYMENT_PROOFS: z.preprocess(
    blankToUndefined,
    z.string().min(1).default("payment-proofs"),
  ),

  // --- Redis (optional) ----------------------------------------------------
  REDIS_URL: optionalString,

  // --- AI Gemini Assistant (optional) --------------------------------------
  GEMINI_API_KEY: optionalString,

  // --- Docs ----------------------------------------------------------------
  ENABLE_SWAGGER: z.preprocess(blankToUndefined, z.enum(["true", "false"]).optional()),
});

/** Variables that must be present before the app is allowed to run for real. */
const PRODUCTION_REQUIRED = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

function fail(title: string, details: string[]): never {
  const lines = [
    "",
    "  ┌─────────────────────────────────────────────────────────────┐",
    "  │  FastShopBD backend failed to start: invalid configuration  │",
    "  └─────────────────────────────────────────────────────────────┘",
    "",
    `  ${title}`,
    "",
    ...details.map((detail) => `    • ${detail}`),
    "",
    "  Fix your backend/.env file (see backend/.env.example) and retry.",
    "",
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  fail(
    "The following environment variables are missing or invalid:",
    parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"} — ${issue.message}`),
  );
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === "production";

const missingForProduction = PRODUCTION_REQUIRED.filter((key) => raw[key] === undefined);

if (isProduction && missingForProduction.length > 0) {
  fail("These variables are required when NODE_ENV=production:", missingForProduction);
}

const additionalOrigins = (raw.ADDITIONAL_CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction,
  isDevelopment: raw.NODE_ENV === "development",
  isTest: raw.NODE_ENV === "test",

  port: raw.PORT,
  host: raw.HOST,
  logLevel: raw.LOG_LEVEL,

  /** Every browser origin allowed to call this API. */
  corsOrigins: [raw.FRONTEND_URL, ...additionalOrigins],
  frontendUrl: raw.FRONTEND_URL,

  databaseUrl: raw.DATABASE_URL,

  supabase: {
    url: raw.SUPABASE_URL,
    publishableKey: raw.SUPABASE_PUBLISHABLE_KEY,
    secretKey: raw.SUPABASE_SECRET_KEY,
    buckets: {
      productImages: raw.SUPABASE_BUCKET_PRODUCT_IMAGES,
      storeLogos: raw.SUPABASE_BUCKET_STORE_LOGOS,
      avatars: raw.SUPABASE_BUCKET_AVATARS,
      paymentProofs: raw.SUPABASE_BUCKET_PAYMENT_PROOFS,
    },
  },

  redisUrl: raw.REDIS_URL,
  geminiApiKey: raw.GEMINI_API_KEY,

  enableSwagger: raw.ENABLE_SWAGGER ? raw.ENABLE_SWAGGER === "true" : !isProduction,

  /** Capability flags — used to report honest health/feature status. */
  isDatabaseConfigured: raw.DATABASE_URL !== undefined,
  isSupabaseConfigured:
    raw.SUPABASE_URL !== undefined &&
    raw.SUPABASE_PUBLISHABLE_KEY !== undefined &&
    raw.SUPABASE_SECRET_KEY !== undefined,
  isRedisConfigured: raw.REDIS_URL !== undefined,
  isGeminiConfigured: raw.GEMINI_API_KEY !== undefined,

  /** Non-fatal gaps, surfaced as a startup warning in development. */
  missingOptionalConfig: missingForProduction,
} as const;

export type Env = typeof env;
