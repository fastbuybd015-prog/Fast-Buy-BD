# Fast Buy BD

Fast Buy BD is a monorepo with a Next.js storefront in `frontend/` and a Fastify API in `backend/`.

## Deploy the storefront to Vercel

The frontend is a Next.js app and can be deployed directly to Vercel. The current storefront is a frontend demo: it uses local browser storage and mock catalogue data, so it does not require backend credentials or environment variables to build and run.

1. Import `fastbuybd015-prog/Fast-Buy-BD` into Vercel.
2. In **Project Settings → General → Root Directory**, select `frontend` and save.
3. Keep the framework preset as **Next.js**. Vercel will detect the install and build commands from `frontend/package.json` (`npm install` / `npm run build`).
4. Deploy. Every push to `main` will deploy automatically once the Git repository is connected.

You can also deploy from a local checkout:

```bash
cd frontend
npm install
npm run build
npx vercel
```

The `frontend/` directory contains the Vercel framework configuration. No secrets should be added as `NEXT_PUBLIC_*` values; the demo currently has no required frontend environment variables.

## Backend

`backend/` is a separate Bun + Fastify API, not part of the Next.js Vercel deployment. It expects server-side environment variables and a PostgreSQL/Supabase database; see [`backend/README.md`](backend/README.md) and [`backend/.env.example`](backend/.env.example). Deploy it to a Bun-compatible host separately, then configure the frontend to use it only after API integration has been implemented.

## Local development

```bash
cd frontend
npm install
npm run dev
```

For API development and setup, see [`backend/README.md`](backend/README.md).
