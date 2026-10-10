# Community Events Board — Phase 2

A local events app built with Next.js App Router, TypeScript, MySQL and Prisma. Phases 1 and 2 provide the database, 15 sample events, responsive public board and server-protected admin event management. Visitor accounts, filters, reminders and the card designer come in later phases.

## Quick setup

Prerequisites: Node.js 20.9+ and Docker Desktop running (or an existing MySQL 8+ database). After dependencies and the MySQL image download, setup takes a few minutes.

```sh
npm ci
cp .env.example .env
docker compose up -d --wait
# Replace JWT_SECRET in .env with the output of:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run db:setup
npm run db:admin
npm run dev
```

Open http://localhost:3000. If port 3306 is occupied, change the host port in `compose.yaml` and update `DATABASE_URL` accordingly. For an existing MySQL/phpMyAdmin server, set `DATABASE_URL` in `.env` to its credentials and port; skip Docker. For example, a local server with root/root credentials uses `mysql://root:root@127.0.0.1:3306/community_board`. Create the database if it does not exist. URL-encode special characters in the database password. Never commit `.env`.

```sql
CREATE DATABASE community_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run `npm run db:setup` to generate the client, apply the checked-in migration and seed data. `npm run db:seed` can be rerun: it updates only the 15 stable sample IDs. Sample dates are recalculated relative to today in IST. The seed contains 11 active upcoming events, two inactive upcoming events and two past events, covering Music, Workshop, Food, Sports and Kids in Coimbatore, Chennai and Bengaluru.

## Commands

- `npm run dev`: development server.
- `npm run typecheck`: TypeScript checks.
- `npm run build`: production build.
- `npm run start`: serve the production build.
- `npm run db:setup`: generate client, deploy migrations and seed.
- `npm run db:seed`: refresh sample events.
- `npm run db:admin`: create/update the configured admin account with a salted password hash.
- `npm run test:phase2`: run integration checks with the app running at http://127.0.0.1:3001 (`npm run dev -- --port 3001`); set `TEST_BASE_URL` for another URL. Creates and removes one temporary test fixture.

## JSON API

`GET /api/events` returns `{ events: [...] }` containing only active, upcoming events sorted by date, then ID. Dates are ISO UTC strings; prices are decimal strings to avoid precision loss. Database failures return HTTP 503 with `{ error: "..." }`. The browser fetches this JSON API, rather than accessing the database. Filtering and pagination will be added in Phase 3; this initial endpoint has no query parameters.

Admin endpoints (protected routes accept the browser session cookie or bearer token):

| Method | Endpoint                | Behaviour                                                                   |
| ------ | ----------------------- | --------------------------------------------------------------------------- |
| POST   | `/api/admin/login`      | `{ email, password }`; returns JWT and admin identity, sets session cookie. |
| POST   | `/api/admin/logout`     | Clears the browser session cookie.                                          |
| GET    | `/api/admin/events`     | All events including inactive and past. Requires admin.                     |
| POST   | `/api/admin/events`     | Creates an active event. Requires admin.                                    |
| PATCH  | `/api/admin/events/:id` | `{ active: boolean }`; changes status. Requires admin.                      |

Create requests use `{ title, category, city, startsAt, price, description, imageUrl }`. `startsAt` is an ISO timestamp with timezone; `price` is a non-negative decimal string. Errors return JSON `{ error }` with 400 (validation), 401 (authentication), 403 (foreign origin), 404 (missing event), or 503 (service unavailable). No admin data is exposed before authorization.

## Admin login

Open `/admin/login` (or click Admin in the header). The example local credentials are:

- Email: `admin@community.local`
- Password: `CommunityAdmin@123`

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run `npm run db:admin`. The script refuses to promote an existing visitor account and can be rerun to change the admin password. Use your own credentials for a deployment. `JWT_SECRET` must be at least 32 characters; generate a unique value using the command above.

After login, `/admin` lets you add an event and make any event Active or Inactive. New events are active. Dates entered in the form are IST and stored as UTC. No delete API or button is provided.

## Database structure and design

`User` stores a unique email, password hash and role; `Event` stores category, city, UTC start time, decimal INR price and active status.
`FavouriteCategory` and `Reminder` use composite keys to prevent duplicate preferences and reminders.
`CardDesign` stores one theme and a JSON sticker array per user/event; the API will validate its maximum of three stickers in Phase 5.
Foreign keys keep references valid, while events are deactivated rather than deleted. These tables prepare later phases without implementing their features yet.

## Filters and indexes

The current query combines `active = true` with `startsAt >= now` and sorts by start time and ID.
Phase 3 will add category, city and text conditions to the same AND query, together with pagination.
The schema includes `(active, startsAt)` and `(active, category, city, startsAt)` indexes for the basic listing and common combined filters.
Substring search will not benefit from those indexes; for a larger dataset, consider MySQL FULLTEXT indexing with documented search semantics.

## Passwords and admin protection

Passwords use Node.js scrypt (N=32768, r=8, p=1) with a random 16-byte salt and constant-time hash comparison; plaintext passwords are not stored in MySQL.
Login signs an eight-hour HS256 JWT with an issuer, audience and expiry, and sets an HttpOnly, SameSite=Strict cookie (Secure in production).
The admin page and each event API verify the JWT and recheck the current ADMIN role in MySQL; mutation APIs also validate JSON and reject foreign origins.
Mobile clients can send the returned token as `Authorization: Bearer <token>`. Logout clears the browser cookie; issued bearer tokens expire naturally. Visitor authentication is Phase 4.

## What remains

- Phase 3: combined category/city/search filters, pagination and event detail page.
- Phase 4: signup/login, JWT, favourite categories and My Feed.
- Phase 5: optimistic reminders with rollback and saved animated card designs.
- Phase 6: end-to-end checks, final README answers and recording.

The responsive layout and Indian date/price formatting are implemented. External Google Fonts and Unsplash images require internet; system font and coloured image fallbacks remain available. Dates are displayed in Asia/Kolkata.

## Verification

TypeScript checks and the Next.js production build pass. Prisma client generation succeeds. Dependency installation reports zero vulnerabilities after pinning Prisma/client to compatible 6.12.0 versions. The home page returns HTTP 200 and the events API returns the expected HTTP 503 JSON error when MySQL is unavailable.

The initial migration has been applied successfully to the local `community_board` MySQL database, 15 sample events are seeded, and the admin account is created. Phase 2 integration checks pass for page/API protection, successful/failed login, password hashing, cookies, expired/tampered/wrong-role tokens, request validation, creation, saved Active/Inactive status, public visibility, unsupported DELETE requests and logout. The temporary test fixture is removed afterward.

Responsive CSS is implemented, but phone/laptop browser visual checks have not been performed. Recording and GitHub submission remain for Phase 6.

Framework references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Prisma 6 seeding](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/seeding).
