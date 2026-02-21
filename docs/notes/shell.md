# Login UI and Dashboard Shell Notes

Date: 2026-02-21

## Implemented

- React + TypeScript app with:
  - MUI v5+
  - TanStack Router
  - TanStack Query
- Routes:
  - `/`
  - `/login`
  - `/dashboard`
  - `/access-denied`
  - placeholders: `/employees`, `/departments`, `/leave`, `/payroll`, `/users`
- Root-level `notFoundComponent` configured.
- Auth-aware redirect logic:
  - `/` -> `/login` if unauthenticated
  - `/` -> `/dashboard` if authenticated
  - protected pages redirect to `/login` when unauthenticated

## UI Details

- Login page uses centered MUI card with loading and error snackbar.
- Dashboard shell includes:
  - Top AppBar with app name, username, role, logout
  - Permanent left Drawer with required navigation items
  - Main dashboard section with placeholder statistic cards
- Light theme configured with consistent spacing/padding and responsive grid.

## Tests Added

`frontend/src/router/router.test.tsx` verifies:

- Root redirect behavior
- Dashboard auth requirement logic
- Post-login redirect target
- Root notFound configuration and rendering
