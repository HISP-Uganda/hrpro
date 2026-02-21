# Daily Attendance Module Notes

## Scope

Milestone implements Daily Attendance (requirements section 3.8) end-to-end with backend schema, clean-architecture service/repository logic, Wails bindings, `/attendance` frontend page, and tests.

## Schema

Migration: `internal/db/migrations/000011_create_attendance_module.up.sql`

### `attendance_records`

- `id BIGSERIAL PRIMARY KEY`
- `attendance_date DATE NOT NULL`
- `employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT`
- `status TEXT NOT NULL` with check:
  - `present|late|field|absent|leave`
- `marked_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT`
- `marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `is_locked BOOLEAN NOT NULL DEFAULT TRUE`
- `lock_reason TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Unique: `(attendance_date, employee_id)`
- Indexes:
  - `idx_attendance_records_attendance_date`
  - `idx_attendance_records_employee_id`
  - `idx_attendance_records_status`

### `lunch_catering_daily`

- `attendance_date DATE PRIMARY KEY`
- `visitors_count INT NOT NULL DEFAULT 0`
- `plate_cost_amount INT NOT NULL DEFAULT 12000`
- `staff_contribution_amount INT NOT NULL DEFAULT 4000`
- `updated_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Checks:
  - `visitors_count >= 0`
  - `plate_cost_amount > 0`
  - `staff_contribution_amount >= 0`

Down migration: `internal/db/migrations/000011_create_attendance_module.down.sql`

## Bindings

Wails app bindings added in `app.go`:

- `ListAttendanceByDate({ accessToken, date }) -> []AttendanceRow`
- `UpsertAttendance({ accessToken, date, employeeId, status, reason? }) -> AttendanceRecord`
- `GetMyAttendanceRange({ accessToken, startDate, endDate }) -> []AttendanceRecord`
- `GetLunchSummary({ accessToken, date }) -> LunchSummary`
- `UpsertLunchVisitors({ accessToken, date, visitorsCount }) -> LunchSummary`
- `PostAbsentToLeave({ accessToken, date, employeeId }) -> PostAbsentToLeaveResult`

## RBAC rules

Enforced server-side in `internal/attendance/service.go`:

- `admin`, `master_admin`, `hr_officer`:
  - list attendance all employees
  - mark attendance
  - post absent to leave
  - update lunch visitors
- `finance_officer`, `viewer`:
  - read-only attendance listing
  - read lunch summary
- `staff`:
  - read own daily row only (`ListAttendanceByDate` filtered by `claims.UserID`)
  - no mark, no post, no lunch write

## Lock and override approach

Chosen MVP policy: **`admin` is treated as override-capable** (plus `master_admin` if role is introduced later).

- first mark creates locked record (`is_locked = true`)
- non-override roles cannot edit locked records
- override updates emit `attendance.override` audit events

This keeps behavior consistent with current role model (no new persisted role was introduced in this milestone).

## `PostAbsentToLeave` workflow

`attendance.Service.PostAbsentToLeave`:

1. validates RBAC (`admin/hr`)
2. validates employee/date and ensures attendance record status is `absent`
3. calls leave module method `leave.Service.CreateSingleDayLeaveFromAttendance`
4. leave module re-validates:
   - employee exists
   - active leave type available (prefers `Annual Leave`)
   - locked leave dates
   - approved overlap
   - entitlement balance (when leave type counts toward entitlement)
5. on leave success:
   - leave request created and auto-approved for same date
   - attendance updated to `leave` while remaining locked
   - audit `attendance.post_absent_to_leave` success recorded
6. on leave failure:
   - attendance remains `absent`
   - audit failure recorded
   - user-friendly error returned

## Audit events

Recorded (non-blocking):

- `attendance.mark`
- `attendance.override`
- `attendance.post_absent_to_leave` (success/failure metadata)
- `lunch.update_visitors`

Audit recorder uses existing centralized `internal/audit` service. Failures are logged and do not fail the main operation.

## Tests added

Backend:

- `internal/attendance/rules_test.go`
  - status validation
  - lock enforcement (locked vs admin override)
- `internal/attendance/service_test.go`
  - RBAC deny mark by non-admin/hr
  - `postAbsentToLeave` rejects non-absent
  - leave integration failure leaves attendance unchanged
  - lunch totals calculations

Frontend:

- `frontend/src/router/router.test.tsx`
  - includes `/attendance` route + sidebar assertions
  - smoke route render test for `/attendance`

## Run tests

Backend:

```bash
go test ./...
```

Frontend navigation suite:

```bash
cd frontend
npm test -- --run src/router/router.test.tsx
```
