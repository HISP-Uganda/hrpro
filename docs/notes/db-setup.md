# Database Setup Flow Notes

Date: 2026-02-24

## Scope

Implemented a startup database setup flow for the Wails desktop app so DB configuration is required before login when startup DB connectivity is missing/invalid.

## Schema Changes

- None.
- No migrations were added for this milestone.

## Binding Signatures

Added new Wails bindings in `app.go`:

- `GetStartupHealth() -> { dbOk: bool, runtimeOk: bool, dbError?: string, runtimeError?: string }`
- `TestDatabaseConnection(params) -> { ok: bool } | error`
- `SaveDatabaseConfig(params) -> { ok: bool } | error`
- `ReloadConfigAndReconnect() -> { ok: bool } | error`

`params` shape:

- `host string`
- `port int`
- `database string`
- `user string`
- `password string`
- `sslmode string`

## Architectural Decisions

- Config precedence: environment first, then local config file.
  - DB: `APP_DB_CONNECTION_STRING` env value overrides local file database settings.
  - JWT: `APP_JWT_SECRET` env value overrides local file `jwtSecret`.
  - If env DB connection string is empty, local DB settings are used to build Postgres DSN.
- JWT secret behavior (MVP):
  - If env secret exists, use it.
  - Else if local file has `jwtSecret`, use it.
  - Else generate a strong random secret (32 bytes), encode, persist in local config, and reuse on next start.
  - Secret value is never returned in API responses and is not logged.
- Local config file persistence is handled in `internal/config` and kept outside Git.
- Startup health separates database state and runtime security state:
  - `dbOk`/`dbError` for DB configuration presence/validity
  - `runtimeOk`/`runtimeError` for JWT runtime readiness
- Reconnect flow keeps existing DB/handlers untouched on reconnect failure and only swaps when full bootstrap succeeds.

## Local Config Location Per OS

Stored as JSON under app config/app-data root with filename `hrpro/config.json`.

- macOS: `~/Library/Application Support/hrpro/config.json`
- Linux: `${XDG_CONFIG_HOME:-~/.config}/hrpro/config.json`
- Windows: `%AppData%\\hrpro\\config.json`

Permissions (best effort MVP):

- Config directory: `0700` (Unix-like)
- Config file: `0600` (Unix-like)

Note: Password and generated JWT secret are stored locally in this MVP file format with restricted file permissions. Planned hardening option: move secret storage to OS keychain/credential manager.

## Frontend Routing and UX

- Added route: `/setup-db`
- Added startup health store loaded before router mount.
- Route guards now enforce:
  - `dbOk=false`: `/` and `/login` redirect to `/setup-db`; protected routes redirect to `/setup-db`
  - `dbOk=true`: `/setup-db` redirects to `/login` or `/dashboard` depending on auth session
- Setup UI includes:
  - host, port, database, user, password, sslmode inputs
  - masked connection string preview
  - separate status cards for Database Config and Runtime Security (without exposing JWT value)
  - Test Connection action
  - Save action (atomic local save + reconnect + refresh startup health)
  - Snackbar feedback

## Tests Added

- Backend unit tests:
  - `internal/config/config_test.go`
  - verifies precedence `env > file` for DB and JWT secret
  - verifies JWT secret generation + persistence when env/file are missing
  - verifies restart reuse of persisted JWT secret
  - verifies local file fallback when env DB connection string is absent
  - verifies atomic save behavior leaves no stale temp file and reload succeeds
  - verifies file permission mode `0600` on saved config
- Frontend routing smoke/guard tests updated:
  - `frontend/src/router/router.test.tsx`
  - verifies `dbOk=false -> /setup-db`
  - verifies `dbOk=true -> /login`
  - verifies login route remains allowed when DB is configured (runtime warning state does not block routing)
  - verifies existing route guard behavior remains intact
