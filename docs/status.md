# HISP HR System
## Development Status Tracker (Template)
## Phase A – Online-First (JWT + SQLX + golang-migrate)

Last Updated: 2026-02-24

---

# 1. Context Recovery Summary

Phase A foundation, authentication, shell, employees, departments, leave, payroll, user management, audit logging, dashboard enhancement, daily attendance, MVP reports, settings, database setup gate, Hardening Phase — Milestone 1, and UI polish for company branding are implemented. Company Profile branding now propagates across AppShell: AppBar title uses company name (`{Company} HR System` with `HR System` fallback), sidebar header shows company logo/name placeholder data sourced from persisted settings/logo, and footer support/copyright info is settings-driven with static app version/build display.
Employee enhancement completed: employee job description + contract URL/upload/remove support, settings-backed default country fields for phone normalization, and backend E.164 phone normalization at employee create/update.

---

# 2. Current Implementation State (Detailed)

## Backend

Implemented packages follow clean layering: `handlers -> services -> repositories -> db`.

- `internal/config`: env+local-file config loader with precedence (`APP_DB_CONNECTION_STRING` / `APP_JWT_SECRET` env overrides local file), JWT auto-generation/persistence when env secret is missing, startup health evaluation (`dbOk`, `runtimeOk`, separated errors), and JSON persistence in OS config/app-data directory (`hrpro/config.json`) with restricted permissions (`0600` file, `0700` dir).
- `internal/db`: SQLX pool creation + ping validation and golang-migrate runner with embedded migrations.
- `internal/db/migrations`:
  - users, refresh tokens, audit logs (+ users `last_login_at`)
  - employees
  - departments table + employees FK (`ON DELETE RESTRICT`)
  - employee enhancement migration: `job_description`, `contract_url`, `contract_file_path`, `phone_e164` (+ index)
- `internal/services`: JWT/auth services and admin seeding, including refresh rotation and refresh reuse detection handling.
- `internal/employees`: CRUD/list/search/pagination + validation and RBAC-enforced handlers.
- `internal/employees`: now includes job description, contract URL/path persistence, local contract file storage in app data directory (`hrpro/employees/<employeeId>/contract/<generatedFilename>`), upload/remove contract bindings, and backend phone normalization to E.164 using settings defaults.
- `internal/departments`: CRUD/list/search with duplicate-name protection and delete-with-employees prevention in service layer.
- `internal/leave`: leave types, entitlements, locked dates, request lifecycle, pure rules, and typed errors.
- `internal/payroll`: payroll batches/entries lifecycle, server-side calculations, transactional regenerate strategy (delete + recreate in one transaction), and CSV export.
- `internal/users`: admin-only user listing, create/update/reset-password/set-active operations with validation, self-protection checks, and typed errors.
- `internal/audit`: SQLX audit repository + centralized recorder with context actor extraction and graceful failure handling.
- `internal/dashboard`: SQLX-backed summary aggregation repository/service with role-aware response shaping and Wails binding integration.
- `internal/attendance`: daily register + lunch/catering repository/service/rules with SQLX, lock handling, RBAC enforcement, absent-to-leave orchestration, and audit events.
- `internal/reports`: report filters/DTOs, SQLX query repository, RBAC + validation service orchestration, CSV export generation, typed errors, and report tests.
- `internal/settings`: app settings key/value JSONB repository/service, logo file storage, settings DTO retrieval/update, and settings-backed formatting/default integrations.
- `internal/settings`: includes phone defaults (`defaultCountryName`, `defaultCountryISO2`, `defaultCountryCallingCode`) with env override support for defaults resolution.
- `internal/handlers`: auth, employees, departments, leave, payroll, users, audit, dashboard, attendance, reports, and settings bindings with server-side RBAC enforcement; auth now includes typed refresh error mapping (`auth.refresh_invalid`, `auth.refresh_expired`, `auth.refresh_reused`).
- `app.go`: startup bootstrap + Wails bindings for auth, employees, departments, leave, payroll, users, audit, dashboard, attendance, reports, and settings; startup health and DB setup bindings (`GetStartupHealth`, `TestDatabaseConnection`, `SaveDatabaseConfig`, `ReloadConfigAndReconnect`) include separated DB/runtime health and lazy reconnect behavior; shared audit recorder wired into key services. Added `Refresh` binding for rotated JWT session renewal.

## Frontend

Frontend stack: React + TypeScript + MUI + TanStack Router + TanStack Query.

