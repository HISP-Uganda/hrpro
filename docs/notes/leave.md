# Leave Module Notes

Date: 2026-02-21

## Schema Summary

Migration: `internal/db/migrations/000006_create_leave_module.up.sql` (+ matching down file)

Created tables:
- `leave_types`
  - `id`, `name` (unique), `paid`, `counts_toward_entitlement`, `requires_attachment`, `requires_approval`, `active`, timestamps
- `leave_entitlements`
  - `id`, `employee_id` FK, `year`, `total_days`, `reserved_days`, timestamps
  - unique constraint on `(employee_id, year)`
- `leave_locked_dates`
  - `id`, `date` (unique), `reason`, `created_by`, `created_at`
- `leave_requests`
  - `id`, `employee_id` FK -> `employees.id`, `leave_type_id` FK -> `leave_types.id`
  - `start_date`, `end_date`, `working_days`, `status`, `reason`
  - `approved_by`, `approved_at`, timestamps
  - status check: `Pending|Approved|Rejected|Cancelled`

## Wails Bindings Surface

Bound in `app.go` through `internal/handlers/leave_handler.go`:

- Leave types
  - `ListLeaveTypes`
  - `CreateLeaveType`
  - `UpdateLeaveType`
  - `SetLeaveTypeActive`
- Locked dates
  - `ListLockedDates`
  - `LockDate`
  - `UnlockDate`
- Entitlements / balance
  - `GetMyLeaveBalance`
  - `GetLeaveBalance`
  - `UpsertEntitlement`
- Leave requests
  - `ApplyLeave`
  - `ListMyLeaveRequests`
  - `ListAllLeaveRequests`
  - `ApproveLeave`
  - `RejectLeave`
  - `CancelLeave`

## Key Server-Side Rules

Implemented in `internal/leave/service.go` and `internal/leave/rules.go`:

- Working-days calculation excludes weekends.
- End date must be on/after start date.
- Zero-working-day requests are rejected.
- Locked date collision rejects apply requests if any locked date falls on requested working days.
- Overlap with existing approved leave is rejected.
- Balance enforcement:
  - `Available = Total - Reserved - Approved - Pending`
  - requests exceeding available balance are rejected.
- Status lifecycle:
  - `Pending -> Approved` (Admin/HR)
  - `Pending -> Rejected` (Admin/HR)
  - `Pending -> Cancelled` (self or Admin/HR)
  - `Approved -> Cancelled` (Admin/HR)

RBAC is enforced in `internal/handlers/leave_handler.go` for all protected operations.

## Tests Added

Backend unit tests:
- `internal/leave/rules_test.go`
  - working day exclusions
  - invalid range rejection
  - same-day weekday => 1 day
- `internal/leave/service_test.go`
  - locked-date collision rejection
  - balance calculation includes pending + approved
  - overlap rejection with approved leave
  - lifecycle + RBAC transition checks

Frontend route smoke coverage:
- Updated `frontend/src/router/router.test.tsx` to assert `/leave` route + sidebar item.

## How To Run

From repo root:

```bash
GOCACHE=/tmp/go-build go test ./...
```

From `frontend/`:

```bash
npm test
npm run build
```
