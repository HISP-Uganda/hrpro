# Reports Module (MVP)

Date: 2026-02-21

## Report List (MVP)

Implemented end-to-end (backend + frontend + CSV):

1. Employee List Report
2. Leave Requests Report
3. Attendance Summary by Employee (date range)
4. Payroll Batches Report (Finance/Admin only)
5. Audit Log Report (Admin only)

## Wails Binding Signatures

All methods are exposed through the main `App` binding and routed through `handlers.ReportsHandler`:

- `ListEmployeeReport({ accessToken, filters, pager }) -> { rows, pager }`
- `ExportEmployeeReportCSV({ accessToken, filters }) -> { filename, data }`

- `ListLeaveRequestsReport({ accessToken, filters, pager }) -> { rows, pager }`
- `ExportLeaveRequestsReportCSV({ accessToken, filters }) -> { filename, data }`

- `ListAttendanceSummaryReport({ accessToken, filters, pager }) -> { rows, pager }`
- `ExportAttendanceSummaryReportCSV({ accessToken, filters }) -> { filename, data }`

- `ListPayrollBatchesReport({ accessToken, filters, pager }) -> { rows, pager }`
- `ExportPayrollBatchesReportCSV({ accessToken, filters }) -> { filename, data }`

- `ListAuditLogReport({ accessToken, filters, pager }) -> { rows, pager }`
- `ExportAuditLogReportCSV({ accessToken, filters }) -> { filename, data }`

## Filter Rules

General:

- Server-side validation is enforced in `internal/reports/service.go`.
- Pagination normalized server-side: default page `1`, pageSize `10`, max pageSize `100`.
- All SQL uses SQLX with positional parameterized placeholders.

Date fields:

- `dateFrom/dateTo` must be `YYYY-MM-DD`.
- Required for leave, attendance summary, and audit report.
- `dateFrom <= dateTo` required.

Month fields:

- `monthFrom/monthTo` must be `YYYY-MM` if provided.
- `monthFrom <= monthTo` when both are provided.

ID filters:

- Positive integers only when present (`departmentId`, `employeeId`, `leaveTypeId`, `actorUserId`).

Enumerations:

- Leave status: `Pending`, `Approved`, `Rejected`, `Cancelled`.
- Payroll status: `Draft`, `Approved`, `Locked`.
- Employee status filter accepts `Active` / `Inactive` (case-insensitive variants accepted by backend).

Attendance unmarked rule:

- `unmarked_count = calendar_days_in_range - marked_days`.
- Calendar-day counting is used (weekends are included).

## Export Filename Convention

CSV always includes headers and backend returns `{ filename, data }`.

- Employee: `employee-list-YYYY-MM-DD.csv`
- Leave: `leave-requests-YYYY-MM-DD_to_YYYY-MM-DD.csv`
- Attendance summary: `attendance-summary-YYYY-MM-DD_to_YYYY-MM-DD.csv`
- Payroll batches: `payroll-batches-YYYY-MM-DD.csv`
- Audit log: `audit-log-YYYY-MM-DD_to_YYYY-MM-DD.csv`

Export safety limit:

- Exports are blocked if result set exceeds `50,000` rows (`ErrExportLimitExceeded`).

## RBAC Matrix

Server-side RBAC is enforced in reports service for each list and export operation.

- Admin:
  - Employees, Leave, Attendance, Payroll, Audit
- HR Officer:
  - Employees, Leave, Attendance
  - Payroll denied
  - Audit denied
- Finance Officer:
  - Payroll
  - Employees (read/report)
  - Leave denied
  - Attendance denied
  - Audit denied
- Viewer:
  - Employees, Leave, Attendance
  - Payroll denied
  - Audit denied
- Staff:
  - Denied all MVP reports

Hard MVP rules implemented:

- Payroll reports: Finance Officer + Admin only.
- Audit report: Admin only.

## Tests Added

Backend (`internal/reports/service_test.go`):

- Date parsing validation failure (`YYYY-MM-DD`)
- Invalid date range (from > to)
- RBAC checks:
  - finance cannot access audit
  - hr cannot access payroll
  - viewer denied payroll and audit

Frontend (`frontend/src/router/router.test.tsx`):

- `/reports` route smoke render for admin
- reports route guard test for no report permission -> `/access-denied`
- navigation path/item assertions include `/reports`

## How To Run

- Navigation tests:
  - `cd frontend && npm test -- --run src/router/router.test.tsx`
- Frontend typecheck/build:
  - `cd frontend && npm run build`
- Backend tests:
  - `GOCACHE=/tmp/go-build-cache go test ./...`
