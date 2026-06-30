# Implementation Checklist

## CSV Import
- [x] Skip metadata rows before real header row
- [x] Detect header row by presence of "Doc Ref" (case-insensitive)
- [x] Convert "---", "-", "N/A", blank to null
- [x] Map Doc Ref → drawing_id
- [x] Map Description → title
- [x] Map Unit Group → group
- [x] Map Rev → revision
- [x] Map Review Status → status
- [x] Map Uploaded → upload_date
- [x] Calculate drop_dead_date = upload_date + 7 days
- [x] Parse DD/MM/YYYY dates correctly
- [x] Skip rows with no drawing_id with logged warning

## Re-import logic
- [x] Use drawing_id as unique key
- [x] If drawing not found → INSERT → count as inserted
- [x] If drawing found, same data → skip → count as unchanged
- [x] If drawing found, different data → UPDATE → count as updated
- [x] Count errors separately
- [x] Save ImportHistory record for every import
- [x] Day 2 CSV updates existing drawings, inserts new ones

## Dashboard
- [x] Total drawings count
- [x] Approved count
- [x] Under Review count
- [x] Needs Attention (Late + At Risk + Missing Info)
- [x] Late count
- [x] At Risk count
- [x] Missing Info count
- [x] Status breakdown bar chart
- [x] Group breakdown bar chart
- [x] Recent changes table (last 10 by updated_at)

## Kanban board
- [x] Missing Info column
- [x] In Progress column
- [x] Awaiting Design Review column
- [x] Under Review column
- [x] Status C column
- [x] Status B column
- [x] Status A column
- [x] Card shows: drawing_id, title, group, revision, status, upload_date, drop_dead_date, risk badge
- [x] Column shows card count
- [x] Read-only (no drag)

## Drawings table
- [x] Drawing ID column
- [x] Title column
- [x] Group column
- [x] Revision column
- [x] Status column
- [x] Uploaded Date column
- [x] Drop Dead Date column (highlighted red if Late)
- [x] Risk column
- [x] Last Updated column
- [x] Sort by any column (asc/desc)
- [x] Search filter (drawing_id, title, group)
- [x] Status filter dropdown
- [x] Group filter dropdown
- [x] Risk filter dropdown
- [x] Clear filters button

## Import History
- [x] File name
- [x] Imported at timestamp
- [x] Inserted count
- [x] Updated count
- [x] Unchanged count
- [x] Error count
- [x] Expandable error log

## UI/UX
- [x] Navbar with active link highlighting
- [x] Risk badges (Late = red, At Risk = orange, Missing Info = grey, On Track = green)
- [x] Status badges with colour coding
- [x] Empty state for no drawings
- [x] Loading states
- [x] Error states with helpful messages
- [x] Drag & drop CSV upload
- [x] Import result summary screen
- [x] Format hints on import page
