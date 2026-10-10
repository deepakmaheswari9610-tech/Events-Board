# Community Events Board — Phase 1

A local events app built with Next.js App Router, TypeScript, MySQL and Prisma. Phase 1 establishes the database, 15 sample events and a responsive public board. Later features are intentionally unfinished at this checkpoint.

## Quick setup

Prerequisites: Node.js 20.9+ and Docker Desktop running (or an existing MySQL 8+ database). After dependencies and the MySQL image download, setup takes a few minutes.

```sh
npm ci
cp .env.example .env
docker compose up -d --wait
npm run db:setup
npm run dev
```

Open http://localhost:3000. If port 3306 is occupied, change the host port in `compose.yaml` and update `DATABASE_URL` accordingly. For an existing MySQL server, create a database and set its credentials in `.env`; skip Docker. URL-encode special characters in the database password. Never commit `.env`.

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

## API available in Phase 1

`GET /api/events` returns `{ events: [...] }` containing only active, upcoming events sorted by date, then ID. Dates are ISO UTC strings; prices are decimal strings to avoid precision loss. Database failures return HTTP 503 with `{ error: "..." }`. The browser fetches this JSON API, rather than accessing the database. Filtering and pagination will be added in Phase 3; this initial endpoint has no query parameters.

## Admin login

Not available in Phase 1. Phase 2 will add the admin account, login and server protection. No unprotected admin pages or write APIs exist in this phase.

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

Authentication is planned for Phases 2 and 4; no passwords or default admin credentials are seeded in Phase 1.
Only a `passwordHash` column exists; later phases will hash passwords with a salted password hashing function and never store plaintext.
Admin pages and every admin API will verify a signed session/token and ADMIN role on the server.
Visitor login will return a JWT; user-owned preference, reminder and design APIs will verify that token before accessing data.

## What remains

- Phase 2: admin login, server protection, add events and active/inactive toggle.
- Phase 3: combined category/city/search filters, pagination and event detail page.
- Phase 4: signup/login, JWT, favourite categories and My Feed.
- Phase 5: optimistic reminders with rollback and saved animated card designs.
- Phase 6: end-to-end checks, final README answers and recording.

The responsive layout and Indian date/price formatting are implemented. External Google Fonts and Unsplash images require internet; system font and coloured image fallbacks remain available. Dates are displayed in Asia/Kolkata.

## Phase 1 verification

TypeScript checks and the Next.js production build pass. Prisma client generation succeeds. Dependency installation reports zero vulnerabilities after pinning Prisma/client to compatible 6.12.0 versions. The home page returns HTTP 200 and the events API returns the expected HTTP 503 JSON error when MySQL is unavailable.

Database migration/seed execution remains unverified locally: Docker Desktop cannot start, and the installed native MySQL server crashes during initialization. Run the setup commands above with a working MySQL server. Responsive CSS is implemented, but phone/laptop browser visual checks have not been performed. A browser recording, GitHub repository and final submission are not part of this checkpoint.

Framework references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Prisma 6 seeding](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/seeding).
