# TUT Bus App — Backend

NestJS + Prisma + PostgreSQL API implementing the system described in the project documentation: authentication (student/driver/admin), buses, routes & stops, trips, schedules, live GPS over WebSockets, notifications, feedback, incident reports, and analytics.

## Stack

- **NestJS** (TypeScript) — modular REST API + WebSocket gateways
- **PostgreSQL** via **Prisma ORM** — see `prisma/schema.prisma` for the full data model (mirrors "11. Database Design" in the doc)
- **JWT** auth (access + refresh tokens) with role-based guards (`STUDENT` / `DRIVER` / `ADMIN`)
- **Socket.IO** — two namespaces: `/gps` (live bus tracking) and `/notifications` (real-time push)
- **Firebase Cloud Messaging** — stubbed (`src/notifications/fcm.service.ts`); logs instead of sending until you plug in real credentials

## Setup

```bash
cp .env.example .env
# edit .env if your Postgres isn't the docker-compose default

npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed      # or: npm run prisma:seed
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1`.

### Using docker-compose instead

From the repo root:

```bash
docker compose up -d postgres
# then run the backend steps above against that Postgres instance,
# or docker compose up -d backend once you're ready to containerize it too
```

### Seeded accounts (password `Password123!` for all)

| Role    | Email                        |
|---------|-------------------------------|
| Admin   | admin@tut.ac.za               |
| Driver  | driver1@tut.ac.za             |
| Student | student1@tut4life.ac.za       |

## API overview

All routes are prefixed `/api/v1`. Routes marked 🔓 are public; everything else requires `Authorization: Bearer <accessToken>`.

**Auth**
- 🔓 `POST /auth/student/register`, `/auth/student/verify-otp`, `/auth/student/login`
- 🔓 `POST /auth/student/request-password-reset`, `/auth/student/reset-password`
- 🔓 `POST /auth/driver/login`, `POST /auth/admin/login`
- 🔓 `POST /auth/refresh`

**Students** — `/students` (admin list/manage), `/students/me` (self profile, favourites, trip history)

**Drivers** — `/drivers` (admin create/list/manage), `/drivers/me` (self profile, incident reports)

**Admins** — `/admins` (super-admin only for creation)

**Buses** — 🔓 `GET /buses`, `GET /buses/:id`, `GET /buses/live?routeId=` · admin `POST/PATCH`, driver+admin `PATCH /buses/:id/passenger-count`

**Routes & stops** — 🔓 `GET /routes`, `GET /routes/:id`, `GET /stops?routeId=` · admin write endpoints

**Schedules** — 🔓 `GET /schedules?routeId=&dayType=` · admin write endpoints

**Trips** — 🔓 `GET /trips`, `GET /trips/:id` · driver `POST /trips/start|:id/pause|:id/resume|:id/end|:id/cancel` · student `POST /trips/:id/board|:id/alight` (QR boarding)

**GPS** — WebSocket `/gps` namespace (see below) · REST fallback `POST /gps/ping` (driver), 🔓 `GET /gps/bus/:busId/history`

**Notifications** — admin `POST /notifications`, `GET /notifications` · `GET /notifications/me`, `PATCH /notifications/:recipientId/read` · WebSocket `/notifications` namespace

**Feedback** — student `POST /feedback`, `GET /feedback/me` · admin `GET /feedback`

**Analytics** — admin `GET /analytics/overview|trips-per-day|busiest-routes|incidents`

## WebSocket channels

**`/gps`** — real-time bus location.
- Driver clients connect with `auth: { token: <driver JWT> }` and emit `gps:update` `{ busId, tripId?, lat, lng, speedKmh?, heading? }` every few seconds while a trip is active.
- Any client (student app, web dashboard) can connect without a token and listen for `bus:location` broadcasts, optionally after `gps:subscribe-route` with a routeId to scope updates to one route's room.

**`/notifications`** — targeted + broadcast push. Clients emit `identify { userId, role }` right after connecting to join their personal and role rooms, then listen for `notification:new`.

## Known limitation in the environment this was built in

This backend was generated and verified inside a network-restricted sandbox that could reach the npm registry but not `binaries.prisma.sh` (Prisma's engine CDN), so the actual database/runtime could only be smoke-tested with locally-installed Postgres and a workaround for the engine binary. **On your own machine with normal internet access, `npx prisma generate` and `npx prisma migrate dev` will work exactly as documented above — no workaround needed.** What *was* verified here: `npx tsc --noEmit` and `npx nest build` both pass cleanly against the fully-generated Prisma Client types (i.e. every Prisma field/relation name used across the codebase is confirmed to match the schema).
