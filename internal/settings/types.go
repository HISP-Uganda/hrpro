package settings

import (
	"encoding/json"
	"time"
)

const (
	KeyCompanyProfile = "company_profile"
	KeyCurrency       = "currency"
	KeyLunchDefaults  = "lunch_defaults"
	KeyPayrollDisplay = "payroll_display"
)

const (
	DefaultCompanyName            = "HISP HR System"
	DefaultCurrencyCode           = "TZS"
	DefaultCurrencySymbol         = "TZS"
	DefaultCurrencyDecimals       = 0
	DefaultLunchPlateCostAmount   = 12000
	DefaultLunchContributionValue = 4000
	DefaultPayrollDecimals        = 2
)

type StoredSetting struct {
	Key             string          `db:"key"`
	ValueJSON       json.RawMessage `db:"value_json"`
	UpdatedByUserID *int64          `db:"updated_by_user_id"`
	UpdatedAt       time.Time       `db:"updated_at"`
}

type CompanyProfileSettings struct {
	Name            string     `json:"name"`
	LogoPath        string     `json:"logoPath,omitempty"`
	LogoUpdatedAt   *time.Time `json:"logoUpdatedAt,omitempty"`
	SupportEmail    string     `json:"supportEmail,omitempty"`
	SupportPhone    string     `json:"supportPhone,omitempty"`
	SupportWebsite  string     `json:"supportWebsite,omitempty"`
	CopyrightHolder string     `json:"copyrightHolder,omitempty"`
}

type CurrencySettings struct {
	Code     string `json:"code"`
	Symbol   string `json:"symbol"`
	Decimals int    `json:"decimals"`
}

type LunchDefaultsSettings struct {
	PlateCostAmount         int `json:"plateCostAmount"`
	StaffContributionAmount int `json:"staffContributionAmount"`
}

type PayrollDisplaySettings struct {
	Decimals        int  `json:"decimals"`
	RoundingEnabled bool `json:"roundingEnabled"`
}

type SettingsDTO struct {
	Company        CompanyProfileSettings `json:"company"`
	Currency       CurrencySettings       `json:"currency"`
	LunchDefaults  LunchDefaultsSettings  `json:"lunchDefaults"`
	PayrollDisplay PayrollDisplaySettings `json:"payrollDisplay"`
}

type CompanyProfileSettingsInput struct {
	Name            string  `json:"name"`
	LogoPath        *string `json:"logoPath,omitempty"`
	SupportEmail    string  `json:"supportEmail,omitempty"`
	SupportPhone    string  `json:"supportPhone,omitempty"`
	SupportWebsite  string  `json:"supportWebsite,omitempty"`
	CopyrightHolder string  `json:"copyrightHolder,omitempty"`
}

type UpdateSettingsInput struct {
	Company        CompanyProfileSettingsInput `json:"company"`
	Currency       CurrencySettings            `json:"currency"`
	LunchDefaults  LunchDefaultsSettings       `json:"lunchDefaults"`
	PayrollDisplay PayrollDisplaySettings      `json:"payrollDisplay"`
}

type CompanyLogo struct {
	Filename string `json:"filename"`
	MimeType string `json:"mimeType"`
	Data     []byte `json:"data"`
}

type CompanyProfileDTO struct {
	Name            string `json:"name"`
	LogoPath        string `json:"logoPath,omitempty"`
	LogoDataURL     string `json:"logoDataUrl,omitempty"`
	SupportEmail    string `json:"supportEmail,omitempty"`
	SupportPhone    string `json:"supportPhone,omitempty"`
	SupportWebsite  string `json:"supportWebsite,omitempty"`
	CopyrightHolder string `json:"copyrightHolder,omitempty"`
}

type SaveCompanyProfileInput struct {
	Name            string `json:"name"`
	SupportEmail    string `json:"supportEmail,omitempty"`
	SupportPhone    string `json:"supportPhone,omitempty"`
	SupportWebsite  string `json:"supportWebsite,omitempty"`
	CopyrightHolder string `json:"copyrightHolder,omitempty"`
}
