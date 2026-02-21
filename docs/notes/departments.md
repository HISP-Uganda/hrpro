# Departments Module Notes

Date: 2026-02-21

## Schema

Migration: `internal/db/migrations/000005_create_departments_and_fk.up.sql`

Created table `departments`:

- `id` (PK)
- `name` (required)
- `description` (nullable)
- `created_at`
- `updated_at`

Indexes and constraints:

- case-insensitive unique index on department name: `uq_departments_name_lower`
- foreign key on `employees.department_id` -> `departments.id`
- delete behavior: `ON DELETE RESTRICT`

## Wails Binding Signatures

Defined in `app.go` and `internal/handlers/departments_handler.go`:

- `CreateDepartment(request)`
- `UpdateDepartment(request)`
- `DeleteDepartment(request)`
- `GetDepartment(request)`
- `ListDepartments(request)`

Request payloads include `accessToken` and operation fields.

## Delete Rule (Critical Business Rule)

Enforced in service layer (`internal/departments/service.go`):

- Before delete, service calls `CountEmployeesByDepartmentID`.
- If employee count > 0, delete is blocked with `ErrDepartmentHasEmployees`.
- This ensures rule enforcement independent of DB constraint behavior.

## Validation and Integrity Rules

- name is required
- name is trimmed
- duplicate names are rejected case-insensitively
- read-only roles cannot mutate

RBAC:

- Admin, HR Officer: create/update/delete
- Viewer, Finance Officer: read-only (get/list)

## Frontend Decisions

Departments page implemented in `frontend/src/pages/DepartmentsPage.tsx`:

- Header with `Add Department` button
- Search input
- MUI DataGrid with:
  - columns (name, description, employee count, actions)
  - server pagination
  - toolbar
  - column visibility support
  - resize support
  - sticky headers
- Create/Edit dialog with validation and loading state
- Delete confirmation dialog
- Friendly snackbar for "department has employees" backend failure

Employees integration updates:

- Employee form now uses Department `Select` populated from departments query.
- Employee filter row now supports department filter.
- Employee grid now displays real department name.

## Tests Added

Backend:

- `internal/departments/service_test.go`
  - duplicate name rejected
  - delete blocked when department has employees

Frontend:

- `frontend/src/router/router.test.tsx`
  - verifies `/departments` route registered
  - verifies sidebar contains `/departments`
  - existing redirect/notFound tests retained

## How to Run

Backend:

- `GOCACHE=/tmp/go-cache go test ./...`
- `GOCACHE=/tmp/go-cache go build ./...`

Frontend:

- `npm run test`
- `npm run build`
