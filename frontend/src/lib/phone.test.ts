import { describe, expect, it } from 'vitest'

import { INVALID_PHONE_ERROR, toCountryCode, validateAndNormalizePhone } from './phone'

describe('validateAndNormalizePhone', () => {
  it('normalizes lowercase ISO2 to CountryCode', () => {
    expect(toCountryCode('ug')).toBe('UG')
  })

  it('keeps uppercase ISO2 as CountryCode', () => {
    expect(toCountryCode('UG')).toBe('UG')
  })

  it('returns undefined for unsupported country code', () => {
    expect(toCountryCode('XXX')).toBeUndefined()
  })

  it('accepts a valid national number with default country and returns E.164', () => {
    const result = validateAndNormalizePhone('4155552671', 'US')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.e164).toBe('+14155552671')
    }
  })

  it('accepts a valid international number and returns E.164', () => {
    const result = validateAndNormalizePhone('+14155552671', 'UG')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.e164).toBe('+14155552671')
    }
  })

  it('rejects invalid numbers', () => {
    const result = validateAndNormalizePhone('invalid', 'UG')

    expect(result).toEqual({
      ok: false,
      error: INVALID_PHONE_ERROR,
    })
  })

  it('treats empty input as valid for optional phone fields', () => {
    const result = validateAndNormalizePhone('   ', 'UG')

    expect(result).toEqual({ ok: true })
  })
})
