# Testing Checklist

## Setup verification
- [ ] `cd backend && npm install` completes without errors
- [ ] `npx prisma db push` creates the SQLite database
- [ ] `npm run dev` starts backend on port 3001
- [ ] `curl http://localhost:3001/api/health` returns `{"status":"ok",...}`
- [ ] `cd frontend && npm install` completes without errors
- [ ] `npm run dev` starts frontend on port 3000
- [ ] http://localhost:3000 loads without errors

## CSV Import — Day 1
- [ ] Navigate to /import
- [ ] Upload samples/day1.csv
- [ ] Result shows: inserted=12, updated=0, unchanged=0, errors=0
- [ ] Dashboard shows 12 total drawings
- [ ] Drawings table shows all 12 rows
- [ ] DWG-003 and DWG-009 have null status/revision (imported from ---)

## CSV Import — Day 2 (re-import)
- [ ] Upload samples/day2.csv
- [ ] Result shows: inserted=2 (DWG-013, DWG-014), updated>0, some unchanged
- [ ] Total drawings becomes 14
- [ ] DWG-001 now shows Rev B and status Approved (was Rev A, Under Review)
- [ ] No duplicate drawing_ids in the database
- [ ] Importing day2.csv again shows inserted=0, updated=0, all unchanged (idempotent)

## Risk calculation
- [ ] Drawings with null status show risk = Missing Info
- [ ] Drawings with upload_date making drop_dead_date in the past show risk = Late
- [ ] Drawings with drop_dead_date within 3 days show risk = At Risk
- [ ] Approved drawings (status A/Approved) show risk = On Track

## Dashboard
- [ ] Stats cards show correct numbers
- [ ] Status breakdown bars add up to total
- [ ] Group breakdown shows all groups
- [ ] Recent changes shows last 10 updated drawings
- [ ] Empty state shown if no drawings imported

## Kanban
- [ ] All 7 columns visible
- [ ] Cards appear in correct column based on status
- [ ] Null-status drawings appear in Missing Info column
- [ ] Card shows drawing_id, title, group, revision, status, dates, risk badge
- [ ] Column count badge matches number of cards

## Drawings table
- [ ] All drawings visible with correct data
- [ ] Click column header to sort ascending
- [ ] Click again to sort descending
- [ ] Search "Structural" filters to structural group drawings
- [ ] Status filter works
- [ ] Group filter works
- [ ] Risk filter works
- [ ] Clear filters restores full list
- [ ] Drop dead date shown in red for Late drawings

## Import history
- [ ] Shows one row per import
- [ ] File name, timestamp, counts all correct
- [ ] Error log expandable for imports with warnings
- [ ] Most recent import appears at top

## Error handling
- [ ] Uploading a non-CSV file shows an error message
- [ ] Uploading a CSV with no recognisable header row shows error
- [ ] Backend offline → frontend shows helpful error with suggestion to check port 3001
