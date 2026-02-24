# Branding + Footer (Phase A UI Polish)

## Scope
- Company profile branding only (name/logo/support info/copyright holder).
- AppShell title/sidebar/footer rendering updates.
- No schema migration changes.

## Schema Changes
- None.
- Existing `app_settings` JSON payload (`company_profile`) extended with:
  - `logoPath` (relative path, e.g. `branding/logo_<token>.png`)
  - `logoUpdatedAt` (timestamp metadata)
  - `supportEmail`
  - `supportPhone`
  - `supportWebsite`
  - `copyrightHolder`

## Logo Storage Design
- Logo files are stored in OS app data root used by Wails app initialization: `<UserConfigDir>/hrpro/branding/`.
- Only relative path metadata is saved in DB settings (`branding/...`).
- Backend may return `logoDataUrl` for frontend rendering; base64 is not stored in DB.
- Old logo file deletion is best-effort on replace/remove.

## URL Import Behavior + Limits
- Binding: `ImportCompanyLogoFromURL(url)`.
- Validation rules:
  - URL must be `http` or `https`.
  - Redirects to non-http(s) are rejected.
  - Download timeout enforced by HTTP client.
  - Max bytes enforced: `2MB`.
  - Image type validated by byte sniffing (`png`, `jpeg`, `webp` only).
- Safe filename generation is backend-controlled (`logo_<token>.<ext>`); remote filename is never trusted.

## Footer Behavior
- Visible on all authenticated AppShell pages.
- Left:
  - `© {currentYear} {copyrightHolder||companyName||'HR System'}`
- Right:
  - `Support: {email} | {phone} | {website}` (only configured fields are shown)
  - Static build label: `v0.0.0 (desktop)`
- AppBar brand title:
  - `{CompanyName} HR System` if name exists
  - `HR System` fallback

## Binding Signatures Added/Extended
- `GetCompanyProfile(request GetSettingsRequest) (*settings.CompanyProfileDTO, error)`
- `SaveCompanyProfile(request SaveCompanyProfileRequest) (*settings.CompanyProfileDTO, error)`
- `UploadCompanyLogo(request UploadCompanyLogoRequest) (*settings.CompanyProfileDTO, error)`
  - request includes `filename`, `mimeType`, `data`
- `ImportCompanyLogoFromURL(request ImportCompanyLogoFromURLRequest) (*settings.CompanyProfileDTO, error)`
- `RemoveCompanyLogo(request GetSettingsRequest) (*settings.CompanyProfileDTO, error)`

## Architectural Decisions
- Kept clean layering: bindings/handlers delegate to settings service; business validation remains in service layer.
- RBAC enforced server-side on logo/profile mutations (`admin` required).
- `GetCompanyProfile` is auth-protected and returns rendering-oriented data (including optional `logoDataUrl`) to avoid ad-hoc frontend logo fetch chaining.

## Tests Added/Updated
- Go (`internal/settings`):
  - branding directory creation and relative-path storage tests.
  - upload saves file + metadata.
  - URL import rejects non-http(s), non-image, oversize; succeeds on valid image.
  - remove clears metadata and deletes file best-effort.
  - profile returns empty `logoDataUrl` after removal.
- Frontend:
  - `AppShell` branding/footer tests (title fallback, support/footer year/build rendering).
  - settings branding tests for URL validation + backend error handling.
  - remove-logo button visibility based on logo existence.
- Navigation smoke rerun:
  - `src/router/router.test.tsx` passed (20/20).
