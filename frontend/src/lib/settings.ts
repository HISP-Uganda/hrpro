import type { AppSettings } from '../types/settings'

export const defaultAppSettings: AppSettings = {
  company: {
    name: 'HISP HR System',
    supportEmail: '',
    supportPhone: '',
    supportWebsite: '',
    copyrightHolder: '',
  },
  currency: {
    code: 'TZS',
    symbol: 'TZS',
    decimals: 0,
  },
  lunchDefaults: {
    plateCostAmount: 12000,
    staffContributionAmount: 4000,
  },
  payrollDisplay: {
    decimals: 2,
    roundingEnabled: false,
  },
  phoneDefaults: {
    defaultCountryName: 'Uganda',
    defaultCountryISO2: 'UG',
    defaultCountryCallingCode: '+256',
  },
}

export function formatCurrencyAmount(value: number, settings: AppSettings): string {
  const decimals = clampDecimals(settings.currency.decimals)
  const amount = applyRounding(value, decimals, false)
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const symbol = settings.currency.symbol?.trim() || settings.currency.code
  return `${symbol} ${formatted}`
}

export function formatPayrollAmount(value: number, settings: AppSettings): string {
  const decimals = clampDecimals(settings.payrollDisplay.decimals)
  const amount = applyRounding(value, decimals, settings.payrollDisplay.roundingEnabled)
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const symbol = settings.currency.symbol?.trim() || settings.currency.code
  return `${symbol} ${formatted}`
}

function clampDecimals(decimals: number): number {
  if (!Number.isFinite(decimals)) {
    return 2
  }
  const rounded = Math.trunc(decimals)
  if (rounded < 0) {
    return 0
  }
  if (rounded > 6) {
    return 6
  }
  return rounded
}

function applyRounding(value: number, decimals: number, round: boolean): number {
  if (!round) {
    return value
  }
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
