# HISP HR System
## Development Status Tracker (Template)
## Phase A – Online-First (JWT + SQLX + golang-migrate)

Last Updated: 2026-02-21

---

# 1. Context Recovery Summary

Phase A foundation is implemented on top of the Wails v2 scaffold. The backend now has configuration loading, SQLX database connectivity, golang-migrate migrations, startup migration execution (non-production), and initial admin seeding. A minimal JWT authentication flow is implemented end-to-end and bound through Wails methods. Frontend routing is now TanStack Router based with auth-aware redirects and a production-ready MUI dashboard shell.

---

# 2. Current Implementation State (Detailed)

## Backend

Implemented packages now follow clean layering: `handlers -> services -> repositories -> db`.

- `internal/config`: env-driven config loader for DB connection string, JWT secret, access token expiry, refresh token expiry, and initial admin seed variables.
- `internal/db`: SQLX pool creation + ping validation and golang-migrate runner using embedded migration files.
- `internal/db/migrations`: added up/down migrations for `users`, `refresh_tokens`, and `audit_logs`.
- `internal/repositories`: SQLX repositories for users and refresh token persistence (parameterized SQL queries).
- `internal/services`: token service (JWT issue/validate), auth service (login/logout/get-me), refresh token hashing storage, initial admin seeding with bcrypt.
- `internal/handlers`: auth binding handlers for `Login`, `Logout`, and `GetMe`.
- `internal/middleware`: reusable JWT validation + RBAC helper (`RequireRoles`).
- `app.go` startup now bootstraps config/db/migrations/admin seed and binds auth methods.

## Frontend

Frontend stack now uses React + TypeScript + MUI + TanStack Router + TanStack Query.

- Router includes root, `/login`, `/dashboard`, `/access-denied`, placeholders (`/employees`, `/departments`, `/leave`, `/payroll`, `/users`) and root `notFoundComponent`.
- Auth-aware route rules:
  - `/` resolves to `/login` or `/dashboard` based on auth state.
  - Protected routes require authentication.
- Login UI implemented as centered MUI card with loading state and error snackbar.
- Dashboard renders within a polished shell:
  - Top AppBar with app name, username, role, logout.
  - Permanent Drawer with required navigation entries.
  - Main content heading and statistic placeholder cards.
- Theme configured in light mode with consistent spacing and responsive layout.
- Navigation tests added and passing (`frontend/src/router/router.test.tsx`).

---

# 3. Milestone Progress

| Milestone                   | Status (Not Started/In Progress/Completed) | Notes |
|-----------------------------|--------------------------------------------|-------|
| Foundation                  | Completed                                  | Config, SQLX DB layer, migrations, startup migration runner, admin seeding completed. |
| Authentication              | Completed                                  | Login/logout/get-me with JWT access token + hashed refresh token storage completed. |
| Login UI + Dashboard Shell | Completed                                  | TanStack Router auth redirects and full MUI shell with dashboard placeholders completed. |
| Main Shell                 | Not Started                                | Will expand shell behavior and module-specific UX in next milestones. |
| Employees Module           | Not Started                                | Placeholder route only. |
| Departments Module         | Not Started                                | Placeholder route only. |
| Leave Module               | Not Started                                | Placeholder route only. |
| Payroll Module             | Not Started                                | Placeholder route only. |
| User Management            | Not Started                                | Placeholder route only. |
| Audit Logging              | Not Started                                | Minimal table created; functional audit events pending. |
| Hardening Phase            | Not Started                                | Pending validation, monitoring, and production hardening tasks. |

Update the `Status` column with the appropriate state and provide short notes in the `Notes` column to highlight key achievements or outstanding issues.

---

# 4. In Progress

No active feature work in progress at the end of this milestone. Foundation and authentication baseline are complete, navigation tests are green, and the app builds successfully.

---

# 5. Next Steps

- Implement Employees module with CRUD flows and SQLX repositories.
- Implement Departments module and relationships for employee assignment.
- Add auth refresh flow and stricter RBAC enforcement per module route/operation.
- Expand audit logging writes for privileged actions.

---

# Notes and References

- Always reference `docs/requirements.md` for the authoritative specification.  Do not change it.
- After each milestone update this file and create or update a corresponding note in `docs/notes/` summarising important decisions, binding surfaces and tests.
- Ensure the dashboard shell is always functional.  Run navigation tests after adding new routes to ensure that redirects and access checks behave correctly.
- Use Material UI (MUI v5+) for all frontend components and TanStack Router/Query for routing and data fetching.
- Keep this document concise and up‑to‑date.
