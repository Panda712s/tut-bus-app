# TUT Bus App

**Smart Campus Bus Tracking and Management System** for Tshwane University of Technology — generated from the project documentation (`TUT Bus App Project Documentation.docx`, v1.0, Akilimali Arsène Panda & Kgaugelo Mphela).

This is a full working starter implementation across all three tiers the doc specifies:

| Layer | Location | Stack |
|---|---|---|
| Backend API | [`backend/`](backend) | NestJS · Prisma · PostgreSQL · Socket.IO · JWT |
| Web admin dashboard | [`web-dashboard/`](web-dashboard) | Next.js 14 · TypeScript · Tailwind CSS |
| Mobile app (student + driver) | [`mobile/`](mobile) | Flutter · Google Maps · Socket.IO |

Each has its own README with setup steps; this file covers the overall architecture and how the pieces fit together.

## Architecture

```
                     ┌────────────────────┐
                     │   Mobile app        │  Flutter (student + driver flows)
                     │   (students,        │──┐
                     │    drivers)         │  │ REST (JWT) + WebSocket (/gps, /notifications)
                     └────────────────────┘  │
                                              ▼
┌────────────────────┐          ┌────────────────────────┐
│  Web dashboard      │  REST +  │   Backend API            │
│  (admins)           │◄────────►│   NestJS                 │
└────────────────────┘  Socket  │   /api/v1 + /gps + /notif │
                                 └────────────┬───────────┘
                                              │ Prisma ORM
                                              ▼
                                 ┌────────────────────────┐
                                 │   PostgreSQL             │
                                 └────────────────────────┘
```

- **Auth**: separate login endpoints per role (`/auth/student/*`, `/auth/driver/*`, `/auth/admin/*`), all issuing JWTs; a single `RolesGuard` protects role-specific endpoints across all three apps.
- **Live tracking**: the driver app streams GPS pings over a WebSocket (`/gps`) while a trip is active; the backend persists each ping (`GpsLog`) and updates the bus's live-location snapshot, then rebroadcasts to any subscribed student/dashboard clients — no polling.
- **Notifications**: admin-composed notifications are persisted (so there's a read/unread inbox) *and* pushed instantly over a second WebSocket namespace (`/notifications`); an FCM stub is wired in and ready for real Firebase credentials.
- **Data model**: `backend/prisma/schema.prisma` mirrors the doc's "11. Database Design" section — Students, Drivers, Administrators, Buses, Routes, Bus Stops, Trips, Schedules, Notifications, Feedback, GPS Logs, Trip History, plus Favourites and Incident Reports to back the features in "6. Main Features".

## Quick start (all three, locally)

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev            # http://localhost:3000/api/v1

# 3. Web dashboard (new terminal)
cd web-dashboard
cp .env.example .env.local
npm install
npm run dev                  # http://localhost:3000 (set PORT=3001 if running alongside the backend)

# 4. Mobile app (new terminal) - see mobile/README.md first, it needs `flutter create .` once
cd mobile
flutter create --org za.ac.tut --project-name tut_bus_app .
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 --dart-define=SOCKET_BASE_URL=http://10.0.2.2:3000
```

Seeded demo accounts (password `Password123!` for all):

- **Admin** — admin@tut.ac.za (web dashboard)
- **Driver** — driver1@tut.ac.za (mobile app, driver flow)
- **Student** — student1@tut4life.ac.za (mobile app, student flow)

## What's implemented vs. what's a documented follow-up

Implemented end-to-end: authentication for all three roles (incl. OTP email verification and password reset for students), bus/route/stop/schedule CRUD, live GPS tracking over WebSockets with a map on both mobile and web, trip lifecycle (start/pause/resume/end/cancel) with passenger counts and capacity colour-coding (green/amber/red), QR-code boarding and trip history, favourites, driver incident reporting (traffic/accident/breakdown), student feedback (driver ratings/issues/suggestions), admin notifications (persisted + real-time + FCM-ready), and an admin analytics overview.

Deliberately left as follow-ups, since they need credentials/hardware this environment doesn't have:
- **Firebase Cloud Messaging** — the backend has a typed stub (`backend/src/notifications/fcm.service.ts`) that logs instead of sending; swap in `firebase-admin` + your service account JSON.
- **Google/Microsoft OAuth login** — email+password and OTP are implemented; social login would add `passport-google-oauth20` etc. to `AuthModule`.
- **Real QR camera scanning** — the mobile "board a bus" screen displays a QR code and has a working "confirm boarding" call to the backend; swap in a camera-scanning package (e.g. `mobile_scanner`) if you want the driver's screen scanned rather than tapped.
- **Weather widget** — the student home screen shows a static placeholder card; wire up any weather API for real data.
- **Multi-language support** — the doc lists 11 languages as a future enhancement; the mobile app currently ships English-only strings (not yet extracted for `flutter_localizations`).

## Verification performed while building this

- Backend: `npx tsc --noEmit` and `npx nest build` both pass with zero errors against the fully Prisma-generated types (every model/field/relation name used across all 12 modules was checked this way). A local PostgreSQL instance was also stood up to confirm the app can actually connect.
- Web dashboard: `npm run build` (production build, including Next.js's full type-check pass) completes with zero errors across all 10 routes.
- Mobile: the Flutter SDK isn't available in the environment this was generated in, so it couldn't be `flutter analyze`'d directly. Instead: every `package:` import was cross-checked against `pubspec.yaml`, every relative `import` was checked to resolve to a real file, and every file was checked for balanced braces/parens. Run `flutter analyze` yourself after `flutter pub get` as a final check — see `mobile/README.md`.

## Repo layout

```
tut-bus-app/
  backend/            NestJS API (see backend/README.md)
  web-dashboard/       Next.js admin dashboard (see web-dashboard/README.md)
  mobile/              Flutter student + driver app (see mobile/README.md)
  docker-compose.yml   Postgres + backend + web-dashboard for local/demo use
```
