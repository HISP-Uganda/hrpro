# HISP HR System
## Development Status Tracker (Template)
## Phase A – Online-First (JWT + SQLX + golang-migrate)

Last Updated: 2026-02-21

---

# 1. Context Recovery Summary

Phase A foundation, authentication, shell, employees, departments, and leave modules are implemented. Leave now includes schema + migrations, SQLX repository/service/handler layers, server-side RBAC enforcement, leave balance and overlap rules, locked-date enforcement, and a full `/leave` UI with role-aware tabs. Routing remains stable with root redirects, protected routes, and root-level notFound handling; navigation tests continue to pass.

---

# 2. Current Implementation State (Detailed)

## Backend

Implemented packages follow clean layering: `handlers -> services -> repositories -> db`.

- `internal/config`: env-driven config loader for DB connection string, JWT secret, token expiry, and initial admin seed variables.
- `internal/db`: SQLX pool creation + ping validation and golang-migrate runner with embedded migrations.
- `internal/db/migrations`:
  - users, refresh tokens, audit logs
  - employees
  - departments table + employees FK (`ON DELETE RESTRICT`)
- `internal/services`: JWT/auth services and admin seeding.
- `internal/employees`: CRUD/list/search/pagination + validation and RBAC-enforced handlers.
- `internal/departments`: CRUD/list/search with duplicate-name protection and delete-with-employees prevention in service layer.
- `internal/leave`: leave types, entitlements, locked dates, request lifecycle, pure rules, and typed errors.
- `internal/handlers`: auth, employees, departments, leave bindings with server-side RBAC enforcement.
- `app.go`: startup bootstrap + Wails bindings for auth, employees, departments, and leave.

## Frontend

Frontend stack: React + TypeScript + MUI + TanStack Router + TanStack Query.

- Router includes root, `/login`, `/dashboard`, `/employees`, `/departments`, `/leave`, `/access-denied`, and placeholder routes.
- Auth guards and root `notFoundComponent` remain intact.
- `/employees`:
  - DataGrid with CRUD, search, status filter, department filter, pagination
  - department select integrated in create/edit form
  - department name shown in listing
- `/departments`:
  - DataGrid list with search and pagination
  - create/edit dialog
  - delete confirmation with friendly integrity-error snackbar
- `/leave`:
  - role-aware tabs for apply, my history, admin queue, and locked dates planner
  - server-connected apply/approve/reject/cancel actions
  - balance summary cards, status chips, and snackbar feedback
- Navigation tests pass and include `/employees`, `/departments`, and `/leave` route/sidebar checks.

---

# 3. Milestone Progress

| Milestone                   | Status (Not Started/In Progress/Completed) | Notes |
|-----------------------------|--------------------------------------------|-------|
| Foundation                  | Completed                                  | Config, SQLX DB layer, migrations, startup migration runner, admin seeding completed. |
| Authentication              | Completed                                  | Login/logout/get-me with JWT access token + hashed refresh token storage completed. |
| Login UI + Dashboard Shell | Completed                                  | TanStack Router auth redirects and full MUI shell with dashboard placeholders completed. |
| Main Shell                 | Not Started                                | Will expand shell behavior and module-specific UX in later milestones. |
| Employees Module           | Completed                                  | Employees table + backend CRUD/list + RBAC + frontend DataGrid CRUD/list/search/pagination completed. |
| Departments Module         | Completed                                  | Departments CRUD with case-insensitive uniqueness, delete-with-employees prevention, and frontend DataGrid CRUD completed. |
| Leave Module               | Completed                                  | Leave types, entitlements, locked dates, requests lifecycle, server-side rules/RBAC, and `/leave` frontend implemented with tests. |
| Payroll Module             | Not Started                                | Placeholder route only. |
| User Management            | Not Started                                | Placeholder route only. |
| Audit Logging              | Not Started                                | Minimal table created; operational events pending. |
| Hardening Phase            | Not Started                                | Pending validation, monitoring, and production hardening tasks. |

---

# 4. In Progress

No active in-progress work at this milestone close. Next module is Payroll.

---

# 5. Next Steps

- Implement Payroll module end-to-end.
- Add deeper UI interaction tests for leave workflows and existing module mutations.

---

# Notes and References

- Always reference `docs/requirements.md` for the authoritative specification.  Do not change it.
- After each milestone update this file and create or update a corresponding note in `docs/notes/` summarising important decisions, binding surfaces and tests.
- Ensure the dashboard shell is always functional.  Run navigation tests after adding new routes to ensure that redirects and access checks behave correctly.
- Use Material UI (MUI v5+) for all frontend components and TanStack Router/Query for routing and data fetching.
- Keep this document concise and up‑to‑date.
