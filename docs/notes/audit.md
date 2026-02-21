# Audit Logging Notes

Date: 2026-02-21

## Event List

Integrated actions:

- `user.login.success`
- `user.login.fail`
- `token.refresh`
- `user.create`
- `user.update`
- `user.reset_password`
- `user.activate`
- `user.deactivate`
- `leave.request.create`
- `leave.request.approve`
- `leave.request.reject`
- `leave.request.cancel`
- `payroll.batch.create`
- `payroll.batch.generate`
- `payroll.batch.approve`
- `payroll.batch.lock`
- `payroll.entry.update`

## Where Integrated

Service-layer integration only (no duplicate logic in Wails binding):

- `internal/services/auth_service.go`
- `internal/users/service.go`
- `internal/leave/service.go`
- `internal/payroll/service.go`

Central audit helper/service:

- `internal/audit/repository.go`
- `internal/audit/service.go`

Context actor propagation:

- `internal/handlers/users_handler.go`
- `internal/handlers/leave_handler.go`
- `internal/handlers/payroll_handler.go`

## Sample Metadata

Examples used:

- Auth:
  - `{ "username": "admin" }`
  - `{ "username": "admin", "source": "login" }`
- Users:
  - `{ "username": "jane", "role": "viewer" }`
  - `{ "user_id": 12 }`
  - `{ "username": "jane", "active": false }`
- Leave:
  - `{ "employee_id": 10, "leave_type_id": 1, "start_date": "2026-02-23", "end_date": "2026-02-24" }`
- Payroll:
  - `{ "month": "2026-02" }`
  - `{ "month": "2026-02", "entries_generated": 42 }`
  - `{ "batch_id": 7, "employee_id": 12 }`

## Schema and Migration

Audit schema normalized to:

- `id`
- `actor_user_id` (nullable)
- `action` (required)
- `entity_type` (nullable)
- `entity_id` (nullable)
- `metadata` (JSONB nullable)
- `created_at`

Indexes:

- `idx_audit_logs_actor_user_id`
- `idx_audit_logs_action`
- `idx_audit_logs_created_at`

Migration:

- `internal/db/migrations/000009_normalize_audit_logs_schema.up.sql`
- `internal/db/migrations/000009_normalize_audit_logs_schema.down.sql`

## Failure Handling

Audit writes are best-effort:

- Main operations do not fail when audit insertion fails.
- Audit errors are logged internally in `internal/audit/service.go`.

## Tests Added

- `internal/audit/service_test.go`
  - context actor extraction
  - audit insert failure does not panic
- `internal/services/auth_service_test.go`
  - auth success/fail audit events
- `internal/users/service_test.go`
  - user create audit event
  - main flow continues when audit insert fails
- `internal/leave/service_test.go`
  - leave request create audit event
- `internal/payroll/service_test.go`
  - payroll batch create audit event

Regression reruns:

- `go test ./...` (with local `GOCACHE` override)
- `frontend` router/navigation tests (`src/router/router.test.tsx`)

Update:

- Sidebar + route guard integration added.
- Audit logs DataGrid integration added on `/audit` with admin-only listing.
