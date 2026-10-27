# Project Context — E-commerce_App (velariqfashion.com)

## Overview
MERN e-commerce store ("FOREVER" fashion brand). Monorepo with three apps
deployed separately. Currency is BDT (৳). Owner: Pial Hassan Chowdhury (GitHub: pial36).

## Repo structure

```
E-commerce_App/
├── backend/     Express API      → api.velariqfashion.com
├── frontend/    Vite + React     → velariqfashion.com      (customer storefront)
├── admin/       Vite + React     → admin.velariqfashion.com (admin panel)
└── .gitignore
```

Single private GitHub repo: `pial36/E-commerce_App`, branch `main`.

## Live deployment

| App | URL | Host | Root dir | Framework |
|---|---|---|---|---|
| backend | https://api.velariqfashion.com | Hostinger Web Apps | `backend` | Express |
| frontend | https://velariqfashion.com | Hostinger Web Apps | `frontend` | Vite |
| admin | https://admin.velariqfashion.com | Hostinger Web Apps | `admin` | Vite |

- **Hosting:** Hostinger, "Unlimited" plan, Web Apps feature (hPanel → Websites → Web Apps)
- **Domain:** registered at Namecheap, nameservers pointed to Hostinger
  (`nova.dns-parking.com`, `cosmos.dns-parking.com`), so DNS is managed in hPanel
- **Database:** MongoDB Atlas, cluster `cluster0.swy72.mongodb.net`, user `pialhassan`
  - Atlas org: "Pial's Org - 2024-10-20" (NOT the 2026 org, which is empty)
  - Network Access set to allow 0.0.0.0/0 (required for Hostinger to connect)
- **Media:** Cloudinary
- **Payments:** Stripe (currently TEST keys — `sk_test_...`), Razorpay/bKash/Nagad
  logos present in frontend assets
- **Node version:** 22.x on all three apps
- **Auto-deployment:** ON. Any push to `main` rebuilds all three Web Apps.

## Environment variables

### backend (set in Hostinger → Environment variables, 13 keys)
```
MONGODB_URL
CLOUDINARY_API_KEY
CLOUDINARY_SECRET_KEY
CLOUDINARY_NAME
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
STRIPE_SECRET_KEY
SMTP_HOST        # smtp.hostinger.com
SMTP_PORT        # 465
SMTP_USER        # no-reply@velariqfashion.com (Hostinger mailbox)
SMTP_PASS        # that mailbox password
MAIL_FROM        # optional, e.g. Velariq Fashion <no-reply@velariqfashion.com>
```
The SMTP_* keys send sign-up verification and password-reset codes. Without them
sign-up fails with "Email service is not configured" and no account is created.
Do NOT set `PORT` — Hostinger assigns it; `server.js` reads `process.env.PORT || 4000`.

### frontend and admin
```
VITE_BACKEND_URL = https://api.velariqfashion.com
```
Frontend only, optional:
```
VITE_META_PIXEL_ID = <Meta Pixel ID>   # enables the Meta Pixel (frontend/src/metaPixel.js); unset = pixel off
```
Vite inlines this at BUILD time. Changing it requires a rebuild, not just a restart.
Local `.env` files still point to `http://localhost:4000` — that is intentional for dev.

## Key backend details (`backend/app.js` + `backend/server.js`)
- ES modules (`import` syntax, `"type": "module"`)
- Entry file: `server.js` (connects MongoDB/Cloudinary and listens), start script: `node server.js`.
  The Express app itself (middleware + routes) is built in `app.js`.
- Routes mounted at: `/api/auth`, `/api/user`, `/api/product`, `/api/cart`, `/api/order`
- Health check: `GET /` returns "API Working"
- Config files: `config/mongobdb.js`, `config/cloudinary.js`, `config/mailer.js`
- CORS (in `app.js`) uses an explicit origin allowlist with `credentials: true`:
  `https://velariqfashion.com`, `https://www.velariqfashion.com`,
  `https://admin.velariqfashion.com`, `http://localhost:5173`, `http://localhost:5174`,
  plus any comma-separated origins in the optional `ALLOWED_ORIGINS` env var.
  Non-GET requests whose `Origin` isn't on the list get 403 (CSRF protection).
  **If a new domain or port is added, it must be added here or requests will be blocked.**

