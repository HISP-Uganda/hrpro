# Foundation Milestone Notes

Date: 2026-02-21

## Scope Completed

- Added environment config loader in `internal/config`.
- Added SQLX connection pool + connection validation in `internal/db`.
- Added golang-migrate migration runner with embedded SQL migration files.
- Added schema migrations (up/down):
  - `users`
  - `refresh_tokens`
  - `audit_logs`
- Wired startup bootstrap in `app.go`:
  - config load
  - DB connect + ping
  - dev-mode migrations
  - initial admin seeding

## Environment Variables

- `APP_ENV` (`development` default)
- `APP_DB_CONNECTION_STRING` (required)
- `APP_JWT_SECRET` (required)
- `APP_ACCESS_TOKEN_EXPIRY_MINUTES` (default `15`)
- `APP_REFRESH_TOKEN_EXPIRY_HOURS` (default `168`)
- `APP_INITIAL_ADMIN_USERNAME`
- `APP_INITIAL_ADMIN_PASSWORD`
- `APP_INITIAL_ADMIN_ROLE` (default `Admin`)

## Architecture Notes

Layering used for backend calls:

`handlers -> services -> repositories -> db`

All DB access uses SQLX with parameterized queries.
