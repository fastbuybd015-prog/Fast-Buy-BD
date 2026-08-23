# FastShopBD — Backend

The application backend for **FastShopBD**, a smart hyperlocal e-commerce and
personalized shopping optimization platform.

This service owns all business logic. The Next.js frontend is a presentation
layer only — it never calculates prices, totals, stock, discounts, payment
status or permissions.

---

## Stack

| Concern        | Technology                     |
| -------------- | ------------------------------ |
| Runtime        | Bun                            |
| Framework      | Fastify 5                      |
| Language       | TypeScript (strict)            |
| Validation     | Zod 4                          |
| ORM            | Drizzle ORM + Drizzle Kit      |
| Database       | Supabase PostgreSQL            |
| Auth           | Supabase Auth                  |
| File storage   | Supabase Storage               |
| Realtime       | Supabase Realtime              |
| Cache          | Redis (optional)               |
| Code quality   | Biome                          |
| Docs           | OpenAPI 3.1 / Swagger UI       |

---

## Getting started

```bash
cd backend

# 1. install dependencies
bun install

# 2. create your environment file
cp .env.example .env
#    then open .env and fill in the values (each one is documented inline)

# 3. run
bun run dev
```

The server starts even with an empty `.env`, so you can explore it immediately.
Anything that needs a missing credential reports `not_configured` on `/health`
and returns `503 SERVICE_UNAVAILABLE` instead of pretending to work.

| URL                              | Purpose                     |
| -------------------------------- | --------------------------- |
| `http://localhost:4000/health`   | Service + dependency status |
| `http://localhost:4000/api/v1`   | API index                   |
| `http://localhost:4000/docs`     | Swagger UI                  |
| `http://localhost:4000/docs/json`| Raw OpenAPI document        |

---

## Scripts

| Command              | What it does                                       |
| -------------------- | -------------------------------------------------- |
| `bun run dev`        | Development server with hot reload                 |
| `bun run start`      | Run without watching                               |
| `bun run build`      | Typecheck, then bundle to `dist/`                  |
| `bun run typecheck`  | `tsc --noEmit`                                     |
| `bun run check`      | Biome lint + format check                          |
| `bun run check:fix`  | Biome autofix                                      |
| `bun run test`       | Bun test runner                                    |
| `bun run verify`     | typecheck + check + test (run before every commit) |
| `bun run db:generate`| Generate SQL migrations from the Drizzle schema    |
| `bun run db:migrate` | Apply pending migrations                           |
| `bun run db:studio`  | Open Drizzle Studio                                |

---

## Project structure

```
backend/
├── drizzle/                  generated SQL migrations (committed)
├── src/
│   ├── server.ts             entry point: listen + graceful shutdown
│   ├── app.ts                buildApp() — used by the server and by tests
│   ├── routes.ts             registration point for every /api/v1 module
│   │
│   ├── config/
│   │   ├── env.ts            the ONLY place process.env is read
│   │   ├── constants.ts      fixed values (business config lives in the DB)
│   │   └── redis.ts          optional cache connection
│   │
│   ├── db/
│   │   ├── index.ts          Drizzle + PostgreSQL connection
│   │   └── schema/           table definitions (Phase B4)
│   │
│   ├── modules/              one folder per feature
│   │   └── health/
│   │
│   ├── plugins/              cors, security, error-handler, swagger
│   ├── errors/               AppError hierarchy + error codes
│   └── utils/                response envelope helpers
│
└── tests/
```

### Adding a module

1. Define the tables in `src/db/schema/`, re-export them from `schema/index.ts`.
2. `bun run db:generate`, review the SQL, `bun run db:migrate`.
3. Create `src/modules/<name>/` with `*.route.ts`, `*.service.ts`, `*.schema.ts`.
4. Register the route plugin in `src/routes.ts`.
5. `bun run verify`.

---

## Conventions

**Response envelope** — every endpoint returns the same shape:

```jsonc
// success
{ "success": true, "data": { } }

// list, with pagination
{ "success": true, "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }

// failure
{ "success": false, "error": { "code": "INSUFFICIENT_STOCK", "message": "…" } }
```

**Errors** — throw a class from `src/errors/app-error.ts`. The central handler
converts it to the envelope. Anything else becomes a generic `500`; stack traces
are never sent to clients in production.

**Validation** — every `params`, `query` and `body` is validated with Zod. The
same schema generates the OpenAPI docs, so the docs cannot drift from the code.

**Request tracing** — every response carries `X-Request-Id`, and every log line
for that request includes it.

**Never trust the client** for price, discount, delivery fee, stock, order
total, payment status or role. Recompute all of them server-side.

**Never log or return** passwords, access tokens, Supabase secrets, payment PINs
or OTPs. The logger redacts the sensitive fields it knows about.

---

## Database notes

`DATABASE_URL` comes from **Supabase → Connect → ORMs**:

- local development → *Session pooler* (port `5432`)
- serverless/Vercel → *Transaction pooler* (port `6543`)

The connection layer detects port `6543` automatically and disables prepared
statements, which transaction-mode pooling does not support.

Schema changes always flow through migration files — never edit the schema by
hand in the Supabase dashboard.

---

## Implementation status

Built so far (Phases **B1–B2** of the Backend Detailed Phase Plan):

- Fastify app factory, graceful shutdown, structured logging with redaction
- Zod-validated environment configuration with fail-fast in production
- CORS restricted to configured origins, Helmet security headers
- Central error handler + typed application errors
- Standard response envelope and pagination helpers
- OpenAPI 3.1 + Swagger UI generated from Zod schemas
- `/health` with real database and Redis probes
- Lazy Drizzle/PostgreSQL and Redis connections
- Smoke test suite

Next: **B3** database connectivity verification and **B4** schema design.
