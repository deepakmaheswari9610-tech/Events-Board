# Community Events Board

A community events app built with **Next.js App Router, TypeScript, MySQL and Prisma**. Admins manage events; visitors browse, choose favourite categories, save reminders and design event cards.

Repository: [Events-Board](https://github.com/deepakmaheswari9610-tech/Events-Board)

## Quick setup

Prerequisites: Node.js 20.9+ and a running MySQL 8+ server. Setup takes a few minutes after dependencies download.

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Create `.env.development.local` in the project root with:

   ```dotenv
   NODE_ENV=development
   APP_URL=http://localhost:3000
   DATABASE_URL="mysql://YOUR_MYSQL_USER:YOUR_MYSQL_PASSWORD@127.0.0.1:3306/community_board"
   JWT_SECRET="replace-with-your-generated-secret"
   ADMIN_EMAIL="admin@community.local"
   ADMIN_PASSWORD="CommunityAdmin@123"
   ```

   Generate a stable secret with the command below and paste its output into `JWT_SECRET`. Environment files are ignored by Git.

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Set `DATABASE_URL` to your local MySQL credentials and port. Create the database through MySQL or phpMyAdmin if needed:

   ```sql
   CREATE DATABASE community_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

   URL-encode special characters in database credentials.

4. Apply migrations, seed data and start the app:

   ```sh
   npm run db:setup
   npm run db:admin
   npm run dev
   ```

Open **http://localhost:3000**.

## Admin login

Open **`/admin/login`** with the credentials configured above:

- Email: `admin@community.local`
- Password: `CommunityAdmin@123`

The seed stores a salted password hash, validates the email/password and refuses to promote an existing visitor account. To change admin credentials, update the environment configuration and rerun `npm run db:admin`. Admin links are separate from visitor navigation.

## Implemented requirements

- Server-protected admin pages/APIs, event creation and Active/Inactive status; no event deletion.
- Public active upcoming events, nearest date first; category, city and text filters combine with pagination.
- Email/password signup and JWT login; saved favourite categories and personal upcoming-event feed.
- Optimistic reminders: immediate update, refresh persistence and rollback/error message when saving fails.
- Live event card designer: three themes, five sticker choices, up to three different stickers, removal, animations and saved choices per user/event.
- Responsive phone/laptop UI, loading/empty/error states, inline frontend validation and Indian prices/friendly dates.
- Admin editing, sorting and server pagination; database-backed categories/cities with inline creation, as requested during development.

Guests can preview card designs; saving requires login. Dates display in Asia/Kolkata. External Google Fonts and Unsplash images need internet; system fonts and coloured image fallbacks are available.

## Sample data

`prisma/seed.ts` creates **15 events**, five sample categories (Music, Workshop, Food, Sports, Kids) and three cities (Coimbatore, Chennai, Bengaluru).

| Sample group | Count |
| --- | --- |
| Active upcoming | 11 |
| Inactive upcoming | 2 |
| Past | 2: one active, one inactive |

All events include the required fields. Prices include free entry, ordinary paid events and a ₹1,50,000 group package to demonstrate Indian grouping. Dates are relative to the seed date in IST; past/inactive events stay in the admin view and are excluded from public results.

`npm run db:seed` refreshes the same sample event IDs 1–15, including their details/status/dates; it does not remove other events, cities, categories or visitor data. Rerun it before the demo to make samples upcoming again. Categories/cities are resolved by name and stored as integer foreign keys. `prisma/seed-admin.ts` creates/updates the configured admin separately.

## JSON API

Login/signup return `{ token, user }` and set an HttpOnly browser cookie. Protected routes also accept `Authorization: Bearer <token>` for mobile clients.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/events` | Active upcoming listing; `categoryId`, `cityId`, `q`, `page`, `pageSize`. |
| GET | `/api/events/options` | Category and city records for filters. |
| GET | `/api/events/:id` | Active upcoming event details. |
| GET | `/api/categories`, `/api/cities` | Lists of `{ id, name }` records. |
| POST | `/api/auth/signup`, `/api/auth/login` | Visitor account creation/login; JWT returned. |
| POST | `/api/auth/logout` | Clear visitor cookie. |
| GET | `/api/auth/me` | Authenticated visitor identity for API clients. |
| GET / PUT | `/api/favourites` | Read preferences / replace `{ categoryIds: [1, 3] }`. |
| GET | `/api/feed` | Active upcoming events in saved categories; paginated. |
| GET / PUT | `/api/events/:id/reminder` | Read/save `{ reminded: true }`. |
| GET / PUT | `/api/events/:id/design` | Read/save `{ theme: "OCEAN", stickers: ["STAR", "MUSIC"] }`. |
| POST | `/api/admin/login`, `/api/admin/logout` | Admin login / clear cookie. |
| GET / POST | `/api/admin/events` | Paginated management listing / create event. |
| PATCH | `/api/admin/events/:id` | Full event details or `{ active: false }`. |
| POST | `/api/admin/categories`, `/api/admin/cities` | Create `{ name }`; duplicates return 409. |

Create/edit input: `{ title, categoryId, cityId, startsAt, price, description, imageUrl }`. IDs are numbers, price is a decimal string and startsAt is an ISO timestamp with timezone. Event creation requires a future date; editing also requires a future date. Editing preserves status and relations.

Public/feed responses include `{ events, pagination: { page, pageSize, total, totalPages } }`; feed also includes category records. Event responses contain IDs and display names. Obtain category/city IDs from their APIs rather than assuming IDs. Public/feed page size defaults to 6; admin defaults to 10; maximum is 50. Out-of-range pages are clamped. Name-based `category`/`city` query parameters remain supported for existing links.

Admin filters: `q`, `status=all|active|inactive`, `sort=date-asc|date-desc|title-asc|price-asc|price-desc`, `page`, `pageSize`. Response includes global `stats`. Errors return JSON `{ error }` with appropriate validation/authentication/not-found/conflict/service-unavailable status codes.

## Database structure — why this design? (answer 1)

`User`, `Event`, `Category` and `City` have integer auto-increment IDs; events reference category/city IDs instead of fixed enum names.\
Users store unique emails, password hashes and roles; events store UTC dates, decimal INR prices, descriptions, images and active status.\
Favourites use `(userId, categoryId)`; reminders/designs use `(userId, eventId)` composite keys to prevent duplicates and isolate user choices.\
Foreign keys preserve relations; categories/cities can grow without migrations, and deactivation keeps event history. Designs store a theme and validated JSON sticker array.

## Filter query and index choice (answer 2)

Prisma ANDs active/upcoming conditions with category/city IDs, then uses a nested OR for title, description and city-name search.\
Search is case-insensitive under MySQL collation and treats `%`, `_` and backslash literally; ordering uses `(startsAt, id)` for stable pages.\
Count and page queries share a Repeatable Read transaction; indexes cover `(active, startsAt)` and `(active, categoryId, cityId, startsAt)`.\
I would add `(active, cityId, startsAt)` for frequent city-only filtering; large-scale substring search could use FULLTEXT with different matching semantics.

## Passwords and admin protection (answer 3)

Passwords use scrypt (N=32768, r=8, p=1), a random 16-byte salt and constant-time comparison; plaintext passwords are not stored.\
Login signs an eight-hour HS256 JWT with issuer, audience and expiry; browser cookies are HttpOnly, SameSite=Strict and Secure in production.\
Admin pages and APIs verify the token and recheck the ADMIN role in MySQL; visitor sessions have separate cookies/audiences and ownership checks.\
Mutation APIs validate JSON and reject foreign origins; frontend checks improve usability while server validation remains authoritative.

## Project structure

```text
src/app/(admin)/        Admin pages
src/app/(user)/         Visitor pages and shared visitor layout
src/app/api/           JSON endpoints for browser/mobile clients
src/components/admin/  Admin sidebar, forms, table and scoped CSS
src/components/user/   Visitor authentication, navigation, favourites and feed
src/components/events/ Shared event cards, listing, details and designer
src/components/shared/ Pagination and field errors
src/hooks/admin/       Admin API state
src/hooks/shared/      Catalogue loading and frontend validation
src/lib/               Auth, transport, schemas, queries, formatting and DB helpers
prisma/                Schema, four migrations and seed entry points
```

Route groups preserve public URLs. Shared transport, schemas, catalogue controls, pagination and server authentication avoid duplication. No JWT or credentials are stored in localStorage. Visitor identity initializes on the server, so guests do not make an unnecessary `/api/auth/me` request.

## Checks and production

```sh
npm run typecheck
npm run build
```

For production, provide a separate `.env` on the server or deployment environment variables with live DATABASE_URL, a stable JWT_SECRET and admin credentials. Use `NODE_ENV=production` for production database commands:

```sh
NODE_ENV=production npm run db:generate
NODE_ENV=production npm run db:migrate
NODE_ENV=production npm run db:admin
npm run build
npm run start
```

Use HTTPS in production. JWT refresh tokens are not implemented: users sign in again after eight hours. Logout clears the browser cookie; a copied bearer token remains valid until expiry. Secrets must stay out of Git.

## AI tool usage

I used OpenAI Codex to help optimize code, improve directory structure, fix bugs, review code and suggest improvements.

## Recording

https://www.loom.com/share/5896f1246f814022aa1abccf48dfe9fe

## Live URL

https://board.deepakkogta.com/