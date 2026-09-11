# Notary Day — Admin Console

Internal admin dashboard for the Notary Day platform. A separate Next.js app
(repo) that talks to the shared `notaryday_backend` API's `/admin/*` endpoints.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- React Query + Zustand + axios

## Getting started

```bash
npm install
cp .env.example .env   # set NEXT_PUBLIC_API_URL
npm run dev            # http://localhost:3001
```

Create the admin account (once) against the backend:

```bash
cd ../notaryday_backend
npx prisma db seed     # uses ADMIN_EMAIL / ADMIN_PASSWORD from backend .env
```

Sign in with that admin email/password.

## Routes

| Route                        | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `/login`                     | Admin sign in                                        |
| `/overview`                  | Platform KPIs: users, jobs, plan split               |
| `/users`                     | List/search notaries                                 |
| `/users/:id`                 | User detail + plan change / suspend / reset          |
| `/jobs`                      | Cross-user job browse with filters                   |
| `/system`                    | Queues, imports, invoices, webhooks, marketing health|
| `/marketing`                 | Marketing overview: lead stats, providers, imports   |
| `/marketing/leads`           | Lead CRM: filters, multi-select bulk actions, add, CSV export |
| `/marketing/leads/:id`       | Lead detail + profile edit + message editor + engagement timeline |
| `/marketing/campaigns`       | Campaign list with live send stats                   |
| `/marketing/campaigns/new`   | Campaign wizard: audience (filters/wave/lead picker/platform users), content (drafts, template or playbook angles), provider, pacing, preview |
| `/marketing/campaigns/:id`   | Campaign monitor: stats, per-step breakdown, recipients grid (CSV export), pause/resume/cancel |
| `/marketing/waves`           | Campaign wave planning + live progress per wave      |
| `/marketing/tasks`           | Social/phone outreach task queue (DM message, copy, done/skip) |
| `/marketing/analytics`       | Charts: activity over time, funnel, A/B results, sequence step health |
| `/marketing/providers`       | Email provider accounts (Brevo/Resend/Zoho/Gmail)    |
| `/marketing/imports`         | Upload xlsx/csv leads, column mapping wizard, history|
| `/marketing/unsubscribes`    | Suppression list: unsubscribes/bounces/complaints    |

Marketing data lives in MongoDB (separate from the Postgres app data) and is
processed by the backend's dedicated marketing worker process. Provider
credentials are AES-256-GCM encrypted at rest and never returned by the API.
Campaign sends are paced per-minute per provider with daily budgets, warmup
ramps, optional local 8–11 AM delivery, stop-on-reply, and automatic
unsubscribe/click/open tracking. Conversions (signups, CITT usage, Pro
upgrades) are matched back to CRM leads automatically; re-engagement
campaigns can target existing platform users by plan/activity.

## Notes

- Auth is a JWT Bearer token stored in `localStorage.admin_token`. The
  `src/proxy.ts` file does a light server-side presence check (cookie) for
  dashboard routes; real role enforcement happens client-side and, more
  importantly, on the API via the backend `AdminGuard`.
- Only users with `role: ADMIN` can use this app.
