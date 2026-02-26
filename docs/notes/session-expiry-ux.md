# Session Expiry UX Hardening

Date: 2026-02-24

## Scope

Phase A hardening focused only on auth-expiry error mapping and forced re-login UX for write/update mutations.

## Backend Error Codes

- Added standardized protected-route auth token mapping in handlers:
  - `AUTH_EXPIRED`
  - `AUTH_UNAUTHORIZED`
- Added typed token validation errors in `internal/services`:
  - `ErrAccessTokenMissing`
  - `ErrAccessTokenExpired`
  - `ErrAccessTokenInvalid`
- Updated token parsing to avoid leaking raw JWT parser details to UI.
- Updated protected handlers (`employees`, `departments`, `leave`, `payroll`, `settings`, `attendance`, `reports`, `users`, `audit`, `dashboard`, `auth.GetMe`) to use shared auth-claim validation mapping.

## Frontend Centralized Handler

- Added centralized mutation auth-expiry handler:
  - File: `frontend/src/auth/authExpiry.ts`
  - Detects `AUTH_EXPIRED` / `AUTH_UNAUTHORIZED` and fallback token-related unauthorized patterns.
- Wired globally via TanStack Query mutation cache in `frontend/src/App.tsx`.
- On auth-expiry mutation error:
  - Sets notice message: `Session expired. Please log in again.`
  - Clears auth store tokens/session
  - Clears React Query cache
  - Redirects to `/login`
- Login page already consumes notice and shows it as prominent snackbar feedback.

## Binding Signatures

- No Wails binding signatures changed.
- Behavior change is in error code mapping only for protected access token failures.

## Schema Changes

- None.

## Architectural Decisions

- Kept auth-expiry handling centralized in frontend mutation pipeline to avoid duplicating checks in each page mutation.
- Kept backend auth token mapping centralized in handlers to preserve clean architecture and avoid business logic in bindings/pages.

## Tests Added

- Backend:
  - `internal/services/jwt_service_auth_errors_test.go`
    - missing/expired/invalid token mapping
  - `internal/handlers/auth_errors_test.go`
    - protected handler returns `AUTH_EXPIRED` / `AUTH_UNAUTHORIZED`
- Frontend:
  - `frontend/src/auth/authExpiry.test.ts`
    - `AUTH_EXPIRED` => notice + clear auth + clear cache + navigate `/login`
    - validation error => no forced logout

## Verification

- Navigation tests rerun and passing:
  - `frontend/src/router/router.test.tsx`
- Frontend auth tests passing:
  - `frontend/src/auth/authExpiry.test.ts`
  - `frontend/src/auth/sessionRecovery.test.ts`
- Full backend tests passing:
  - `GOCACHE=$(pwd)/.gocache go test ./...`
