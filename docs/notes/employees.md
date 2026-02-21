# Employees Module Notes

Date: 2026-02-21

## DB Schema Summary

Migration: `internal/db/migrations/000004_create_employees.up.sql`

Table: `employees`

- `id` (PK)
- `first_name` (required)
- `last_name` (required)
- `other_name` (nullable)
- `gender` (nullable)
- `dob` (nullable)
- `phone` (nullable)
- `email` (nullable)
- `national_id` (nullable)
- `address` (nullable)
- `department_id` (nullable for now)
- `position` (required)
- `employment_status` (required)
- `date_of_hire` (required)
- `base_salary_amount` (required, default 0)
- `created_at`, `updated_at`

Indexes:

- `idx_employees_name` on lowercased first/last name
- `idx_employees_status`
- `idx_employees_department_id`

## Wails Binding Signatures

Defined in `app.go` and handled by `internal/handlers/employees_handler.go`:

- `CreateEmployee(request)`
- `UpdateEmployee(request)`
- `DeleteEmployee(request)`
- `GetEmployee(request)`
- `ListEmployees(request)`

Request payloads include `accessToken` and operation fields.

RBAC enforced server-side per method:

- Admin + HR Officer: create/update/delete
- Admin + HR Officer + Finance Officer + Viewer: get/list

## ListEmployees Query Params Format

`ListEmployeesRequest`:

- `accessToken: string` (required)
- `page: number` (1-based)
- `pageSize: number` (default 10, max 100)
- `q?: string` (search by first/last/other name)
- `status?: string` (employment status filter)
- `departmentId?: number` (optional)

Response:

- `items: Employee[]`
- `totalCount: number`
- `page: number`
- `pageSize: number`

## UI Decisions

Employees UI implemented in `frontend/src/pages/EmployeesPage.tsx`:

- Header with title + `Add Employee` button
- Filters row:
  - name search
  - status filter
  - department placeholder (disabled)
- MUI DataGrid features used:
  - server-side pagination
  - built-in toolbar
  - column visibility model (hide/show)
  - column resizing
  - sticky headers
  - actions column (View/Edit/Delete)
- Create/Edit/View dialog with helper text validation
- Delete confirmation dialog
- Snackbar success/error notifications

Validation decisions (MVP):

- Required: first name, last name, position, employment status, date of hire
- `baseSalaryAmount >= 0`
- Email format validation (simple)
- Phone pattern validation (simple)

## Tests Added

Backend:

- `internal/employees/service_test.go`
  - required fields
  - invalid email
  - invalid phone
  - negative salary
  - valid payload

Frontend:

- `frontend/src/router/router.test.tsx`
  - includes `/employees` route
  - includes sidebar `/employees` nav item
  - existing milestone navigation assertions still pass

## How to Run Tests

From project root:

- `GOCACHE=/tmp/go-cache go test ./...`
- `GOCACHE=/tmp/go-cache go build ./...`

From `frontend/`:

- `npm run test`
- `npm run build`