## Authentication (JWT access + refresh tokens in httpOnly cookies)
- No tokens in `localStorage` or headers; the browser sends cookies (`axios.defaults.withCredentials = true`).
- Customer cookies `vf_at` / `vf_rt`; admin cookies `vf_admin_at` / `vf_admin_rt` (separate names because
  store and admin call the same API host). All `HttpOnly`, `SameSite=Lax`, `Secure` over https.
- Access token: JWT `{ sub, role, type:'access' }`, 15 min, path `/`. Checked by `middleware/auth.js`
  and `middleware/adminAuth.js`, which answer **401** when it's missing/expired.
- Refresh token: random string, path `/api/auth`, stored hashed in the `refreshtokens` collection
  (`models/refreshTokenModel.js`, TTL index cleans up expired rows). Rotated on every refresh; reuse of an
  already-rotated token after a 30 s grace window revokes all of that account's sessions.
  Customers: 30 days, sliding. Admin: 1 day from sign-in, not extended.
- Endpoints: `POST /api/auth/refresh`, `/api/auth/logout`, `/api/auth/admin/refresh`, `/api/auth/admin/logout`.
  Logic lives in `utils/authSession.js`.
- Frontends: `frontend/src/authClient.js` and `admin/src/session.js` call refresh on page load (to learn
  whether someone is signed in) and retry a request once after a 401 via an axios interceptor.
- Password reset revokes every session for that account. Admin panel also signs out after 30 min idle.
- `app.set('trust proxy', 1)` is required so `req.secure` is true behind Hostinger's HTTPS proxy.
- `backend/vercel.json` is leftover from an old Vercel deployment and is unused.

## Known issues / gotchas

1. **SPA refresh 404s** — React Router deep links (e.g. `/collection`) 404 on refresh
   because the server looks for a real file. Fixed by `public/.htaccess` in both
   `frontend/` and `admin/` with a rewrite-to-index.html rule. Vite copies `public/`
   into `dist/` at build. **Status: fix applied — verify it actually works; if Hostinger
   serves via nginx rather than Apache, .htaccess is ignored and a build-setting
   rewrite rule is needed instead.**

2. **Local `npm start` fails with `querySrv ECONNREFUSED`** — this is a LOCAL DNS issue
   (ISP blocking SRV lookups for `mongodb+srv://`), not a credentials problem.
   Fix: set DNS to 8.8.8.8 / 8.8.4.4, or use a mobile hotspot. Production is unaffected.

3. **Hostinger Web Apps cannot change their domain after creation.** To move an app to a
   different domain, delete and redeploy it. Env vars must be re-imported.

4. **Subdomain conflicts** — a subdomain created under Domains → Subdomains is a
   *folder-based* (PHP/HTML) subdomain and BLOCKS a Web App from using that name.
   Delete it first, then let the deploy wizard create the subdomain itself.

5. **Deploy wizard guesses wrong defaults** — it has auto-detected the wrong root
   directory and framework preset multiple times. Always verify root dir and framework
   on the review screen before deploying.

6. **Frontend bundles ~50 product images** (~100KB each) into `dist/assets/`, several MB
   of build output. Cloudinary is already in the stack; moving product images there would
   substantially improve load times, especially on mobile. Not yet done.

7. **Dependencies are ~2 years old.** `npm audit` reports 32 vulnerabilities (mostly in
   build tooling, which does not ship to users). Do NOT run `npm audit fix --force` —
   it will break the working build. Upgrade deliberately, on a branch, if at all.

8. **An unused WordPress site** (`royalblue-butterfly-478729.hostingersite.com`) exists on
   the same Hostinger account consuming resources. Unrelated to this project; should be
   deleted.

## Security notes
- All credentials (MongoDB, Cloudinary, JWT, Stripe, admin password) were rotated on
  2026-10-22 after being exposed. The current values are the rotated ones.
- `JWT_SECRET` must be a long random string, never a guessable word.
- MongoDB passwords should be alphanumeric only — special characters like `@` break
  `mongodb+srv://` connection strings unless URL-encoded (`@` → `%40`).
- `.env` is gitignored and must stay that way.
- Stripe is on test keys. Before accepting real payments, swap to live keys and
  confirm webhook handling.

## Deployment workflow
Push to `main` → Hostinger auto-rebuilds all three apps. No manual deploy step.
To redeploy without a code change: hPanel → the app → **Redeploy**.
Build logs and crash output: hPanel → the app → **Runtime logs**.
