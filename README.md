# Velariq Fashion — E-commerce App

Online fashion store for **[velariqfashion.com](https://velariqfashion.com)**, built with the MERN stack.
Prices are in Bangladeshi Taka (৳ / BDT).

The repository holds three separately deployed apps:

| App | Folder | Live URL | Stack |
|---|---|---|---|
| Storefront | [`frontend/`](frontend) | https://velariqfashion.com | React 18 + Vite + Tailwind CSS |
| Admin panel | [`admin/`](admin) | https://admin.velariqfashion.com | React 18 + Vite + Tailwind CSS |
| API | [`backend/`](backend) | https://api.velariqfashion.com | Node.js + Express + MongoDB (Mongoose) |

Media is stored on **Cloudinary**, card payments go through **Stripe**, and emails are sent over **SMTP** (Hostinger mail).

---

## Features

### Storefront
- Home page with an auto-playing hero slider, **Latest Collections** (30 newest products) with **ALL / MEN / WOMEN / KID** filter pills and a per-category **View all** link, and Best Sellers
- Collection page with category / sub-category filters, search and price sorting
- Product page with a photo gallery — the **photo the customer picks is the one carried to the cart, checkout and order** (useful when one product has several colours)
- Per-product **discounts**: `-23%` badge on the photo, "Save ৳…" pill, sale price with the original struck through
- Per-product **size chart** with **INCH / CM** tabs
- Slide-in **cart drawer**; guest carts survive page refreshes and are merged into the account on sign-in
- Checkout with floating labels, inline validation, phone country code, **Inside / Outside Dhaka** shipping, **Cash on Delivery** or **card (Stripe)**
- **Guest checkout** (no account needed) or signed-in checkout
- Accounts with **email verification** and **password reset** via 6-digit codes
- Optional **Meta Pixel** (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase)
- Light / dark theme toggle, sticky header, mobile layouts

### Admin panel
- Add, **edit** and delete products (images auto-cropped to **390 × 450**, discount %, size chart, sizes, bestseller flag); newest products listed first
- Orders newest first with item photos, status updates, **delete order**, **Export to Excel**, guest-order badge
- **New-order notification bell** with unread count
- Automatic sign-out on session expiry and after 30 minutes of inactivity

### Security
- JWT **access + refresh tokens in httpOnly cookies** (no tokens in `localStorage`), refresh-token rotation with reuse detection
- Prices, discounts and shipping fees are always calculated **on the server**
- Stripe payments are verified with Stripe, never trusted from the browser
- CORS origin allowlist and an Origin check on state-changing requests (CSRF protection)

---

## Project structure

```
E-commerce_App/
├── backend/
│   ├── app.js              Express app: middleware, CORS, routes
│   ├── server.js           Entry point: connects MongoDB + Cloudinary, starts the server
│   ├── config/             MongoDB, Cloudinary and SMTP mailer setup
│   ├── controllers/        Route handlers (auth, user, product, cart, order)
│   ├── middleware/         Auth (customer / admin / optional), file upload
│   ├── models/             Mongoose models (user, product, order, refresh token)
│   ├── routes/             /api/auth, /api/user, /api/product, /api/cart, /api/order
│   └── utils/              Session cookies, pricing, size-chart validation
├── frontend/               Customer storefront (Vite + React)
│   └── src/
│       ├── pages/          Home, Collection, Product, Cart, PlaceOrder, Orders, Login, Verify …
│       ├── components/     Navbar, Hero, CartDrawer, ProductItem, SizeChart …
│       ├── context/        ShopContext (products, cart, session)
│       ├── authClient.js   Cookie session + automatic token refresh
│       ├── cartKey.js      Cart line = product + size + picked photo
│       ├── pricing.js      Sale-price helpers
│       └── metaPixel.js    Meta Pixel events
├── admin/                  Admin panel (Vite + React)
│   └── src/
│       ├── pages/          Add, List, Orders
│       ├── components/     Navbar, Login, EditProductModal, SizeChartEditor, OrderNotifications …
│       └── session.js      Admin cookie session, refresh, inactivity sign-out
└── CLAUDE.md               Detailed deployment and architecture notes
```

---

## Getting started (local development)

**Requirements:** Node.js 22+, a MongoDB Atlas database, a Cloudinary account and (for card payments) a Stripe test key.

### 1. Install

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

### 2. Environment variables

Create a `.env` file in each app folder. `.env` files are git-ignored — **never commit them**.

**`backend/.env`**

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URL` | yes | MongoDB connection string (without the database name; `/e-commerce` is appended) |
| `JWT_SECRET` | yes | Long random string used to sign session tokens |
| `ADMIN_EMAIL` | yes | Admin panel login email |
| `ADMIN_PASSWORD` | yes | Admin panel login password |
| `CLOUDINARY_NAME` | yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | yes | Cloudinary API key |
| `CLOUDINARY_SECRET_KEY` | yes | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | yes | Stripe secret key (`sk_test_…` for testing) |
| `SMTP_HOST` | for sign-up / reset | e.g. `smtp.hostinger.com` |
| `SMTP_PORT` | for sign-up / reset | e.g. `465` |
| `SMTP_USER` | for sign-up / reset | Sender mailbox, e.g. `no-reply@velariqfashion.com` |
| `SMTP_PASS` | for sign-up / reset | Password of that mailbox |
| `MAIL_FROM` | optional | e.g. `Velariq Fashion <no-reply@velariqfashion.com>` |
| `ALLOWED_ORIGINS` | optional | Extra comma-separated origins allowed to call the API |

Do not set `PORT` in production — the host assigns it (it defaults to `4000` locally).

**`frontend/.env`**

```
VITE_BACKEND_URL=http://localhost:4000
# optional: VITE_META_PIXEL_ID=<your Meta Pixel ID>
```

**`admin/.env`**

```
VITE_BACKEND_URL=http://localhost:4000
```

### 3. Run

```bash
# API on http://localhost:4000 (auto-restarts on changes; or: npm start)
cd backend && npm run server

# Storefront on http://localhost:5173
cd frontend && npm run dev

# Admin panel on another port, e.g. 5174
cd admin && npm run dev -- --port 5174
```

`localhost:5173` and `localhost:5174` are already on the API's CORS allowlist.

> **Tip:** if the API fails locally with `querySrv ECONNREFUSED`, the network's DNS is blocking MongoDB SRV lookups.
> Switch DNS to `8.8.8.8` / `1.1.1.1` (or use another network). Production is not affected.

---

## API overview

All endpoints are under `/api`. Sessions use httpOnly cookies, so clients must send credentials (`withCredentials: true`).

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/refresh`, `/auth/logout`, `/auth/admin/refresh`, `/auth/admin/logout` |
| Users | `POST /user/register`, `/user/login`, `/user/verify-email`, `/user/resend-verification`, `/user/forgot-password`, `/user/reset-password`, `/user/admin` |
| Products | `GET /product/list`, `POST /product/single`; admin: `/product/add`, `/product/update`, `/product/remove` |
| Cart (signed in) | `POST /cart/get`, `/cart/add`, `/cart/update` |
| Orders | `POST /order/place` (COD), `/order/stripe`, `/order/verifyStripe` (guests or customers); `/order/userorders` (customers); admin: `/order/list`, `/order/status`, `/order/delete`, `/order/recent` |

`GET /` returns `API Working` (health check).

---

## Deployment

All three apps run on **Hostinger Web Apps** with auto-deployment: every push to `main` rebuilds the backend, storefront and admin.

- Set the backend variables above in **hPanel → Web Apps → backend → Environment variables**.
- Set `VITE_BACKEND_URL=https://api.velariqfashion.com` (and optionally `VITE_META_PIXEL_ID`) for the frontend and admin. Vite builds these into the bundle, so **redeploy after changing them**.
- `public/.htaccess` in `frontend/` and `admin/` rewrites deep links (e.g. `/collection`) to `index.html`.
- If a new domain or port needs API access, add it to the CORS allowlist in `backend/app.js` or to `ALLOWED_ORIGINS`.

See [`CLAUDE.md`](CLAUDE.md) for detailed hosting, DNS and authentication notes.

---

## Contributing workflow

1. Create a branch from `main`.
2. Make the change and check it locally (`npm run build` in `frontend/` and `admin/`).
3. Open a pull request into `main`; merging deploys to production.
