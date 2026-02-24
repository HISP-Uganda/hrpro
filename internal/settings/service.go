package settings

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

const (
	maxLogoSizeBytes        = 2 * 1024 * 1024
	logoImportTimeout       = 10 * time.Second
	maxLogoImportRedirects  = 5
	defaultLogoImportScheme = "https"
)

var (
	currencyCodePattern = regexp.MustCompile(`^[A-Z0-9]{2,8}$`)
	phonePattern        = regexp.MustCompile(`^[0-9+()\-\s]{5,32}$`)
	allowedImageMIMEs   = map[string]string{
		"image/png":  ".png",
		"image/jpeg": ".jpg",
		"image/webp": ".webp",
	}
	callingCodePattern = regexp.MustCompile(`^\+[1-9][0-9]{0,3}$`)
)

type Service struct {
	repository Repository
	logoStore  LogoStore
	httpClient *http.Client
}

func NewService(repository Repository, logoStore LogoStore) *Service {
	return &Service{
		repository: repository,
		logoStore:  logoStore,
		httpClient: &http.Client{
			Timeout: logoImportTimeout,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) > maxLogoImportRedirects {
					return fmt.Errorf("%w: too many redirects", ErrValidation)
				}
				if !isHTTPURL(req.URL) {
					return fmt.Errorf("%w: redirect target must be http or https", ErrValidation)
				}
				return nil
			},
		},
	}
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
		Name:            strings.TrimSpace(input.Company.Name),
		LogoUpdatedAt:   current.Company.LogoUpdatedAt,
		SupportEmail:    strings.TrimSpace(input.Company.SupportEmail),
		SupportPhone:    strings.TrimSpace(input.Company.SupportPhone),
		SupportWebsite:  normalizeOptionalURL(input.Company.SupportWebsite),
		CopyrightHolder: strings.TrimSpace(input.Company.CopyrightHolder),
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
	if err := s.upsertValue(ctx, KeyPhoneDefaults, normalizePhoneDefaults(input.PhoneDefaults), claims.UserID); err != nil {
		return nil, err
	}

	return s.loadSettings(ctx)
}

func (s *Service) GetCompanyProfile(ctx context.Context, claims *models.Claims) (*CompanyProfileDTO, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}
	return s.buildCompanyProfileDTO(ctx, settingsValue.Company), nil
}

func (s *Service) SaveCompanyProfile(ctx context.Context, claims *models.Claims, input SaveCompanyProfileInput) (*CompanyProfileDTO, error) {
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, ErrForbidden
	}
	if err := validateCompanyProfileInput(input); err != nil {
		return nil, err
	}

	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	company := settingsValue.Company
	company.Name = strings.TrimSpace(input.Name)
	company.SupportEmail = strings.TrimSpace(input.SupportEmail)
	company.SupportPhone = strings.TrimSpace(input.SupportPhone)
	company.SupportWebsite = normalizeOptionalURL(input.SupportWebsite)
	company.CopyrightHolder = strings.TrimSpace(input.CopyrightHolder)

	if err := s.upsertValue(ctx, KeyCompanyProfile, company, claims.UserID); err != nil {
		return nil, err
	}
	return s.buildCompanyProfileDTO(ctx, company), nil
}

func (s *Service) UploadCompanyLogo(ctx context.Context, claims *models.Claims, filename string, mimeType string, data []byte) (*CompanyProfileDTO, error) {
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, ErrForbidden
	}
	_ = filename
	resolvedMIME, extension, err := validateLogoData(mimeType, data)
	if err != nil {
		return nil, err
	}
	_ = resolvedMIME
	return s.persistCompanyLogo(ctx, claims.UserID, extension, data)
}

