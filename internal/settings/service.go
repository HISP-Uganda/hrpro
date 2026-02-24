package settings

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

const maxLogoSizeBytes = 5 * 1024 * 1024

var currencyCodePattern = regexp.MustCompile(`^[A-Z0-9]{2,8}$`)

type Service struct {
	repository Repository
	logoStore  LogoStore
}

func NewService(repository Repository, logoStore LogoStore) *Service {
	return &Service{repository: repository, logoStore: logoStore}
}

func (s *Service) GetSettings(ctx context.Context, claims *models.Claims) (*SettingsDTO, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	return s.loadSettings(ctx)
}

func (s *Service) UpdateSettings(ctx context.Context, claims *models.Claims, input UpdateSettingsInput) (*SettingsDTO, error) {
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, ErrForbidden
	}
	if err := validateUpdateInput(input); err != nil {
		return nil, err
	}

	current, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	company := CompanyProfileSettings{
		Name: strings.TrimSpace(input.Company.Name),
	}
	if input.Company.LogoPath != nil {
		company.LogoPath = strings.TrimSpace(*input.Company.LogoPath)
	} else {
		company.LogoPath = current.Company.LogoPath
	}

	if err := s.upsertValue(ctx, KeyCompanyProfile, company, claims.UserID); err != nil {
		return nil, err
	}
	if err := s.upsertValue(ctx, KeyCurrency, normalizeCurrencySettings(input.Currency), claims.UserID); err != nil {
		return nil, err
	}
	if err := s.upsertValue(ctx, KeyLunchDefaults, input.LunchDefaults, claims.UserID); err != nil {
		return nil, err
	}
	if err := s.upsertValue(ctx, KeyPayrollDisplay, input.PayrollDisplay, claims.UserID); err != nil {
		return nil, err
	}

	return s.loadSettings(ctx)
}

func (s *Service) UploadCompanyLogo(ctx context.Context, claims *models.Claims, filename string, data []byte) (string, error) {
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return "", ErrForbidden
	}
	if s.logoStore == nil {
		return "", fmt.Errorf("logo store is not configured")
	}
	if len(data) == 0 {
		return "", fmt.Errorf("%w: logo file is required", ErrValidation)
	}
	if len(data) > maxLogoSizeBytes {
		return "", fmt.Errorf("%w: logo file exceeds %d bytes", ErrValidation, maxLogoSizeBytes)
	}

	logoPath, err := s.logoStore.SaveLogo(ctx, filename, data)
	if err != nil {
		return "", err
	}

	current, err := s.loadSettings(ctx)
	if err != nil {
		return "", err
	}
	company := current.Company
	company.LogoPath = logoPath
	if company.Name == "" {
		company.Name = DefaultCompanyName
	}

	if err := s.upsertValue(ctx, KeyCompanyProfile, company, claims.UserID); err != nil {
		return "", err
	}
	return logoPath, nil
}

func (s *Service) GetCompanyLogo(ctx context.Context, claims *models.Claims) (*CompanyLogo, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	if s.logoStore == nil {
		return nil, ErrNotFound
	}

	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}
	logoPath := strings.TrimSpace(settingsValue.Company.LogoPath)
	if logoPath == "" {
		return nil, ErrNotFound
	}
	return s.logoStore.ReadLogo(ctx, logoPath)
}

func (s *Service) GetLunchDefaults(ctx context.Context) (plateCostAmount int, staffContributionAmount int, err error) {
	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return 0, 0, err
	}
	return settingsValue.LunchDefaults.PlateCostAmount, settingsValue.LunchDefaults.StaffContributionAmount, nil
}

func (s *Service) GetCurrencySettings(ctx context.Context) (CurrencySettings, error) {
	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return CurrencySettings{}, err
	}
	return settingsValue.Currency, nil
}

func (s *Service) GetPayrollFormatting(ctx context.Context) (symbol string, decimals int, rounding bool, err error) {
	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return "", 0, false, err
	}
	return settingsValue.Currency.Symbol, settingsValue.PayrollDisplay.Decimals, settingsValue.PayrollDisplay.RoundingEnabled, nil
}

