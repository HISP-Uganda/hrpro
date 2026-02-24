# Phase A UI Polish — Company Branding

Date: 2026-02-24

## Company Profile Source

- Frontend reads company branding from persisted settings/logo through a shared query hook:
  - `frontend/src/company/useCompanyProfile.ts`
- Query behavior:
  - reads company name from `getSettings(accessToken)`
  - if `company.logoPath` exists, reads logo bytes via `getCompanyLogo(accessToken)`
  - derives a data URL for rendering in `AppShell`

No new backend storage model or heavy dependency was introduced.

## UI Propagation

- `AppShell` now consumes `useCompanyProfile()` and renders:
  - AppBar title: `${companyName} HR System`
  - fallback title: `HR System` when company name is blank/missing
  - sidebar brand header with logo + company name
  - sidebar fallback when logo is missing: placeholder avatar + company name

## Immediate Update After Save

- `SettingsPage` now updates and invalidates company profile query data after:
  - settings save (`updateSettings`)
  - logo upload (`uploadCompanyLogo`)
- This ensures AppShell branding updates immediately without application restart.

## Tests Added

- `frontend/src/components/AppShell.branding.test.tsx`
  - AppBar fallback title `HR System` when name is missing
  - AppBar title `{Company} HR System` when name exists
  - Sidebar placeholder renders when logo is missing
  - Query invalidation smoke check updates AppBar title without reload
- Navigation tests re-run:
  - `frontend/src/router/router.test.tsx`
