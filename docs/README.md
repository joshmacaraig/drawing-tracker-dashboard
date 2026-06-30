# Drawing Tracker Dashboard

A web application for tracking construction drawing status — import messy CSV files, view a live dashboard, Kanban board, and sortable table.

---

## What this app does

- **Import** messy construction drawing CSV files (with metadata rows, `---` null values, varied date formats)
- **Store** clean, normalized drawing data in SQLite via Prisma
- **Display** a live dashboard with status/group breakdowns and risk indicators
- **Kanban board** shows all drawings organized by review status
- **Drawings table** with search, filter, and sort controls
- **Import history** tracks every import with inserted/updated/unchanged/error counts
- **Re-import logic**: Day 2 CSVs update existing drawings instead of creating duplicates

---

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript  |
| Database   | SQLite via Prisma ORM         |
| CSV Parser | PapaParse                     |

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

---

## Installation

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Set up the database

```bash
cd backend
npx prisma db push
```

> The SQLite database will be created at `backend/prisma/dev.db`.

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the app

You need two terminals — one for backend, one for frontend.

### Terminal 1 — Start the backend (port 3001)

```bash
cd backend
npm run dev
```

You should see: `Backend server running on http://localhost:3001`

### Terminal 2 — Start the frontend (port 3000)

```bash
cd frontend
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## Deployment notes

The frontend can be deployed to Vercel from the `frontend/` directory:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm install`
- Output: Next.js default

The backend is a separate Express + Prisma SQLite service. Do not point a Vercel deployment at `localhost:3001` in production. Host the backend separately (for example Render, Railway, Fly.io, or another Node host with persistent storage), then set this Vercel environment variable for the frontend:

```bash
API_BASE_URL=https://your-backend-host.example.com
```

For a production-grade deployment, replace SQLite with a hosted relational database such as Postgres, because local SQLite files are not durable on typical serverless hosts.

### Render backend setup

Create a Render Web Service from this same repository:

- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

Set these Render environment variables:

```bash
DATABASE_URL=file:./prisma/dev.db
FRONTEND_ORIGIN=https://drawing-tracker-dashboard-khaki.vercel.app
```

Render provides `PORT` automatically. On the free tier, SQLite data may be lost on service rebuilds or restarts unless you attach persistent storage. That is acceptable for a demo, but use Postgres for anything permanent.

---

## How to import Day 1 CSV

1. Open **http://localhost:3000/import**
2. Click the upload area or drag `samples/day1.csv` onto it
3. Click **Import CSV**
4. You'll see a result showing inserted/updated/unchanged counts
5. Navigate to **Dashboard** to see the drawings

Expected result: 12 drawings inserted, 0 updated.

---

## How to import Day 2 CSV

1. Open **http://localhost:3000/import**
2. Upload `samples/day2.csv`
3. Click **Import CSV**

Expected result: 2 new drawings inserted (DWG-013, DWG-014), ~10 drawings updated with new revisions/statuses, some unchanged.

The re-import uses `drawing_id` as the unique key — existing drawings are updated, not duplicated.

---

## App pages

| URL | Description |
|-----|-------------|
| `/` | Dashboard — stats, breakdowns, recent changes |
| `/kanban` | Kanban board — drawings by status column |
| `/drawings` | Sortable, filterable table of all drawings |
| `/import` | CSV upload page |
| `/history` | Import history log |

---

## Project structure

```
backend/
  prisma/schema.prisma     # Database schema
  src/server.ts            # Express app entry point
  src/routes/              # API route handlers
  src/services/            # CSV parser, risk calculator, import logic

frontend/
  src/app/                 # Next.js pages (App Router)
  src/components/          # Shared UI components
  src/lib/api.ts           # API client
  src/types/index.ts       # TypeScript types

samples/
  day1.csv                 # Sample Day 1 import
  day2.csv                 # Sample Day 2 re-import

docs/
  README.md                # This file
  TECHNICAL_NOTES.md       # Architecture decisions
```
