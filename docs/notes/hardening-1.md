# Hardening Phase — Milestone 1

Date: 2026-02-24

## Summary of Fixes

- Hardened auth/session flow with backend refresh-token rotation and reuse detection.
- Added typed/auth-safe refresh errors returned by backend auth handler:
  - `auth.refresh_invalid`
  - `auth.refresh_expired`
  - `auth.refresh_reused`
- Added frontend startup session recovery:
  - validates current access token via `getMe`
  - attempts refresh when access token is invalid
  - on refresh failure/reuse: clears auth state, clears TanStack Query cache, redirects to `/login`, and surfaces a clear login message.
- Hardened manual logout path to always clear auth state + query cache.
- Added routing regression coverage for unknown route handling with root `notFoundComponent` and no TanStack notFound warnings.

## Binding / Handler Changes

- Backend Wails binding added:
  - `App.Refresh(request handlers.RefreshRequest) (*handlers.LoginResponse, error)`
- Auth handler added:
  - `Refresh(ctx context.Context, request RefreshRequest) (*LoginResponse, error)`
- Frontend gateway added:
  - `refresh(refreshToken: string): Promise<LoginResult>`

## Architectural Decisions

- Refresh reuse detection is based on presented token state:
  - if a known token is already revoked, treat as reuse and return `auth.refresh_reused`.
- On refresh reuse, backend revokes all active refresh tokens for the user to invalidate compromised sessions.
- Error responses remain typed and safe for UI handling without leaking internal stack traces.
- Startup gating remains deterministic and unchanged in behavior:
  - `dbOk=false => /setup-db`
  - `dbOk=true => /login` (unauthenticated) / protected routes still guarded.

## Schema Changes

- None.

## Tests Added / Updated

- Go:
  - `internal/services/auth_service_test.go`
    - `TestRefreshRotatesTokens`
    - `TestRefreshReturnsReuseErrorForRevokedToken`
- Frontend:
  - `frontend/src/auth/sessionRecovery.test.ts`
    - refresh reuse notice mapping
    - forced logout + query cache clear + redirect behavior on refresh reuse
  - `frontend/src/router/router.test.tsx`
    - unknown route renders notFound component without notFound warnings
    - existing navigation/guard tests re-run

## Verification Run

- Navigation tests baseline before fixes: pass.
- Post-change frontend routing/auth tests:
  - `vitest run src/auth/sessionRecovery.test.ts src/router/router.test.tsx` passed.
- Post-change Go tests:
  - `go test ./internal/services ./internal/handlers` passed.
