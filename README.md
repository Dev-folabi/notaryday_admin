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

| Route          | Purpose                                    |
| -------------- | ------------------------------------------ |
| `/login`       | Admin sign in                              |
| `/overview`    | Platform KPIs: users, jobs, plan split     |
| `/users`       | List/search notaries                       |
| `/users/:id`   | User detail + plan change / suspend / reset|
| `/jobs`        | Cross-user job browse with filters         |
| `/system`      | Queues, imports, invoices, webhooks        |

## Notes

- Auth is a JWT Bearer token stored in `localStorage.admin_token`. The
  `src/proxy.ts` file does a light server-side presence check (cookie) for
  dashboard routes; real role enforcement happens client-side and, more
  importantly, on the API via the backend `AdminGuard`.
- Only users with `role: ADMIN` can use this app.
