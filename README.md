# Community Events Board — Phase 3

A local events app built with Next.js App Router, TypeScript, MySQL and Prisma. Phases 1–3 provide MySQL data, 15 sample events, a responsive public board with combined filters and pagination, event detail pages and server-protected admin management. Visitor accounts, reminders and the card designer come in later phases.

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

Run `npm run db:setup` to generate the client, apply the checked-in migrations and seed data. `npm run db:seed` can be rerun: it updates only the 15 stable sample IDs. Sample dates are recalculated relative to today in IST. The seed contains 11 active upcoming events, two inactive upcoming events and two past events, covering Music, Workshop, Food, Sports and Kids in Coimbatore, Chennai and Bengaluru.

## Commands

- `npm run dev`: development server.
- `npm run typecheck`: TypeScript checks.
- `npm run build`: production build.
- `npm run start`: serve the production build.
- `npm run db:setup`: generate client, deploy migrations and seed.
- `npm run db:seed`: refresh sample events.
- `npm run db:admin`: create/update the configured admin account with a salted password hash.
- `npm run test:phase3`: verify combined filters, literal search, pagination, API validation, detail visibility and Indian formatting using five temporary fixtures, removed afterward. Uses the same `TEST_BASE_URL` setting.
- `npm run test:phase2`: run integration checks with the app running at http://127.0.0.1:3001 (`npm run dev -- --port 3001`); set `TEST_BASE_URL` for another URL. Creates and removes one temporary test fixture.

## JSON API

`GET /api/events` returns `{ events: [...] }` containing only active, upcoming events sorted by date, then ID. Dates are ISO UTC strings; prices are decimal strings to avoid precision loss. Database failures return HTTP 503 with `{ error: "..." }`. The browser fetches this JSON API, rather than accessing the database. Optional query parameters are `category`, `city`, `q`, `page` (default 1) and `pageSize` (default 6, maximum 50). All filters work together. Search matches title, description or city, case-insensitively using the MySQL collation; `%`, `_` and backslash are treated literally. The response also includes `pagination: { page, pageSize, total, totalPages }`. Pages beyond the last page are clamped; an empty result has page 1 and totalPages 0. Invalid query values return HTTP 400.

Example: `/api/events?category=Music&city=Coimbatore&q=night&page=1&pageSize=6`.

`GET /api/events/options` returns categories and distinct cities with active upcoming events. `GET /api/events/:id` returns `{ event }` for an active upcoming event; inactive, past or missing events return 404. The public board and detail pages fetch these JSON APIs. Filters and the page number live in the URL so refresh and browser Back/Forward preserve them. Category/city changes apply immediately; submit text search with Search or Enter. Changing filters resets pagination to page 1.

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

`User` and `Event` have MySQL `INT AUTO_INCREMENT` primary keys; every `userId`/`eventId` foreign key is also `INT`, keeping relation indexes compact.
`User` stores a unique email, password hash and role; `Event` stores category, city, UTC start time, decimal INR price and active status.
`FavouriteCategory` and `Reminder` use composite keys to prevent duplicate preferences and reminders.
`CardDesign` stores one theme and a JSON sticker array per user/event; the API will validate its maximum of three stickers in Phase 5.
Foreign keys keep references valid, while events are deactivated rather than deleted. These tables prepare later phases without implementing their features yet.

## Filters and indexes

The Prisma query ANDs active/upcoming conditions with category and city, then adds an OR across title, description and city for text search.
It orders by `(startsAt, id)` and uses `skip`/`take`; the count and page query share a Repeatable Read transaction for a consistent response.
Existing `(active, startsAt)` and `(active, category, city, startsAt)` indexes support the base and combined listings; add `(active, city, startsAt)` if city-only searches become frequent.
A leading-wildcard substring search cannot use these indexes effectively; consider FULLTEXT for larger datasets, accepting its word-based search semantics.

## Passwords and admin protection

Passwords use Node.js scrypt (N=32768, r=8, p=1) with a random 16-byte salt and constant-time hash comparison; plaintext passwords are not stored in MySQL.
Login signs an eight-hour HS256 JWT with an issuer, audience and expiry, and sets an HttpOnly, SameSite=Strict cookie (Secure in production).
The admin page and each event API verify the JWT and recheck the current ADMIN role in MySQL; mutation APIs also validate JSON and reject foreign origins.
Mobile clients can send the returned token as `Authorization: Bearer <token>`. Logout clears the browser cookie; issued bearer tokens expire naturally. Visitor authentication is Phase 4.

## What remains

- Phase 4: signup/login, JWT, favourite categories and My Feed.
- Phase 5: optimistic reminders with rollback and saved animated card designs.
- Phase 6: end-to-end checks, final README answers and recording.

The responsive layout and Indian date/price formatting are implemented. External Google Fonts and Unsplash images require internet; system font and coloured image fallbacks remain available. Dates are displayed in Asia/Kolkata.

## Verification

TypeScript checks and the Next.js production build pass. Prisma client generation succeeds. Dependency installation reports zero vulnerabilities after pinning Prisma/client to compatible 6.12.0 versions. The home page returns HTTP 200 and the events API returns the expected HTTP 503 JSON error when MySQL is unavailable.

The initial migration and the data-preserving integer-ID migration have been applied successfully to the local `community_board` MySQL database, 15 sample events are seeded, and the admin account is created. Phase 2 integration checks pass for page/API protection, successful/failed login, password hashing, cookies, expired/tampered/wrong-role tokens, request validation, creation, saved Active/Inactive status, public visibility, unsupported DELETE requests and logout. The temporary test fixture is removed afterward.

Phase 3 API checks cover combined/case-insensitive/literal filters, tied-date ordering, pagination without duplicates, page clamping, empty results, invalid queries, city options, public detail visibility and Indian formatting. The admin checks also pass with the paginated API.

Responsive CSS is implemented, but phone/laptop browser visual checks have not been performed. Recording and GitHub submission remain for Phase 6.

Framework references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Prisma 6 seeding](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/seeding).

## Integer ID migration checkpoint

`20261010000200_integer_ids` converts User/Event IDs and all related foreign keys to integers without resetting the database. Sample events keep IDs 1–15, and other events use the auto-increment sequence from 16 onward. API event/user IDs are JSON numbers; URL parameters are validated and converted to integers. JWT subjects use the decimal ID encoded as a string, as required by JWT. Existing sessions from before the conversion require signing in again. A private pre-migration backup was saved locally and compared against the resulting database; all existing admin/event fields were preserved.
