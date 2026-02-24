# HISP HR System
## Development Status Tracker (Template)
## Phase A – Online-First (JWT + SQLX + golang-migrate)

Last Updated: 2026-02-24

---

# 1. Context Recovery Summary

Phase A foundation, authentication, shell, employees, departments, leave, payroll, user management, audit logging, dashboard enhancement, daily attendance, and MVP reports modules are implemented. Reports now include `/reports` route integration, role-aware sidebar visibility, server-side RBAC-enforced report queries, and CSV exports for employee list, leave requests, attendance summary, payroll batches, and audit logs. Responsive collapsible navigation implemented (mini variant + mobile drawer). Shell drawer collapsed state persisted (localStorage).

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
- `internal/dashboard`: SQLX-backed summary aggregation repository/service with role-aware response shaping and Wails binding integration.
- `internal/attendance`: daily register + lunch/catering repository/service/rules with SQLX, lock handling, RBAC enforcement, absent-to-leave orchestration, and audit events.
- `internal/reports`: report filters/DTOs, SQLX query repository, RBAC + validation service orchestration, CSV export generation, typed errors, and report tests.
- `internal/handlers`: auth, employees, departments, leave, payroll, users, audit, dashboard, attendance, and reports bindings with server-side RBAC enforcement.
- `app.go`: startup bootstrap + Wails bindings for auth, employees, departments, leave, payroll, users, audit, dashboard, attendance, and reports; shared audit recorder wired into key services.

## Frontend

Frontend stack: React + TypeScript + MUI + TanStack Router + TanStack Query.

- Router includes root, `/login`, `/dashboard`, `/employees`, `/departments`, `/leave`, `/attendance`, `/payroll`, `/payroll/:batchId`, `/reports`, `/users`, `/audit`, and `/access-denied`.
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
- `/dashboard`:
  - TanStack Query-powered summary fetch with loading skeleton and error state
  - KPI cards, department bar visualization, leave snapshot, recent activity table, and role-based quick actions
  - role-adaptive rendering for Admin/HR/Finance/Viewer
- `/attendance`:
  - tabbed daily register + lunch/catering UI
  - role-aware actions (admin/hr mark + post absent to leave, finance/viewer read-only, staff self view)
  - loading skeletons, error snackbars, mutation disable states, and post-confirmation dialog
- `/reports`:
  - role-aware report tabs (Employees, Leave, Attendance, Payroll, Audit)
  - filter bar + run action + server paginated MUI DataGrid per report
  - CSV export mutations with native Wails save dialog flow and snackbar feedback for save/cancel/error
  - loading skeletons, empty/error handling, and access-denied mapping on forbidden responses
- Cross-app stabilization:
  - Standardized DataGrid styling (bold + sticky headers) and fixed CSV exports using Wails Save dialog.
- Theme system added (light/dark/system + accent presets + persistence).
- App shell now supports responsive MUI Drawer variants: desktop permanent + collapsible mini mode, mobile temporary overlay with auto-close on route click.
- Desktop shell drawer collapsed preference is now persisted and restored from localStorage.
- Navigation tests pass and include `/dashboard`, `/employees`, `/departments`, `/leave`, `/payroll`, `/users`, `/audit`, `/attendance`, and `/reports` route checks.

---

# 3. Milestone Progress

| Milestone                   | Status (Not Started/In Progress/Completed) | Notes |
|-----------------------------|--------------------------------------------|-------|
| Foundation                  | Completed                                  | Config, SQLX DB layer, migrations, startup migration runner, admin seeding completed. |
| Authentication              | Completed                                  | Login/logout/get-me with JWT access token + hashed refresh token storage completed. |
| Login UI + Dashboard Shell | Completed                                  | TanStack Router auth redirects and full MUI shell with dashboard placeholders completed. |
| Main Shell                 | Completed                                  | Responsive AppShell navigation implemented with desktop mini variant, mobile overlay drawer, active route highlighting, and role-aware menu visibility retained. |
| Employees Module           | Completed                                  | Employees table + backend CRUD/list + RBAC + frontend DataGrid CRUD/list/search/pagination completed. |
| Departments Module         | Completed                                  | Departments CRUD with case-insensitive uniqueness, delete-with-employees prevention, and frontend DataGrid CRUD completed. |
| Leave Module               | Completed                                  | Leave types, entitlements, locked dates, requests lifecycle, server-side rules/RBAC, and `/leave` frontend implemented with tests. |
| Payroll Module             | Completed                                  | End-to-end payroll lifecycle, transactional generation, RBAC, CSV export, and frontend pages completed. |
| User Management            | Completed                                  | Admin-only backend + `/users` frontend implemented with validation, RBAC, and tests. |
| Audit Logging              | Completed                                  | Centralized service-layer recorder with automatic auth/users/leave/payroll events and tests. Sidebar integration completed. |
| Dashboard Enhancement      | Completed                                  | Data-driven dashboard summary, role-adaptive visibility, backend aggregation service, and frontend operational cards/table/actions completed. |
| Daily Attendance           | Completed                                  | Daily register, lock/override flow, lunch/catering totals, absent-to-leave integration, RBAC, audit events, `/attendance` route, and tests completed. |
| Reports Module (MVP)       | Completed                                  | `/reports` route + sidebar integration, five required reports end-to-end, server-side RBAC, filters/pagination, CSV exports, and tests completed. |
| Hardening Phase            | Not Started                                | Next planned module after reports milestone. |

---

# 4. In Progress

Completed hardening update: standardized export save flow and DataGrid behavior across modules. Responsive collapsible navigation implemented (mini variant + mobile drawer). Shell drawer collapsed state persisted (localStorage). Next module remains Hardening Phase stabilization follow-ups.

---

# 5. Next Steps

- Implement Hardening Phase tasks.
- Add integration/regression coverage for report exports, large-result safeguards, and cross-role access checks.
- Validate shell responsiveness and navigation behavior in full desktop/mobile QA pass.

---

# Notes and References

- Always reference `docs/requirements.md` for the authoritative specification.  Do not change it.
- After each milestone update this file and create or update a corresponding note in `docs/notes/` summarising important decisions, binding surfaces and tests.
- Ensure the dashboard shell is always functional.  Run navigation tests after adding new routes to ensure that redirects and access checks behave correctly.
- Use Material UI (MUI v5+) for all frontend components and TanStack Router/Query for routing and data fetching.
- Keep this document concise and up‑to‑date.
