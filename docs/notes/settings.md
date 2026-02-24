# Settings Module Notes

Date: 2026-02-24

## Schema Changes

- Added migration `000012_create_app_settings`:
  - Table: `app_settings`
  - Columns:
    - `key` (TEXT, PK)
    - `value_json` (JSONB, required)
    - `updated_by_user_id` (nullable FK -> `users.id`, `ON DELETE SET NULL`)
    - `updated_at` (TIMESTAMPTZ)
  - Index:
    - `idx_app_settings_updated_at`

## Stored Settings Keys

- `company_profile`
  - `{ "name": string, "logoPath"?: string }`
- `currency`
  - `{ "code": string, "symbol": string, "decimals": number }`
- `lunch_defaults`
  - `{ "plateCostAmount": number, "staffContributionAmount": number }`
- `payroll_display`
  - `{ "decimals": number, "roundingEnabled": boolean }`

## Wails Binding Signatures

- `GetSettings(request: { accessToken: string }) -> SettingsDTO`
- `UpdateSettings(request: { accessToken: string, payload: UpdateSettingsInput }) -> SettingsDTO` (Admin only)
- `UploadCompanyLogo(request: { accessToken: string, filename: string, data: []byte }) -> string` (Admin only)
- `GetCompanyLogo(request: { accessToken: string }) -> { filename, mimeType, data }`

## Architectural Decisions

- Implemented clean layering:
  - `handlers/settings_handler.go`
  - `internal/settings/service.go`
  - `internal/settings/repository.go`
- File storage for company logo is outside DB in app data/config directory:
  - `<user_config_dir>/hrpro/logos`
- `app_settings` remains key/value JSONB for flexible future settings additions.
- Server-side RBAC:
  - `UpdateSettings` and `UploadCompanyLogo`: Admin only.
  - `GetSettings` and `GetCompanyLogo`: authenticated access.
- Integrations:
  - Attendance lunch defaults now source default plate/staff contribution values from settings.
  - Payroll CSV export and Reports CSV currency columns use settings-based symbol/decimals/rounding.
  - Frontend Payroll/Attendance/Reports displays use settings-based currency formatting.

## DTO Summary

`SettingsDTO`
- `company: { name, logoPath? }`
- `currency: { code, symbol, decimals }`
- `lunchDefaults: { plateCostAmount, staffContributionAmount }`
- `payrollDisplay: { decimals, roundingEnabled }`

## Tests Added

- `internal/settings/service_test.go`
  - Validation checks
  - Admin RBAC enforcement
  - Default settings behavior
  - Logo persistence behavior
- `internal/handlers/settings_handler_test.go`
  - Admin-only RBAC check at handler layer
- Router smoke tests updated for `/settings` route visibility and rendering.
