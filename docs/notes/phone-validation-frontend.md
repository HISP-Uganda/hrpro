# Frontend Phone Validation (Employee Form)

Date: 2026-02-24

## Summary

- Added client-side phone validation/normalization for Employee create/edit using `libphonenumber-js` (minimal metadata import path: `libphonenumber-js/min`).
- Validation runs on phone field blur and on submit.
- Invalid phone blocks save/create.
- Server-side validation remains authoritative and backend field errors still map to the phone field.
- Updated phone helper typing to use `CountryCode` + `isSupportedCountry` conversion guard (`toCountryCode`) before parsing national input.

## Default Country Source

- Employee form reads country defaults from Settings (`phoneDefaults.defaultCountryISO2`).
- If settings are not yet loaded, fallback is `defaultAppSettings.phoneDefaults.defaultCountryISO2` (`UG`).

## Validation and Normalization Rules

- Helper added at `frontend/src/lib/phone.ts`:
  - `validateAndNormalizePhone(input, defaultISO2) -> { ok, e164?, error? }`
- Input behavior:
  - If input starts with `+`, parse as international (no region fallback).
  - Otherwise parse with `defaultISO2`.
  - Must pass library validity check (`isValid()`).
- Output behavior:
  - Valid numbers return normalized E.164 via `phone.number`.
  - Invalid numbers return a field-safe error string.
  - Empty input is treated as valid for optional phone fields.

## UI/Behavior Changes (Employee Form)

- `Phone` field now validates on blur and shows inline helper error on failure.
- Submit path re-validates and blocks mutation when invalid.
- Valid numbers normalize to E.164 before payload submission.
- Backend phone validation errors (`validation error [field=phone]`) are mapped back to the phone field helper text.

## Tests Added/Updated

- Unit tests: `frontend/src/lib/phone.test.ts`
  - valid national + default ISO2 -> `ok=true`, E.164
  - valid international (`+...`) -> `ok=true`, E.164
  - invalid input -> `ok=false` + error
  - empty input -> `ok=true` (optional field rule)
- Component tests: `frontend/src/pages/EmployeesPage.test.tsx`
  - invalid phone shows field error and blocks Save
  - valid phone clears error and allows Save
  - settings `defaultCountryISO2` is used for national parsing (payload normalized to E.164)
  - backend phone field error still maps to phone helper text