func (s *Service) ImportCompanyLogoFromURL(ctx context.Context, claims *models.Claims, rawURL string) (*CompanyProfileDTO, error) {
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, ErrForbidden
	}
	parsedURL, err := normalizeLogoURL(rawURL)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, parsedURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("build logo request: %w", err)
	}
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download logo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: logo URL returned status %d", ErrValidation, resp.StatusCode)
	}

	limited := io.LimitReader(resp.Body, maxLogoSizeBytes+1)
	data, err := io.ReadAll(limited)
	if err != nil {
		return nil, fmt.Errorf("read logo response: %w", err)
	}

	contentType := strings.TrimSpace(resp.Header.Get("Content-Type"))
	_, extension, err := validateLogoData(contentType, data)
	if err != nil {
		return nil, err
	}

	return s.persistCompanyLogo(ctx, claims.UserID, extension, data)
}

func (s *Service) RemoveCompanyLogo(ctx context.Context, claims *models.Claims) (*CompanyProfileDTO, error) {
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, ErrForbidden
	}

	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	company := settingsValue.Company
	previousPath := strings.TrimSpace(company.LogoPath)
	company.LogoPath = ""
	company.LogoUpdatedAt = nil

	if err := s.upsertValue(ctx, KeyCompanyProfile, company, claims.UserID); err != nil {
		return nil, err
	}
	if previousPath != "" && s.logoStore != nil {
		_ = s.logoStore.DeleteLogo(ctx, previousPath)
	}

	return s.buildCompanyProfileDTO(ctx, company), nil
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

func (s *Service) GetPhoneDefaults(ctx context.Context) (defaultCountryISO2 string, defaultCountryCallingCode string, err error) {
	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return "", "", err
	}
	defaults := settingsValue.PhoneDefaults

	envISO2 := strings.TrimSpace(os.Getenv(EnvDefaultCountryISO2))
	envCallingCode := strings.TrimSpace(os.Getenv(EnvDefaultCountryCallingCode))
	if envISO2 != "" {
		defaults.DefaultCountryISO2 = envISO2
	}
	if envCallingCode != "" {
		defaults.DefaultCountryCallingCode = envCallingCode
	}
	defaults = normalizePhoneDefaults(defaults)
	return defaults.DefaultCountryISO2, defaults.DefaultCountryCallingCode, nil
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
	if err := s.readValue(ctx, KeyPhoneDefaults, &result.PhoneDefaults); err != nil {
		return nil, err
	}

	result.Company.Name = strings.TrimSpace(result.Company.Name)
	if result.Company.Name == "" {
		result.Company.Name = DefaultCompanyName
	}
	result.Company.LogoPath = strings.TrimSpace(result.Company.LogoPath)
	result.Company.SupportEmail = strings.TrimSpace(result.Company.SupportEmail)
	result.Company.SupportPhone = strings.TrimSpace(result.Company.SupportPhone)
	result.Company.SupportWebsite = normalizeOptionalURL(result.Company.SupportWebsite)
	result.Company.CopyrightHolder = strings.TrimSpace(result.Company.CopyrightHolder)

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
	result.PhoneDefaults = normalizePhoneDefaults(result.PhoneDefaults)
	if envCountryName := strings.TrimSpace(os.Getenv(EnvDefaultCountryName)); envCountryName != "" {
		result.PhoneDefaults.DefaultCountryName = envCountryName
	}
	if envCountryISO2 := strings.TrimSpace(os.Getenv(EnvDefaultCountryISO2)); envCountryISO2 != "" {
		result.PhoneDefaults.DefaultCountryISO2 = strings.ToUpper(envCountryISO2)
	}
	if envCountryCallingCode := strings.TrimSpace(os.Getenv(EnvDefaultCountryCallingCode)); envCountryCallingCode != "" {
		result.PhoneDefaults.DefaultCountryCallingCode = envCountryCallingCode
	}
	result.PhoneDefaults = normalizePhoneDefaults(result.PhoneDefaults)

	return &result, nil
}

func (s *Service) persistCompanyLogo(ctx context.Context, actorUserID int64, extension string, data []byte) (*CompanyProfileDTO, error) {
	if s.logoStore == nil {
		return nil, fmt.Errorf("logo store is not configured")
	}

	settingsValue, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}
	previousPath := strings.TrimSpace(settingsValue.Company.LogoPath)

	logoPath, err := s.logoStore.SaveLogo(ctx, extension, data)
	if err != nil {
		return nil, err
	}

	company := settingsValue.Company
	company.LogoPath = logoPath
	now := time.Now().UTC()
	company.LogoUpdatedAt = &now
	if company.Name == "" {
		company.Name = DefaultCompanyName
	}

	if err := s.upsertValue(ctx, KeyCompanyProfile, company, actorUserID); err != nil {
		return nil, err
	}
	if previousPath != "" && previousPath != logoPath {
		_ = s.logoStore.DeleteLogo(ctx, previousPath)
	}

	return s.buildCompanyProfileDTO(ctx, company), nil
}

