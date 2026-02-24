# Shell Navigation Notes

Date: 2026-02-24

## Scope

- Updated `AppShell` navigation behavior only.
- Kept route list centralized in `appShellNavItems` and preserved existing role-based visibility checks.
- Did not refactor unrelated pages/modules.

## Breakpoints Used

- Desktop shell mode: `md` and up (`theme.breakpoints.up('md')`)
- Mobile shell mode: below `md` (`temporary` overlay drawer)

## Drawer Widths

- Expanded desktop drawer: `260px`
- Collapsed desktop mini drawer: `72px` (icon-only)
- Mobile overlay drawer width: `260px`

## Behavior Implemented

- AppBar hamburger toggles drawer behavior contextually:
  - Desktop: toggles mini/expanded permanent drawer.
  - Mobile: opens/closes temporary overlay drawer.
- Mini desktop mode:
  - Text labels visually collapsed.
  - Icon tooltips enabled for discoverability.
  - Active route highlighting retained.
- Mobile overlay mode:
  - Clicking a navigation item closes the drawer.
- Main content layout:
  - AppBar and drawer widths animate smoothly.
  - Main area keeps `minWidth: 0` and no horizontal overflow at shell level.

## State Persistence

- Desktop collapse preference is persisted in `localStorage` under key:
  - `hr.shell.drawerCollapsed`
- Stored values:
  - `"true"` collapsed
  - `"false"` expanded
- Startup behavior:
  - Desktop (`>= md`) reads and applies persisted collapsed/expanded value.
  - Mobile (`< md`) temporary drawer open state is never persisted and always starts closed.
- Reset preferences:
  - Remove localStorage key `hr.shell.drawerCollapsed` (for example in DevTools Application storage).

## How To Add Menu Items Safely

- Add items only in `appShellNavItems` in `frontend/src/components/AppShell.tsx`.
- Use an existing, valid route path defined in `frontend/src/router/index.tsx`.
- If role restrictions are needed:
  - `adminOnly: true` for admin-only modules.
  - `requiresReportAccess: true` for report-scoped visibility.
- Keep route protection in router guards/server-side RBAC; sidebar visibility is not security.
- Re-run `frontend/src/router/router.test.tsx` after changes to avoid navigation regressions and NotFound issues.

## Tests / Verification

- Re-ran frontend navigation/router smoke tests to confirm route integrity and notFound stability.
- Added unit test coverage for localStorage-based drawer collapsed initialization.
