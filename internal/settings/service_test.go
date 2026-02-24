package settings

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"hrpro/internal/models"
)

type fakeRepository struct {
	store map[string][]byte
}

func newFakeRepository() *fakeRepository {
	return &fakeRepository{store: map[string][]byte{}}
}

func (f *fakeRepository) GetByKey(_ context.Context, key string) (*StoredSetting, error) {
	payload, ok := f.store[key]
	if !ok {
		return nil, nil
	}
	return &StoredSetting{Key: key, ValueJSON: payload}, nil
}

func (f *fakeRepository) Upsert(_ context.Context, key string, valueJSON []byte, _ int64) (*StoredSetting, error) {
	f.store[key] = valueJSON
	return &StoredSetting{Key: key, ValueJSON: valueJSON}, nil
}

type fakeLogoStore struct {
	readData  *CompanyLogo
	savedPath string
}

func (f *fakeLogoStore) SaveLogo(_ context.Context, _ string, _ []byte) (string, error) {
	if f.savedPath == "" {
		f.savedPath = "stored-logo.png"
	}
	return f.savedPath, nil
}

func (f *fakeLogoStore) ReadLogo(_ context.Context, _ string) (*CompanyLogo, error) {
	if f.readData == nil {
		return nil, ErrNotFound
	}
	return f.readData, nil
}

func TestUpdateSettingsRejectsInvalidCurrencyCode(t *testing.T) {
	svc := NewService(newFakeRepository(), &fakeLogoStore{})

	_, err := svc.UpdateSettings(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, UpdateSettingsInput{
		Company:        CompanyProfileSettingsInput{Name: "HISP"},
		Currency:       CurrencySettings{Code: "", Symbol: "$", Decimals: 2},
		LunchDefaults:  LunchDefaultsSettings{PlateCostAmount: 12000, StaffContributionAmount: 4000},
		PayrollDisplay: PayrollDisplaySettings{Decimals: 2},
	})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestUpdateSettingsRequiresAdmin(t *testing.T) {
	svc := NewService(newFakeRepository(), &fakeLogoStore{})

	_, err := svc.UpdateSettings(context.Background(), &models.Claims{UserID: 1, Role: "viewer"}, UpdateSettingsInput{
		Company:        CompanyProfileSettingsInput{Name: "HISP"},
		Currency:       CurrencySettings{Code: "TZS", Symbol: "TZS", Decimals: 0},
		LunchDefaults:  LunchDefaultsSettings{PlateCostAmount: 12000, StaffContributionAmount: 4000},
		PayrollDisplay: PayrollDisplaySettings{Decimals: 2},
	})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
}

func TestGetSettingsReturnsDefaultsWhenStoreEmpty(t *testing.T) {
	svc := NewService(newFakeRepository(), &fakeLogoStore{})

	result, err := svc.GetSettings(context.Background(), &models.Claims{UserID: 1, Role: "admin"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result.Company.Name != DefaultCompanyName {
		t.Fatalf("expected default company name %q, got %q", DefaultCompanyName, result.Company.Name)
	}
	if result.LunchDefaults.PlateCostAmount != DefaultLunchPlateCostAmount {
		t.Fatalf("expected default lunch plate cost %d, got %d", DefaultLunchPlateCostAmount, result.LunchDefaults.PlateCostAmount)
	}
}

func TestUploadCompanyLogoPersistsCompanyLogoPath(t *testing.T) {
	repo := newFakeRepository()
	logoStore := &fakeLogoStore{}
	svc := NewService(repo, logoStore)

	logoPath, err := svc.UploadCompanyLogo(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "logo.png", []byte{1, 2, 3})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if logoPath == "" {
		t.Fatalf("expected logo path")
	}

	item, ok := repo.store[KeyCompanyProfile]
	if !ok {
		t.Fatalf("expected company profile setting to be stored")
	}
	var company CompanyProfileSettings
	if err := json.Unmarshal(item, &company); err != nil {
		t.Fatalf("unmarshal company profile: %v", err)
	}
	if company.LogoPath == "" {
		t.Fatalf("expected stored logo path")
	}
}
