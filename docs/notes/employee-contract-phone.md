# Employee Contract + Phone Defaults

Date: 2026-02-24

## Scope

- Employee extra fields:
  - `job_description`
  - `contract_url`
  - `contract_file_path`
  - `phone_e164`
- Settings defaults for phone validation:
  - `defaultCountryName`
  - `defaultCountryISO2`
  - `defaultCountryCallingCode`

## Schema Changes

- Added migration:
  - `internal/db/migrations/000013_add_employee_contract_phone_defaults.up.sql`
  - `internal/db/migrations/000013_add_employee_contract_phone_defaults.down.sql`
- Added migration:
  - `internal/db/migrations/000014_enforce_employee_gender_constraint.up.sql`
  - `internal/db/migrations/000014_enforce_employee_gender_constraint.down.sql`
- Added index:
  - `idx_employees_phone_e164`

## Contract Storage

- Contracts are stored in OS app data under:
  - `<appData>/hrpro/employees/<employeeId>/contract/<generatedFilename>`
- DB stores only relative path (`contract_file_path`).
- File bytes are not stored in DB.
- Upload supports `.pdf`, `.doc`, `.docx` with 10MB limit.
- Remove is best-effort delete: DB path is cleared, delete failure does not fail business flow.

## Backend Bindings

- Added employee bindings:
  - `UploadEmployeeContract(request handlers.UploadEmployeeContractRequest) (*employees.Employee, error)`
  - `RemoveEmployeeContract(request handlers.RemoveEmployeeContractRequest) (*employees.Employee, error)`
- Existing settings bindings now include phone defaults through existing DTOs:
  - `GetSettings`
  - `UpdateSettings`

## Phone Normalization Rules

- Authoritative validation is backend-side in employee service.
- Authoritative parsing/validation/formatting engine:
  - `github.com/nyaruka/phonenumbers`
- `internal/phone.NormalizePhone(input, defaultISO2)` behavior:
  - if input starts with `+`, parse with empty region
  - otherwise parse with settings `defaultCountryISO2`
  - requires a valid number (`IsValidNumber`)
  - stores normalized output as E.164 (`Format(..., E164)`)
- Normalized value is stored as E.164 in:
  - `phone` and `phone_e164`
- Defaults source:
  - persisted settings (`phoneDefaults`)
  - env override precedence for defaults:
    - `APP_DEFAULT_COUNTRY_NAME`
    - `APP_DEFAULT_COUNTRY_ISO2`
    - `APP_DEFAULT_COUNTRY_CALLING_CODE`
- Local fallback regex/calling-code inference logic was removed.
- Employee service now returns typed field-level validation errors and maps API messages with explicit field names for UI binding (`field=phone`, `field=gender`, etc).

## Gender Rules

- Gender is required server-side for employee create/update.
- Allowed values:
  - `Male`
  - `Female`
- Backend normalization accepts case-insensitive input and persists canonical values (`Male` / `Female`).
- DB constraints enforce schema-level safety:
  - `gender VARCHAR(10) NOT NULL`
  - `CHECK (gender IN ('Male', 'Female'))`
- Frontend employee form now uses a controlled dropdown (no free-text gender input).

## Architectural Decisions

- Kept clean layering:
  - handlers -> services -> repositories -> db
- Contract file operations are in employee service via `ContractStore`.
- Repository remains SQLX + parameterized queries only.
- RBAC enforced on contract upload/remove at service layer and handler mapping.

## Tests Added

- Go:
  - `internal/phone/normalize_test.go`
  - `internal/employees/contract_store_test.go`
  - `internal/db/migrations_test.go`
  - Extended `internal/employees/service_test.go`
  - Extended `internal/settings/service_test.go`
- Frontend:
  - `frontend/src/pages/EmployeesPage.test.tsx`
  - `frontend/src/lib/wails.employee-contract.test.ts`

## Routing/Navigation Validation

- Re-ran navigation suite:
  - `frontend/src/router/router.test.tsx` passed.
