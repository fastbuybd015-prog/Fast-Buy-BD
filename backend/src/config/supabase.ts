import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { ServiceUnavailableError } from "@/errors/app-error";

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  if (!env.supabase.url || !env.supabase.secretKey) {
    throw new ServiceUnavailableError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.",
    );
  }

  adminClient = createClient(env.supabase.url, env.supabase.secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
