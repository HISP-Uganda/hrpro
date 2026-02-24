# DataGrid + Export Stabilization

Date: 2026-02-24

## Summary

This milestone standardized:

- CSV export saving through a native Wails save dialog.
- DataGrid visual/scroll behavior using a shared wrapper component.

No schema or migration changes were made.

## SaveFileWithDialog Pattern

Backend binding in `app.go`:

- `SaveFileWithDialog(request SaveFileWithDialogRequest) (*SaveFileWithDialogResult, error)`

Request:

- `suggestedFilename string`
- `dataBytes []byte`
- `mimeType string`

Response:

- `savedPath string`
- `cancelled bool`

Usage pattern in frontend:

1. Export action returns `{ filename, data, mimeType }`.
2. Frontend converts `data` to bytes (`TextEncoder`) and calls `api.saveFileWithDialog(...)`.
3. `cancelled=true` -> snackbar: `Save cancelled` (info, not error).
4. Success -> snackbar: `Saved: <path>`.
5. Failure -> error snackbar.

## AppDataGrid Approach

Added shared wrapper:

- `frontend/src/components/AppDataGrid.tsx`

It enforces:

- Bold headers via `.MuiDataGrid-columnHeaderTitle { font-weight: 700; }`
- Sticky header row via `.MuiDataGrid-columnHeaders { position: sticky; top: 0; }`
- Consistent row/header height and density defaults
- Smooth internal virtual scroller behavior

Pages keep fixed-height containers so DataGrid controls its own vertical scroll area.

## Updated Pages

- Employees
- Departments
- Leave-related report grids (within Reports page)
- Payroll batches
- Payroll batch entries
- Users
- Audit logs
- Reports result grids (employees/leave/attendance/payroll/audit)
- Attendance register grid

## Files Added

- `frontend/src/components/AppDataGrid.tsx`
- `frontend/src/components/AppDataGrid.test.tsx`
- `frontend/src/lib/exportSave.ts`
- `docs/notes/datagrid-export-fix.md`

## Verification

Manual checklist to run:

1. Reports export opens native save dialog and writes selected CSV.
2. Payroll batch export opens native save dialog and writes selected CSV.
3. Cancelling dialog shows `Save cancelled`.
4. All DataGrid headers are bold.
5. DataGrid headers remain visible while scrolling long tables.

Automated checks run:

- `npm test` (frontend): passed
- `npm run build` (frontend): passed
- `go test ./...` (backend): passed

Routing smoke coverage:

- Existing router tests still pass, covering `/`, `/dashboard`, module routes, access denied behavior, and notFound component.