func (s *Service) buildCompanyProfileDTO(ctx context.Context, company CompanyProfileSettings) *CompanyProfileDTO {
	result := &CompanyProfileDTO{
		Name:            company.Name,
		LogoPath:        company.LogoPath,
		SupportEmail:    company.SupportEmail,
		SupportPhone:    company.SupportPhone,
		SupportWebsite:  company.SupportWebsite,
		CopyrightHolder: company.CopyrightHolder,
	}
	if strings.TrimSpace(company.LogoPath) == "" || s.logoStore == nil {
		return result
	}

	logo, err := s.logoStore.ReadLogo(ctx, company.LogoPath)
	if err != nil {
		return result
	}
	if len(logo.Data) == 0 {
		return result
	}

	mimeType := strings.TrimSpace(logo.MimeType)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	result.LogoDataURL = fmt.Sprintf("data:%s;base64,%s", mimeType, base64.StdEncoding.EncodeToString(logo.Data))
	return result
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
		PhoneDefaults: PhoneDefaultsSettings{
			DefaultCountryName:        DefaultCountryName,
			DefaultCountryISO2:        DefaultCountryISO2,
			DefaultCountryCallingCode: DefaultCountryCallingCode,
		},
	}
}

func validateUpdateInput(input UpdateSettingsInput) error {
	if err := validateCompanyProfileInput(SaveCompanyProfileInput{
		Name:            input.Company.Name,
		SupportEmail:    input.Company.SupportEmail,
		SupportPhone:    input.Company.SupportPhone,
		SupportWebsite:  input.Company.SupportWebsite,
		CopyrightHolder: input.Company.CopyrightHolder,
	}); err != nil {
		return err
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
	if _, err := validatePhoneDefaults(input.PhoneDefaults); err != nil {
		return err
	}
	return nil
}

func validateCompanyProfileInput(input SaveCompanyProfileInput) error {
	if strings.TrimSpace(input.Name) == "" {
		return fmt.Errorf("%w: company name is required", ErrValidation)
	}
	if len(strings.TrimSpace(input.Name)) > 120 {
		return fmt.Errorf("%w: company name is too long", ErrValidation)
	}
	if input.SupportEmail != "" {
		if _, err := mail.ParseAddress(strings.TrimSpace(input.SupportEmail)); err != nil {
			return fmt.Errorf("%w: support email is invalid", ErrValidation)
		}
	}
	if input.SupportPhone != "" && !phonePattern.MatchString(strings.TrimSpace(input.SupportPhone)) {
		return fmt.Errorf("%w: support phone is invalid", ErrValidation)
	}
	if input.SupportWebsite != "" {
		if _, err := normalizeLogoURL(input.SupportWebsite); err != nil {
			return fmt.Errorf("%w: support website must be a valid http(s) URL", ErrValidation)
		}
	}
	if len(strings.TrimSpace(input.CopyrightHolder)) > 120 {
		return fmt.Errorf("%w: copyright holder is too long", ErrValidation)
	}
	return nil
}

func validateLogoData(providedMIMEType string, data []byte) (string, string, error) {
	if len(data) == 0 {
		return "", "", fmt.Errorf("%w: logo file is required", ErrValidation)
	}
	if len(data) > maxLogoSizeBytes {
		return "", "", fmt.Errorf("%w: logo file exceeds %d bytes", ErrValidation, maxLogoSizeBytes)
	}

	detectedMIME := strings.ToLower(strings.TrimSpace(http.DetectContentType(data)))
	if separator := strings.Index(detectedMIME, ";"); separator >= 0 {
		detectedMIME = strings.TrimSpace(detectedMIME[:separator])
	}
	providedMIME := strings.ToLower(strings.TrimSpace(providedMIMEType))
	if separator := strings.Index(providedMIME, ";"); separator >= 0 {
		providedMIME = strings.TrimSpace(providedMIME[:separator])
	}

	if providedMIME != "" {
		if _, ok := allowedImageMIMEs[providedMIME]; !ok {
			return "", "", fmt.Errorf("%w: unsupported image type", ErrValidation)
		}
	}

	if _, ok := allowedImageMIMEs[detectedMIME]; !ok {
		return "", "", fmt.Errorf("%w: unsupported image type", ErrValidation)
	}
	if providedMIME != "" && providedMIME != detectedMIME {
		return "", "", fmt.Errorf("%w: image content type mismatch", ErrValidation)
	}

	return detectedMIME, allowedImageMIMEs[detectedMIME], nil
}

func normalizeLogoURL(rawURL string) (*url.URL, error) {
	trimmed := strings.TrimSpace(rawURL)
	if trimmed == "" {
		return nil, fmt.Errorf("%w: logo URL is required", ErrValidation)
	}
	parsed, err := url.Parse(trimmed)
	if err != nil {
		return nil, fmt.Errorf("%w: logo URL is invalid", ErrValidation)
	}
	if parsed.Scheme == "" && parsed.Host == "" && strings.Contains(trimmed, ".") {
		parsed, err = url.Parse(defaultLogoImportScheme + "://" + trimmed)
		if err != nil {
			return nil, fmt.Errorf("%w: logo URL is invalid", ErrValidation)
		}
	}
	if !isHTTPURL(parsed) {
		return nil, fmt.Errorf("%w: logo URL must use http or https", ErrValidation)
	}
	if strings.TrimSpace(parsed.Host) == "" {
		return nil, fmt.Errorf("%w: logo URL host is required", ErrValidation)
	}
	return parsed, nil
}

func isHTTPURL(parsed *url.URL) bool {
	if parsed == nil {
		return false
	}
	scheme := strings.ToLower(strings.TrimSpace(parsed.Scheme))
	return scheme == "http" || scheme == "https"
}

func normalizeOptionalURL(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}
	parsed, err := normalizeLogoURL(trimmed)
	if err != nil {
		return ""
	}
	if parsed.Path == "" {
		parsed.Path = "/"
	}
	return parsed.String()
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

func normalizePhoneDefaults(in PhoneDefaultsSettings) PhoneDefaultsSettings {
	value := in
	value.DefaultCountryName = strings.TrimSpace(value.DefaultCountryName)
	value.DefaultCountryISO2 = strings.ToUpper(strings.TrimSpace(value.DefaultCountryISO2))
	value.DefaultCountryCallingCode = strings.TrimSpace(value.DefaultCountryCallingCode)

	if value.DefaultCountryName == "" {
		value.DefaultCountryName = DefaultCountryName
	}
	if value.DefaultCountryISO2 == "" {
		value.DefaultCountryISO2 = DefaultCountryISO2
	}
	if value.DefaultCountryCallingCode == "" {
		value.DefaultCountryCallingCode = DefaultCountryCallingCode
	}
	if !strings.HasPrefix(value.DefaultCountryCallingCode, "+") {
		value.DefaultCountryCallingCode = "+" + value.DefaultCountryCallingCode
	}
	return value
}

func validatePhoneDefaults(in PhoneDefaultsSettings) (PhoneDefaultsSettings, error) {
	value := normalizePhoneDefaults(in)
	if len(value.DefaultCountryISO2) != 2 {
		return PhoneDefaultsSettings{}, fmt.Errorf("%w: default country ISO2 must be 2 letters", ErrValidation)
	}
	if len(value.DefaultCountryName) > 80 {
		return PhoneDefaultsSettings{}, fmt.Errorf("%w: default country name is too long", ErrValidation)
	}
	if !callingCodePattern.MatchString(value.DefaultCountryCallingCode) {
		return PhoneDefaultsSettings{}, fmt.Errorf("%w: default country calling code is invalid", ErrValidation)
	}
	return value, nil
}