func (s *Service) loadSettings(ctx context.Context) (*SettingsDTO, error) {
	result := defaultSettings()

	if err := s.readValue(ctx, KeyCompanyProfile, &result.Company); err != nil {
		return nil, err
	}
	if err := s.readValue(ctx, KeyCurrency, &result.Currency); err != nil {
		return nil, err
	}
	if err := s.readValue(ctx, KeyLunchDefaults, &result.LunchDefaults); err != nil {
		return nil, err
	}
	if err := s.readValue(ctx, KeyPayrollDisplay, &result.PayrollDisplay); err != nil {
		return nil, err
	}

	result.Company.Name = strings.TrimSpace(result.Company.Name)
	if result.Company.Name == "" {
		result.Company.Name = DefaultCompanyName
	}
	result.Currency = normalizeCurrencySettings(result.Currency)
	if result.LunchDefaults.PlateCostAmount <= 0 {
		result.LunchDefaults.PlateCostAmount = DefaultLunchPlateCostAmount
	}
	if result.LunchDefaults.StaffContributionAmount < 0 {
		result.LunchDefaults.StaffContributionAmount = DefaultLunchContributionValue
	}
	if result.PayrollDisplay.Decimals < 0 || result.PayrollDisplay.Decimals > 6 {
		result.PayrollDisplay.Decimals = DefaultPayrollDecimals
	}

	return &result, nil
}

func (s *Service) readValue(ctx context.Context, key string, out any) error {
	item, err := s.repository.GetByKey(ctx, key)
	if err != nil {
		return err
	}
	if item == nil || len(item.ValueJSON) == 0 {
		return nil
	}
	if err := json.Unmarshal(item.ValueJSON, out); err != nil {
		return fmt.Errorf("%w: invalid %s setting payload", ErrValidation, key)
	}
	return nil
}

func (s *Service) upsertValue(ctx context.Context, key string, value any, updatedByUserID int64) error {
	payload, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal %s setting: %w", key, err)
	}
	if _, err := s.repository.Upsert(ctx, key, payload, updatedByUserID); err != nil {
		return err
	}
	return nil
}

func defaultSettings() SettingsDTO {
	return SettingsDTO{
		Company: CompanyProfileSettings{Name: DefaultCompanyName},
		Currency: CurrencySettings{
			Code:     DefaultCurrencyCode,
			Symbol:   DefaultCurrencySymbol,
			Decimals: DefaultCurrencyDecimals,
		},
		LunchDefaults: LunchDefaultsSettings{
			PlateCostAmount:         DefaultLunchPlateCostAmount,
			StaffContributionAmount: DefaultLunchContributionValue,
		},
		PayrollDisplay: PayrollDisplaySettings{
			Decimals:        DefaultPayrollDecimals,
			RoundingEnabled: false,
		},
	}
}

func validateUpdateInput(input UpdateSettingsInput) error {
	if strings.TrimSpace(input.Company.Name) == "" {
		return fmt.Errorf("%w: company name is required", ErrValidation)
	}
	if len(strings.TrimSpace(input.Company.Name)) > 120 {
		return fmt.Errorf("%w: company name is too long", ErrValidation)
	}
	if !currencyCodePattern.MatchString(strings.ToUpper(strings.TrimSpace(input.Currency.Code))) {
		return fmt.Errorf("%w: currency code must be 2-8 uppercase letters/numbers", ErrValidation)
	}
	if strings.TrimSpace(input.Currency.Symbol) == "" {
		return fmt.Errorf("%w: currency symbol is required", ErrValidation)
	}
	if input.Currency.Decimals < 0 || input.Currency.Decimals > 6 {
		return fmt.Errorf("%w: currency decimals must be between 0 and 6", ErrValidation)
	}
	if input.LunchDefaults.PlateCostAmount <= 0 {
		return fmt.Errorf("%w: lunch plate cost must be positive", ErrValidation)
	}
	if input.LunchDefaults.StaffContributionAmount < 0 {
		return fmt.Errorf("%w: lunch staff contribution must be >= 0", ErrValidation)
	}
	if input.PayrollDisplay.Decimals < 0 || input.PayrollDisplay.Decimals > 6 {
		return fmt.Errorf("%w: payroll decimals must be between 0 and 6", ErrValidation)
	}
	return nil
}

func normalizeCurrencySettings(in CurrencySettings) CurrencySettings {
	value := in
	value.Code = strings.ToUpper(strings.TrimSpace(value.Code))
	value.Symbol = strings.TrimSpace(value.Symbol)
	if value.Code == "" {
		value.Code = DefaultCurrencyCode
	}
	if value.Symbol == "" {
		value.Symbol = DefaultCurrencySymbol
	}
	if value.Decimals < 0 || value.Decimals > 6 {
		value.Decimals = DefaultCurrencyDecimals
	}
	return value
}
