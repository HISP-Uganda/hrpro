# User Management Notes

Date: 2026-02-21

## Binding Signatures

Backend Wails bindings added in `app.go`:

- `ListUsers(request handlers.ListUsersRequest) (*users.ListUsersResult, error)`
- `GetUser(request handlers.GetUserRequest) (*users.User, error)`
- `CreateUser(request handlers.CreateUserRequest) (*users.User, error)`
- `UpdateUser(request handlers.UpdateUserRequest) (*users.User, error)`
- `ResetUserPassword(request handlers.ResetUserPasswordRequest) error`
- `SetUserActive(request handlers.SetUserActiveRequest) (*users.User, error)`

Request payloads are defined in `internal/handlers/users_handler.go` and use `accessToken` + typed payload fields.

## Role Rules

- User management endpoints require `admin` role server-side.
- Role validation for create/update allows only:
  - `admin`
  - `hr_officer`
  - `finance_officer`
  - `viewer`
- Role comparison is normalized (`lowercase`, spaces to `_`) so existing legacy role strings still pass RBAC checks.

## Security Notes

- Passwords are hashed with bcrypt in user creation and password reset paths.
- `password_hash` is never returned in user management responses.
- Username uniqueness is enforced case-insensitively via SQLX parameterized checks.
- Self-protection rules:
  - Admin cannot deactivate own account.
  - Admin cannot remove own admin role.
- Successful login updates `users.last_login_at`.
- Added migration:
  - `internal/db/migrations/000008_add_last_login_to_users.up.sql`
  - `internal/db/migrations/000008_add_last_login_to_users.down.sql`

## Tests Added

Backend:

- `internal/users/service_test.go`
  - duplicate username rejected
  - password hashing occurs
  - cannot deactivate self
- `internal/handlers/users_handler_test.go`
  - non-admin blocked from user management endpoint

Frontend:

- `frontend/src/router/router.test.tsx`
  - `/users` admin route smoke behavior
  - non-admin redirect to `/access-denied`
  - route and sidebar coverage includes `/users`

Regression/navigation checks rerun:

- root redirect `/`
- `/dashboard`
- `/employees`
- `/departments`
- `/leave`
- `/payroll`
- `/users`
- unknown route via root `notFoundComponent`
