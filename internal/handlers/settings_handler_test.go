package handlers

import (
	"context"
	"errors"
	"testing"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/settings"
)

type fakeSettingsAuthService struct {
	claims *models.Claims
}

func (f *fakeSettingsAuthService) ValidateAccessToken(_ string) (*models.Claims, error) {
	return f.claims, nil
}

type fakeSettingsRepository struct {
	store map[string][]byte
}

func newFakeSettingsRepository() *fakeSettingsRepository {
	return &fakeSettingsRepository{store: map[string][]byte{}}
}

func (f *fakeSettingsRepository) GetByKey(_ context.Context, key string) (*settings.StoredSetting, error) {
	payload, ok := f.store[key]
	if !ok {
		return nil, nil
	}
	return &settings.StoredSetting{Key: key, ValueJSON: payload}, nil
}

func (f *fakeSettingsRepository) Upsert(_ context.Context, key string, valueJSON []byte, _ int64) (*settings.StoredSetting, error) {
	f.store[key] = valueJSON
	return &settings.StoredSetting{Key: key, ValueJSON: valueJSON}, nil
}

type fakeLogoStore struct{}

func (f *fakeLogoStore) SaveLogo(_ context.Context, _ string, _ []byte) (string, error) {
	return "branding/logo.png", nil
}

func (f *fakeLogoStore) ReadLogo(_ context.Context, _ string) (*settings.CompanyLogo, error) {
	return &settings.CompanyLogo{Filename: "logo.png", MimeType: "image/png", Data: []byte{1, 2, 3}}, nil
}

func (f *fakeLogoStore) DeleteLogo(_ context.Context, _ string) error {
	return nil
}

func TestSettingsHandlerUpdateSettingsRequiresAdmin(t *testing.T) {
	handler := NewSettingsHandler(
		&fakeSettingsAuthService{claims: &models.Claims{UserID: 10, Role: "viewer"}},
		settings.NewService(newFakeSettingsRepository(), &fakeLogoStore{}),
	)

	_, err := handler.UpdateSettings(context.Background(), UpdateSettingsRequest{
		AccessToken: "token",
		Payload: settings.UpdateSettingsInput{
			Company:        settings.CompanyProfileSettingsInput{Name: "HISP"},
			Currency:       settings.CurrencySettings{Code: "TZS", Symbol: "TZS", Decimals: 0},
			LunchDefaults:  settings.LunchDefaultsSettings{PlateCostAmount: 12000, StaffContributionAmount: 4000},
			PayrollDisplay: settings.PayrollDisplaySettings{Decimals: 2},
		},
	})
	if !errors.Is(err, middleware.ErrForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
}

func TestSettingsHandlerUploadCompanyLogoRequiresAdmin(t *testing.T) {
	handler := NewSettingsHandler(
		&fakeSettingsAuthService{claims: &models.Claims{UserID: 10, Role: "viewer"}},
		settings.NewService(newFakeSettingsRepository(), &fakeLogoStore{}),
	)

	_, err := handler.UploadCompanyLogo(context.Background(), UploadCompanyLogoRequest{
		AccessToken: "token",
		Filename:    "logo.png",
		Data:        []byte{1, 2, 3},
	})
	if !errors.Is(err, middleware.ErrForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
}
