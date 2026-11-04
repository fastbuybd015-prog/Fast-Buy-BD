# Fast Buy BD

## Project Contributors

| Name | Student ID |
|---|---|
| **MD Tanvir Ahmmed Sakib** | 41220300624 |
| **MH Shipon** | 41230100881 |
| **Zubair AL Hasan Zuba** | 41220300496 |

---

## Project Overview

Fast Buy BD is a monorepo-based e-commerce project consisting of a Next.js storefront in the `frontend/` directory and a Fastify API in the `backend/` directory.

The project provides an online shopping experience with product browsing, shopping cart management, product comparison, and other e-commerce functionalities.

## Deploy the Storefront to Vercel

The frontend is a Next.js application and can be deployed directly to Vercel.

**Important:** The current storefront is a frontend demo that uses local browser storage and mock catalogue data. Therefore, it does not require backend credentials or environment variables to build and run.

### Deployment Steps

1. Import `fastbuybd015-prog/Fast-Buy-BD` into Vercel.
2. Go to **Project Settings → General → Root Directory**.
3. Set the Root Directory to `frontend` and save the changes.
4. Keep the Framework Preset as **Next.js**.
5. Vercel will automatically detect the installation and build commands from `frontend/package.json`:
   - Install Command: `npm install`
   - Build Command: `npm run build`
6. Click **Deploy**.

Once the Git repository is connected, every push to the `main` branch will automatically trigger a new deployment.

### Deploy Using the Local Terminal

You can also deploy the frontend from a local repository checkout:

```bash
cd frontend
npm install
npm run build
npx vercel
```

### Environment Variables

The `frontend/` directory contains the Vercel framework configuration.

Currently, the storefront does not require any frontend environment variables or backend credentials.

Do not add unnecessary secrets as `NEXT_PUBLIC_*` environment variables because these variables are exposed to the browser.

## Backend Deployment

The `backend/` directory contains a separate **Bun + Fastify API**. It is not included in the Next.js Vercel deployment.

The backend requires:

- Bun runtime
- Server-side environment variables
- PostgreSQL / Supabase database configuration

For backend installation, configuration, and deployment instructions, refer to:

- `backend/README.md`
- `backend/.env.example`

The backend should be deployed separately to a Bun-compatible hosting platform.

After implementing API integration, the frontend can be configured to communicate with the deployed backend.

## Local Development

To run the frontend locally, follow these commands:

```bash
cd frontend
npm install
npm run dev
```

The development server will start, and you can access the application through the local URL displayed in your terminal.

For backend development and setup instructions, refer to `backend/README.md`.

## Project Structure

```text
Fast-Buy-BD/
│
├── frontend/       # Next.js storefront
│
├── backend/        # Bun + Fastify API
│
└── README.md       # Project documentation
```

## Technologies Used

- **Frontend:** Next.js, React
- **Backend:** Bun, Fastify
- **Database:** PostgreSQL / Supabase
- **Deployment:** Vercel (Frontend)
- **Version Control:** Git & GitHub

---

**Fast Buy BD — Online Shopping Made Easy.**
