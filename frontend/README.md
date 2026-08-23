# Fast Buy BD — your daily needs in discounted price (frontend demo)

A complete, frontend-first e-commerce experience for a university project: browse products by
category or store, see discounts, manage a cart, place a demo order, register/login, and try a
1 day free trial that converts to a ৳50/month membership.

The catalogue is deliberately limited to **sealed and packaged goods** — packaged food,
household and cleaning supplies, personal and baby care, kitchen items and everyday
electronics. No loose or perishable items are listed.

Everything runs in the browser. There is no backend, no database and no payment gateway.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript (strict) |
| Styling | Tailwind CSS 3 with a small custom design system |
| Icons | lucide-react |
| State | React Context (`cart`, `user`, `toast`) + localStorage |
| Images | Remote photos from Unsplash via `next/image` |

## Running the project

```bash
npm install     # once
npm run dev     # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```

Node 20.9+ is required (Next.js 16).

## Design system

The palette lives in `tailwind.config.ts` and is used through three token scales, so a rebrand
is a single file change:

| Token | Role | Base value |
| --- | --- | --- |
| `brand-*` | Primary — orange. Buttons, links, active nav, focus rings. | `brand-600` `#c74a07` |
| `accent-*` | Secondary — rose. Discount badges, cart count, alerts. | `accent-500` `#e11d48` |
| `ink-*` | Warm neutrals for text, borders and surfaces. | `ink-900` `#1c1917` |

`brand-600` and `accent-500` both clear 4.5:1 against white, so white button and badge labels
pass WCAG AA.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Home — hero, categories, deals, stores, popular products, trial promo |
| `/category/[slug]` | Category listing with filters + sort (10 categories) |
| `/store/[slug]` | Store page with that store's products (6 stores) |
| `/stores` | All partner stores |
| `/deals` | Every discounted product |
| `/product/[slug]` | Product details, gallery, quantity, related products (52 products) |
| `/search?q=` | Frontend search over name, category, store and tags |
| `/cart` | Cart with quantity controls and order summary |
| `/checkout` | Delivery form + demo payment method |
| `/checkout/success` | Order confirmation with demo order ID |
| `/login`, `/register` | Demo authentication |
| `/subscription` | Trial status, plans, subscribe action |
| `/account` | Demo profile, membership status, last order |
| `/about`, `/support`, `/terms`, `/privacy` | Footer content pages |

## Catalogue

10 categories, 52 products, 6 partner stores:

`grocery` · `packaged-food` · `snacks` · `beverages` · `frozen-food` · `household` ·
`personal-care` · `baby-care` · `home-kitchen` · `electronics`

## Project structure

```
src/
  app/            route segments (App Router)
  components/
    auth/ cart/ category/ footer/ header/ home/
    layout/ product/ store/ subscription/ ui/
  context/        cart, user (auth + subscription), toast providers
  data/           mock products, stores, categories
  lib/            constants, formatting, image helpers, storage helpers
  types/          Product, Store, Category, CartItem, User, Order, Subscription
```

## How the demo behaves

- **Cart** — persisted in `localStorage`, survives refresh. Delivery is ৳60, free over ৳1,000.
- **Discounts** — each product carries `price` / `originalPrice`; the percentage and savings are
  derived, so cards, cart and summaries always agree.
- **Auth** — registering or logging in creates a local demo user. Any valid looking email and a
  6+ character password is accepted; no password is ever stored.
- **Trial & subscription** — registration starts a 24 hour trial with a live countdown. When it
  expires the UI switches to "Trial expired" and offers the ৳50/month plan. Subscribing shows an
  activated state.
- **Orders** — placing an order generates a demo order ID, clears the cart and stores the summary
  for the confirmation and account pages.

## Known limitations (intentional)

- No server, database, real authentication, real payments or email.
- Product data is static mock data in `src/data/`.
- Only the most recent order is kept (no order history).
- Product photos are loaded from Unsplash, so first paint needs an internet connection; failed
  images fall back to a placeholder photo automatically.
