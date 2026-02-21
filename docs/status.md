# HISP HR System
## Development Status Tracker (Template)
## Phase A – Online-First (JWT + SQLX + golang-migrate)

Last Updated: 2026-02-21

---

# 1. Context Recovery Summary

Phase A foundation, authentication, shell, employees, departments, leave, payroll, user management, and audit logging modules are implemented. Audit logging now includes schema normalization, a centralized service-layer recorder, actor propagation through context, and automatic event recording for auth, users, leave, and payroll actions. Routing remains stable with root redirects, protected routes, and root-level notFound handling; navigation tests continue to pass, including `/users`.

---

# 2. Current Implementation State (Detailed)

## Backend

Implemented packages follow clean layering: `handlers -> services -> repositories -> db`.

- `internal/config`: env-driven config loader for DB connection string, JWT secret, token expiry, and initial admin seed variables.
- `internal/db`: SQLX pool creation + ping validation and golang-migrate runner with embedded migrations.
- `internal/db/migrations`:
  - users, refresh tokens, audit logs (+ users `last_login_at`)
  - employees
  - departments table + employees FK (`ON DELETE RESTRICT`)
- `internal/services`: JWT/auth services and admin seeding.
- `internal/employees`: CRUD/list/search/pagination + validation and RBAC-enforced handlers.
- `internal/departments`: CRUD/list/search with duplicate-name protection and delete-with-employees prevention in service layer.
- `internal/leave`: leave types, entitlements, locked dates, request lifecycle, pure rules, and typed errors.
- `internal/payroll`: payroll batches/entries lifecycle, server-side calculations, transactional regenerate strategy (delete + recreate in one transaction), and CSV export.
- `internal/users`: admin-only user listing, create/update/reset-password/set-active operations with validation, self-protection checks, and typed errors.
- `internal/audit`: SQLX audit repository + centralized recorder with context actor extraction and graceful failure handling.
- `internal/handlers`: auth, employees, departments, leave, payroll, and users bindings with server-side RBAC enforcement.
- `app.go`: startup bootstrap + Wails bindings for auth, employees, departments, leave, payroll, and users; shared audit recorder wired into key services.

## Frontend

Frontend stack: React + TypeScript + MUI + TanStack Router + TanStack Query.

- Router includes root, `/login`, `/dashboard`, `/employees`, `/departments`, `/leave`, `/payroll`, `/payroll/:batchId`, `/users`, `/audit`, and `/access-denied`.
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
- `/payroll`:
  - server-backed batch listing with MUI DataGrid (toolbar, column visibility, resizing, sticky headers, server pagination)
  - create batch dialog and filters
- `/payroll/:batchId`:
  - batch lifecycle actions (generate/regenerate, approve, lock, export CSV) with confirm dialogs
  - inline entry editing for draft batches with mutation-backed recalculation persistence
  - status-aware controls, skeleton loading, and snackbar feedback
- `/users`:
  - admin-only route guard with non-admin redirect to `/access-denied`
  - DataGrid list/search/server pagination with sticky headers, toolbar, column visibility, and resize support
  - create/edit/reset-password/activate-deactivate dialogs with validation and snackbar feedback
- `/audit`:
  - admin-only route guard with non-admin redirect to `/access-denied`
  - DataGrid list/search/server pagination wired to backend audit logs
- Navigation tests pass and include `/users` and `/audit` route and guard checks.

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
| Payroll Module             | Completed                                  | End-to-end payroll lifecycle, transactional generation, RBAC, CSV export, and frontend pages completed. |
| User Management            | Completed                                  | Admin-only backend + `/users` frontend implemented with validation, RBAC, and tests. |
| Audit Logging              | Completed                                  | Centralized service-layer recorder with automatic auth/users/leave/payroll events and tests. Sidebar integration completed. |
| Hardening Phase            | Not Started                                | Next planned module. |

---

# 4. In Progress

No active in-progress work at this milestone close. Next module is Hardening Phase.

---

# 5. Next Steps

- Implement Hardening Phase tasks.
- Expand integration and resilience testing around audit + business event coverage.

---

# Notes and References

- Always reference `docs/requirements.md` for the authoritative specification.  Do not change it.
- After each milestone update this file and create or update a corresponding note in `docs/notes/` summarising important decisions, binding surfaces and tests.
- Ensure the dashboard shell is always functional.  Run navigation tests after adding new routes to ensure that redirects and access checks behave correctly.
- Use Material UI (MUI v5+) for all frontend components and TanStack Router/Query for routing and data fetching.
- Keep this document concise and up‑to‑date.
