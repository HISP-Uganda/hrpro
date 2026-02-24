export type CompanyProfileSettings = {
  name: string
  logoPath?: string
  logoUpdatedAt?: string
  supportEmail?: string
  supportPhone?: string
  supportWebsite?: string
  copyrightHolder?: string
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

export type PhoneDefaultsSettings = {
  defaultCountryName: string
  defaultCountryISO2: string
  defaultCountryCallingCode: string
}

export type AppSettings = {
  company: CompanyProfileSettings
  currency: CurrencySettings
  lunchDefaults: LunchDefaultsSettings
  payrollDisplay: PayrollDisplaySettings
  phoneDefaults: PhoneDefaultsSettings
}

export type CompanyProfileSettingsInput = {
  name: string
  logoPath?: string
  supportEmail?: string
  supportPhone?: string
  supportWebsite?: string
  copyrightHolder?: string
}

export type UpdateSettingsInput = {
  company: CompanyProfileSettingsInput
  currency: CurrencySettings
  lunchDefaults: LunchDefaultsSettings
  payrollDisplay: PayrollDisplaySettings
  phoneDefaults: PhoneDefaultsSettings
}

export type CompanyLogo = {
  filename: string
  mimeType: string
  data: number[]
}

export type CompanyProfile = {
  name: string
  logoPath?: string
  logoDataUrl?: string
  supportEmail?: string
  supportPhone?: string
  supportWebsite?: string
  copyrightHolder?: string
}

export type SaveCompanyProfileInput = {
  name: string
  supportEmail?: string
  supportPhone?: string
  supportWebsite?: string
  copyrightHolder?: string
}
