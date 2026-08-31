# TUT Bus App — Web Admin Dashboard

Next.js 14 (App Router) + TypeScript + Tailwind CSS admin dashboard for transport administrators: manage buses, drivers, routes & stops, schedules, students, notifications, feedback, and a live map — matching "6. Admin Features" in the project documentation.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Runs at `http://localhost:3001` if you set the port, otherwise Next's default `http://localhost:3000` (change the backend's `PORT` in `.env` if you run both on the same machine, or run this with `PORT=3001 npm run dev`).

Sign in with the seeded admin account: `admin@tut.ac.za` / `Password123!` (see `../backend/README.md` to seed the database first).

## Notes on the live map

The doc recommends Google Maps SDK. This dashboard uses **Leaflet + OpenStreetMap** instead (`src/components/LiveMap.tsx`) so it runs immediately without a Google Maps API key or billing setup. To switch to Google Maps: swap `react-leaflet` for `@react-google-maps/api`, keeping the same `bus:location` WebSocket subscription logic in `src/lib/socket.ts`.

## Structure

```
src/
  app/
    login/                    Admin login
    (dashboard)/               Authenticated shell (sidebar + pages)
      page.tsx                 Overview (stats + charts)
      live-map/                Real-time bus positions
      buses/ drivers/ routes/  CRUD pages
      schedules/ students/
      notifications/ feedback/
  components/                  Sidebar, DataTable bits, Modal, Badge, LiveMap
  lib/                         API client, socket client, shared types, auth guard
```

Auth tokens are stored in `localStorage`. This is fine for a capstone/demo project; for production, move to httpOnly cookies + a Next.js middleware-based session check.
