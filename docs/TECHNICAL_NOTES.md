# Technical Notes

## How messy CSV was handled

Construction CSV exports are rarely clean. The parser (`backend/src/services/csvParser.ts`) handles:

### 1. Metadata rows before the real header

The CSV may contain project metadata (name, date, client ref) before the actual column headers. The parser scans every row looking for the expected import headers using a case-insensitive, whitespace-normalised lookup. The first row containing all required columns is treated as the header; all rows before it are silently skipped.

Required headers:

```
Doc Ref, Description, Unit Group, Rev, Review Status, Uploaded
```

The headers may be lower-case and may appear in any column order. This keeps imports resilient when extra rows or cells are added above or before the export table, while rejecting files that do not contain the expected drawing export shape.

### 2. `---` null values

Any cell containing `---`, `-`, `N/A`, or blank is converted to `null` during import. This preserves database integrity without throwing errors on missing data.

### 3. Date format normalisation

The parser accepts multiple date formats:
- `DD/MM/YYYY` (Australian standard, most common in construction exports)
- `YYYY-MM-DD` (ISO 8601)
- Any format parseable by JavaScript's `Date`

All dates are stored in UTC ISO format in the database.

### 4. Flexible column name mapping

Column headers are normalised (lowercased, whitespace-collapsed) and matched against an alias dictionary:

| CSV Column | Stored as |
|---|---|
| `Doc Ref` | `drawing_id` |
| `Description` | `title` |
| `Unit Group` | `group` |
| `Rev` | `revision` |
| `Review Status` | `status` |
| `Uploaded` | `upload_date` |

This means minor variations in column names (e.g. `Review_Status`, `DESCRIPTION`) still parse correctly.

---

## Why a canonical schema was used

Rather than storing raw CSV data, all imported data is normalised into a fixed schema:

```
drawing_id | title | group | revision | status | upload_date | drop_dead_date | risk
```

**Why this matters:**
- Makes the frontend reliable — no dynamic column lookups
- Enables SQL filtering and sorting at the database level
- `drop_dead_date` and `risk` are derived fields calculated on import, not stored in the CSV
- Future CSVs with different column orders still map cleanly

---

## How Day 2 re-import works

The import service (`backend/src/services/importService.ts`) uses `drawing_id` as the unique key:

1. For each row in the incoming CSV, look up `drawing_id` in the database
2. **Not found** → `INSERT` → count as `inserted`
3. **Found, identical data** → skip → count as `unchanged`  
   (Comparison checks: title, group, revision, status, upload_date)
4. **Found, different data** → `UPDATE` → count as `updated`

This means re-importing the same file twice is idempotent — the second import shows 0 inserted, 0 updated, all unchanged.

Every import creates an `ImportHistory` record regardless of outcome, so all imports are auditable.

---

## How risk is calculated

Risk is calculated on import and stored as a field (`risk`) on each drawing. The calculator (`backend/src/services/riskCalculator.ts`) follows this logic:

| Condition | Risk Level |
|---|---|
| `status` is null OR `title` is null | `Missing Info` |
| `status` matches approved list (`A`, `Approved`, `Status A`, `Final`) | `On Track` |
| `drop_dead_date` has passed | `Late` |
| `drop_dead_date` is within 3 days | `At Risk` |
| Everything else | `On Track` |

**Drop dead date** is calculated as `upload_date + 7 days`. This is a simple heuristic — in production this would be driven by a project schedule.

Risk is recalculated on every re-import, so drawings that were `On Track` can become `Late` over time as dates pass.

---

## What is out of scope

This is an MVP. The following are explicitly not implemented:

- **Authentication / login** — no user accounts, roles, or permissions
- **Real-time updates** — data refreshes only on page load
- **External APIs** — no integration with BIM 360, Procore, or other document platforms
- **CAD viewer** — drawings are metadata only, no file attachments
- **Notifications** — no email/Slack alerts for late drawings
- **Audit log per drawing** — import history tracks file-level changes, not per-drawing change history
- **Pagination** — all drawings are returned in a single query (fine for typical project sizes of <5000 drawings; add Prisma `skip`/`take` if needed)
- **Multi-project support** — single project database, no project isolation
