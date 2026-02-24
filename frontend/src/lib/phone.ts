import { isSupportedCountry, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

export const INVALID_PHONE_ERROR = 'Enter a valid phone number for the configured default country'

type ValidateAndNormalizePhoneResult =
  | { ok: true; e164?: string }
  | { ok: false; error: string }

export function toCountryCode(input?: string): CountryCode | undefined {
  const value = (input ?? '').trim().toUpperCase()
  if (!value) {
    return undefined
  }
  if (isSupportedCountry(value)) {
    return value
  }
  return undefined
}

export function validateAndNormalizePhone(input: string, defaultISO2: string): ValidateAndNormalizePhoneResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: true }
  }

  const region = toCountryCode(defaultISO2) ?? 'UG'

  try {
    const phone = trimmed.startsWith('+')
      ? parsePhoneNumberFromString(trimmed)
      : parsePhoneNumberFromString(trimmed, region)

    if (!phone || !phone.isValid()) {
      return { ok: false, error: INVALID_PHONE_ERROR }
    }

    return { ok: true, e164: phone.number }
  } catch {
    return { ok: false, error: INVALID_PHONE_ERROR }
  }
}
