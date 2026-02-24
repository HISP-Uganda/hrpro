export type CompanyProfileSettings = {
  name: string
  logoPath?: string
}

export type CurrencySettings = {
  code: string
  symbol: string
  decimals: number
}

export type LunchDefaultsSettings = {
  plateCostAmount: number
  staffContributionAmount: number
}

export type PayrollDisplaySettings = {
  decimals: number
  roundingEnabled: boolean
}

export type AppSettings = {
  company: CompanyProfileSettings
  currency: CurrencySettings
  lunchDefaults: LunchDefaultsSettings
  payrollDisplay: PayrollDisplaySettings
}

export type CompanyProfileSettingsInput = {
  name: string
  logoPath?: string
}

export type UpdateSettingsInput = {
  company: CompanyProfileSettingsInput
  currency: CurrencySettings
  lunchDefaults: LunchDefaultsSettings
  payrollDisplay: PayrollDisplaySettings
}

export type CompanyLogo = {
  filename: string
  mimeType: string
  data: number[]
}
