# HISP HR System
## Development Status Tracker (Template)
## Phase A – Online-First (JWT + SQLX + golang-migrate)

Last Updated: 2026-02-21

---

# 1. Context Recovery Summary

Phase A foundation, authentication, and the initial shell are complete. The Employees module is now implemented end-to-end with migration, clean backend layers, Wails bindings, RBAC enforcement, and a production-ready frontend page using MUI DataGrid with CRUD and server-driven listing.

---

# 2. Current Implementation State (Detailed)

## Backend

Implemented packages follow clean layering: `handlers -> services -> repositories -> db`.

- `internal/config`: env-driven config loader for DB connection string, JWT secret, token expiry, and initial admin seed variables.
- `internal/db`: SQLX pool creation + ping validation and golang-migrate runner with embedded migrations.
- `internal/db/migrations`: users, refresh tokens, audit logs, and employees schema.
- `internal/repositories`: SQLX repositories for users and refresh token persistence.
- `internal/services`: token service (JWT issue/validate), auth service (login/logout/get-me), initial admin seed.
- `internal/employees`: SQLX repository + business service for employee CRUD/list/search/pagination and validation.
- `internal/handlers`: auth handlers and employees handlers with server-side RBAC enforcement.
- `internal/middleware`: JWT validation helper + role gate helper (`RequireRoles`).
- `app.go`: startup bootstrap + Wails bindings for auth and employees APIs.

## Frontend

Frontend stack: React + TypeScript + MUI + TanStack Router + TanStack Query.

- Router includes root, `/login`, `/dashboard`, `/employees`, `/access-denied`, and placeholder module routes.
- Auth-aware route guards and root-level `notFoundComponent` are intact.
- Dashboard shell remains stable with AppBar, Drawer, and placeholders.
- `/employees` now has:
  - DataGrid listing from backend
  - search + status filter + pagination
  - create/edit/view dialog
  - delete confirmation
  - loading/error/success states
  - query invalidation on mutations
- Navigation tests now also assert `/employees` route and sidebar entry.

---

# 3. Milestone Progress

| Milestone                   | Status (Not Started/In Progress/Completed) | Notes |
|-----------------------------|--------------------------------------------|-------|
| Foundation                  | Completed                                  | Config, SQLX DB layer, migrations, startup migration runner, admin seeding completed. |
| Authentication              | Completed                                  | Login/logout/get-me with JWT access token + hashed refresh token storage completed. |
| Login UI + Dashboard Shell | Completed                                  | TanStack Router auth redirects and full MUI shell with dashboard placeholders completed. |
| Main Shell                 | Not Started                                | Will expand shell behavior and module-specific UX in later milestones. |
| Employees Module           | Completed                                  | Employees table + backend CRUD/list + RBAC + frontend DataGrid CRUD/list/search/pagination completed. |
| Departments Module         | Not Started                                | Next module to implement. |
| Leave Module               | Not Started                                | Placeholder route only. |
| Payroll Module             | Not Started                                | Placeholder route only. |
| User Management            | Not Started                                | Placeholder route only. |
| Audit Logging              | Not Started                                | Minimal table created; operational events pending. |
| Hardening Phase            | Not Started                                | Pending validation, monitoring, and production hardening tasks. |

Update the `Status` column with the appropriate state and provide short notes in the `Notes` column to highlight key achievements or outstanding issues.

---

# 4. In Progress

No active in-progress tasks at milestone close. Employees module implementation and regression checks for navigation are complete.

---

# 5. Next Steps

- Implement Departments module (CRUD + assignment integration with employees).
- Add Department filter integration on Employees page when departments backend is available.
- Add richer test coverage for employees UI mutation flows.

---

# Notes and References

- Always reference `docs/requirements.md` for the authoritative specification.  Do not change it.
- After each milestone update this file and create or update a corresponding note in `docs/notes/` summarising important decisions, binding surfaces and tests.
- Ensure the dashboard shell is always functional.  Run navigation tests after adding new routes to ensure that redirects and access checks behave correctly.
- Use Material UI (MUI v5+) for all frontend components and TanStack Router/Query for routing and data fetching.
- Keep this document concise and up‑to‑date.
