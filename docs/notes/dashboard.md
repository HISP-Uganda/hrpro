# Dashboard Enhancement Notes

## Summary DTO Structure

`internal/dashboard/dto.go` exposes `SummaryDTO` with:

- `totalEmployees`
- `activeEmployees`
- `inactiveEmployees`
- `pendingLeaveRequests`
- `approvedLeaveThisMonth`
- `employeesOnLeaveToday`
- `currentPayrollStatus` (optional)
- `currentPayrollTotal` (optional)
- `activeUsers` (optional)
- `employeesPerDepartment[]` with `{ departmentName, count }`
- `recentAuditEvents[]` (latest 10 for Admin)

Role adaptation is enforced server-side in `internal/dashboard/service.go`:

- Admin: full data
- HR Officer: workforce + leave + payroll snapshot
- Finance Officer: workforce + leave + payroll snapshot (payroll emphasized in UI)
- Viewer: workforce + leave summary only (payroll/users/audit omitted)

## Queries Used

Implemented in `internal/dashboard/repository.go` using SQLX parameterized queries:

- Employee totals by status using `COUNT(*) FILTER (...)`
- Pending leave count from `leave_requests WHERE status = $1`
- Approved leave this month from `leave_requests` bounded by month start/end UTC and `approved_at`
- Employees on leave today via approved date-range overlap and distinct employee count
- Current payroll snapshot from latest batch month with net-pay sum
- Active users count from `users WHERE is_active = TRUE`
- Department headcount grouped by `COALESCE(departments.name, 'Unassigned')`
- Recent audit events with actor username join, ordered by `created_at DESC LIMIT $1`

No SQL is present in Wails bindings; bindings call handler -> service -> repository.

## Indexes Added

Migration: `internal/db/migrations/000010_add_dashboard_indexes.up.sql`

- `idx_leave_requests_status_approved_at` on `(status, approved_at)`
- `idx_leave_requests_status_date_range` on `(status, start_date, end_date)`
- `idx_payroll_batches_month_desc` on `(month DESC)`

Rollback file: `internal/db/migrations/000010_add_dashboard_indexes.down.sql`
