# Lead Gen Platform — Backend

This turns the frontend MVP from demo-only into a real, deployable product with
a real database, real email, and a real (if minimal) admin auth system.

## What's included

- `pages/api/leads/` — create lead (auto-matches approved providers), list, update status/assignment
- `pages/api/providers/` — register, list, approve/reject (admin)
- `pages/api/categories.js` — category lookup
- `pages/api/admin/login.js` — real admin login (replaces the hardcoded `admin123`)
- `lib/db.js` — Postgres connection pool
- `lib/notify.js` — email via Resend, WhatsApp stub (Business Cloud API)
- `lib/auth.js` — JWT-based admin session

## Setup (from scratch, ~30 minutes)

1. **Get a Postgres database.** Easiest options: [Supabase](https://supabase.com) or
   [Neon](https://neon.tech) — both have a free tier and give you a `DATABASE_URL`
   instantly.
2. **Run the schema** — open the SQL editor in Supabase/Neon and paste the contents
   of `schema.sql` (from the earlier deliverable). This creates all tables and seeds
   10 starter categories. Also insert a few rows into `service_areas` for your cities.
3. **Create an admin user manually** (no signup UI yet, by design):
   ```sql
   -- generate a bcrypt hash first (e.g. via https://bcrypt-generator.com, cost 10)
   INSERT INTO admin_users (full_name, email, password_hash)
   VALUES ('Your Name', 'you@yourdomain.com', '<bcrypt-hash-here>');
   ```
4. **Copy `.env.example` to `.env.local`** and fill in `DATABASE_URL` and `JWT_SECRET`
   at minimum. Email/WhatsApp can stay blank — they'll no-op safely until configured.
5. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
6. **Wire the frontend to these routes.** In `leadgen-mvp.jsx`, replace the
   `window.storage` calls with `fetch("/api/leads")`, `fetch("/api/providers")`, etc.
   This is the one piece of manual work left — the artifact was built as a
   self-contained demo, so its data layer needs to point at real endpoints instead.

## Deploying

- **Vercel** is the easiest host for this (it's a Next.js app) — connect your GitHub
  repo, add the same env vars in the Vercel dashboard, deploy.
- Point your domain (once chosen) at the Vercel deployment.

## What's still manual / not automated here

- **Email**: works once `RESEND_API_KEY` is set — verify a sending domain in Resend first.
- **WhatsApp**: `sendWhatsApp()` is wired up but requires Meta Business verification
  and a WhatsApp Business phone number — this typically takes a few days to approve.
  Until then, the frontend's `wa.me` links work fine as a manual stand-in.
- **Provider self-registration of categories/cities** in this API accepts arrays
  (`categoryIds`, `serviceAreaIds`) — the current frontend form only sends one of each;
  extend the form if you want multi-category providers.
- **Rate limiting / spam protection** on the public POST endpoints (leads, providers)
  — add something like Vercel's built-in rate limiting or a simple honeypot field
  before this goes live publicly, or you'll get spam leads.