- Router includes root, `/setup-db`, `/login`, `/dashboard`, `/employees`, `/departments`, `/leave`, `/attendance`, `/payroll`, `/payroll/:batchId`, `/reports`, `/users`, `/settings`, `/audit`, and `/access-denied`.
- Startup health is loaded before router mount; `dbOk=false` redirects root/login/protected routes to `/setup-db` and blocks login until DB setup succeeds.
- Startup session recovery hardening:
  - if access token is invalid, frontend attempts `refresh`.
  - refresh failures force logout, clear TanStack Query cache, redirect to `/login`, and display a clear message on the login page.
- Setup page now surfaces separate statuses for Database Config and Runtime Security (JWT readiness without exposing secret value).
- `/setup-db`:
  - DB connection form: host, port, database, user, password, sslmode
  - masked connection string preview
  - test connection + save local config + reconnect flow
  - redirect to `/login` after successful reconnect
- Auth guards and root `notFoundComponent` remain intact.
- Unknown routes now have explicit regression coverage to ensure `notFoundComponent` renders without TanStack notFound warnings.
- `/employees`:
  - DataGrid with CRUD, search, status filter, department filter, pagination
  - department select integrated in create/edit form
  - department name shown in listing
  - employee form includes job description textarea, contract URL field, contract upload/remove controls, and phone default placeholder hints from settings
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
- `/settings`:
  - admin-only route guard with non-admin redirect to `/access-denied`
  - cards for Company Profile (name + logo upload/preview), Currency, Lunch defaults, and Payroll display defaults
  - backend-connected settings query/mutations with validation, loading skeletons, and snackbar feedback
  - Phone Defaults section added for country name/ISO2/calling code used in phone normalization
- AppShell branding polish:
  - new shared `useCompanyProfile` query as single frontend source for company name/logo presentation
  - AppBar title now renders `${companyName} HR System` with `HR System` fallback when name is blank/missing
  - sidebar "Navigation" header replaced with branded header (logo if available, otherwise placeholder + company name)
  - branding updates immediately after Company Profile save/upload via query cache update + invalidation
- Cross-app stabilization:
  - Standardized DataGrid styling (bold + sticky headers) and fixed CSV exports using Wails Save dialog.
- Theme system added (light/dark/system + accent presets + persistence).
- App shell now supports responsive MUI Drawer variants: desktop permanent + collapsible mini mode, mobile temporary overlay with auto-close on route click.
- Desktop shell drawer collapsed preference is now persisted and restored from localStorage.
- Settings-backed currency formatting now applies in Payroll/Attendance UI and report/payroll CSV currency columns; lunch defaults source values from settings.
- Navigation tests pass and include root/login/setup-db guard behavior, `/dashboard`, `/employees`, `/departments`, `/leave`, `/payroll`, `/users`, `/settings`, `/audit`, `/attendance`, and `/reports` route checks.

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
| Settings Module            | Completed                                  | Admin-only `/settings` route + settings bindings/service/repository, logo upload + retrieval, settings persistence, and cross-module formatting/default integrations completed. |
| Database Setup Flow        | Completed                                  | Startup DB health gate + `/setup-db` screen + local DB config persistence + reconnect/test bindings + routing smoke tests completed. Save failure fixed and `APP_JWT_SECRET` auto-generated/persisted when missing. |
| Hardening Phase — Milestone 1 | Completed                               | Routing/auth/setup gating hardening complete: refresh rotation + reuse handling, startup session recovery, unknown-route notFound regression coverage, and navigation test reruns passed. |
| Phase A UI Polish — Company Branding | Completed                        | Branding: company name in AppBar, logo upload/remove/url-import, footer with support info. |
| Phase A Enhancement — Employee Contract + Phone Defaults | Completed      | Employee: job description + contract link/upload/remove; Settings: default country values for phone parsing; backend phone normalization to E.164 and tests. |

---

# 4. In Progress

Phase A Enhancement — Employee Contract + Phone Defaults completed. Next milestone: Hardening Phase — Milestone 2.

---

# 5. Next Steps

- Implement Hardening Phase — Milestone 2 tasks.
- Expand auth/session coverage for token expiry windows and concurrent refresh race scenarios.
- Continue regression hardening for reports/access-control edge cases in cross-role QA.

---

# Notes and References

- Always reference `docs/requirements.md` for the authoritative specification.  Do not change it.
- After each milestone update this file and create or update a corresponding note in `docs/notes/` summarising important decisions, binding surfaces and tests.
- Ensure the dashboard shell is always functional.  Run navigation tests after adding new routes to ensure that redirects and access checks behave correctly.
- Use Material UI (MUI v5+) for all frontend components and TanStack Router/Query for routing and data fetching.
- Keep this document concise and up‑to‑date.
