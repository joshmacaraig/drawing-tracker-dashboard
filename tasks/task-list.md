# Task List — Drawing Tracker Dashboard

## Phase 1: Project setup
- [x] Create folder structure (backend, frontend, tasks, docs, samples)
- [x] Backend: package.json, tsconfig.json
- [x] Frontend: package.json, tsconfig.json, Tailwind config
- [x] Prisma schema (Drawing, ImportHistory models)
- [x] Environment variables (.env)

## Phase 2: Backend
- [x] Express server with CORS
- [x] CSV parser service (skip metadata rows, detect header, convert --- to null)
- [x] Risk calculator service (Late / At Risk / Missing Info / On Track)
- [x] Import service (insert / update / unchanged logic + ImportHistory tracking)
- [x] POST /api/import route (multer file upload)
- [x] GET /api/import/history route
- [x] GET /api/drawings route (with filters: search, status, group, risk, sort)
- [x] GET /api/drawings/filters route (distinct statuses and groups)
- [x] GET /api/dashboard/stats route

## Phase 3: Frontend
- [x] Next.js App Router setup
- [x] Global CSS + Tailwind
- [x] Navbar component with active link highlighting
- [x] RiskBadge component
- [x] StatusBadge component
- [x] API client (lib/api.ts)
- [x] TypeScript types (types/index.ts)
- [x] Dashboard page (stats, breakdowns, recent changes)
- [x] Kanban page (7 columns, drawing cards)
- [x] Drawings table page (sort, filter, search)
- [x] Import page (drag & drop upload, result summary)
- [x] Import history page (table of all imports)

## Phase 4: Data & Docs
- [x] Sample Day 1 CSV (12 drawings, metadata rows, --- values)
- [x] Sample Day 2 CSV (14 drawings, updates to existing + 2 new)
- [x] docs/README.md (install, run, import instructions)
- [x] docs/TECHNICAL_NOTES.md (CSV handling, re-import logic, risk calc)
- [x] tasks/task-list.md
- [x] tasks/implementation-checklist.md
- [x] tasks/testing-checklist.md
