package settings

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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

func TestUpdateSettingsRejectsInvalidCurrencyCode(t *testing.T) {
	svc := NewService(newFakeRepository(), nil)

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
	svc := NewService(newFakeRepository(), nil)

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
	svc := NewService(newFakeRepository(), nil)

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
	if result.PhoneDefaults.DefaultCountryISO2 != DefaultCountryISO2 {
		t.Fatalf("expected default country iso2 %q, got %q", DefaultCountryISO2, result.PhoneDefaults.DefaultCountryISO2)
	}
}

func TestGetPhoneDefaultsPrefersEnvValues(t *testing.T) {
	t.Setenv(EnvDefaultCountryISO2, "US")
	t.Setenv(EnvDefaultCountryCallingCode, "+1")

	svc := NewService(newFakeRepository(), nil)
	iso2, calling, err := svc.GetPhoneDefaults(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if iso2 != "US" {
		t.Fatalf("expected US, got %s", iso2)
	}
	if calling != "+1" {
		t.Fatalf("expected +1, got %s", calling)
	}
}

func TestUploadCompanyLogoSavesFileAndUpdatesMetadata(t *testing.T) {
	repo := newFakeRepository()
	store := newTestLocalLogoStore(t)
	svc := NewService(repo, store)

	profile, err := svc.UploadCompanyLogo(
		context.Background(),
		&models.Claims{UserID: 1, Role: "admin"},
		"logo.png",
		"image/png",
		[]byte{137, 80, 78, 71, 13, 10, 26, 10, 0},
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if profile.LogoPath == "" {
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
	if company.LogoPath == "" || !strings.HasPrefix(company.LogoPath, "branding/") {
		t.Fatalf("expected branding-relative logo path, got %q", company.LogoPath)
	}
	if company.LogoUpdatedAt == nil {
		t.Fatalf("expected logo updated timestamp")
	}

	storedPath := filepath.Join(store.rootDir, filepath.FromSlash(company.LogoPath))
	if _, err := os.Stat(storedPath); err != nil {
		t.Fatalf("expected stored logo file, got %v", err)
	}
}

func TestImportCompanyLogoFromURLRejectsNonHTTPSchemes(t *testing.T) {
	svc := NewService(newFakeRepository(), newTestLocalLogoStore(t))
	_, err := svc.ImportCompanyLogoFromURL(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "file:///tmp/logo.png")
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestImportCompanyLogoFromURLRejectsNonImageContent(t *testing.T) {
	svc := NewService(newFakeRepository(), newTestLocalLogoStore(t))
	svc.httpClient = newTestHTTPClient(func(_ *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusOK, "text/plain", []byte("not-image")), nil
	})
	_, err := svc.ImportCompanyLogoFromURL(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "https://example.test/logo.txt")
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestImportCompanyLogoFromURLEnforcesSizeLimit(t *testing.T) {
	oversized := make([]byte, maxLogoSizeBytes+1)
	copy(oversized[:8], []byte{137, 80, 78, 71, 13, 10, 26, 10})

	svc := NewService(newFakeRepository(), newTestLocalLogoStore(t))
	svc.httpClient = newTestHTTPClient(func(_ *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusOK, "image/png", oversized), nil
	})
	_, err := svc.ImportCompanyLogoFromURL(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "https://example.test/logo.png")
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestImportCompanyLogoFromURLSavesFileAndUpdatesMetadata(t *testing.T) {
	repo := newFakeRepository()
	store := newTestLocalLogoStore(t)
	svc := NewService(repo, store)
	svc.httpClient = newTestHTTPClient(func(_ *http.Request) (*http.Response, error) {
		return newHTTPResponse(http.StatusOK, "image/png", []byte{137, 80, 78, 71, 13, 10, 26, 10, 0}), nil
	})

	profile, err := svc.ImportCompanyLogoFromURL(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "https://example.test/logo.png")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if profile.LogoPath == "" {
		t.Fatalf("expected logo path")
	}
	if !strings.HasPrefix(profile.LogoPath, "branding/") {
		t.Fatalf("expected branding-relative logo path, got %q", profile.LogoPath)
	}
}

func TestRemoveCompanyLogoClearsMetadataAndDeletesFileBestEffort(t *testing.T) {
	repo := newFakeRepository()
	store := newTestLocalLogoStore(t)
	svc := NewService(repo, store)

	profile, err := svc.UploadCompanyLogo(
		context.Background(),
		&models.Claims{UserID: 1, Role: "admin"},
		"logo.png",
		"image/png",
		[]byte{137, 80, 78, 71, 13, 10, 26, 10, 0},
	)
	if err != nil {
		t.Fatalf("upload logo failed: %v", err)
	}
	logoFile := filepath.Join(store.rootDir, filepath.FromSlash(profile.LogoPath))

	removed, err := svc.RemoveCompanyLogo(context.Background(), &models.Claims{UserID: 1, Role: "admin"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if removed.LogoPath != "" {
		t.Fatalf("expected logo path to be cleared")
	}

	item := repo.store[KeyCompanyProfile]
	var company CompanyProfileSettings
	if err := json.Unmarshal(item, &company); err != nil {
		t.Fatalf("unmarshal company profile: %v", err)
	}
	if company.LogoPath != "" {
		t.Fatalf("expected stored logo path to be cleared")
	}
	if company.LogoUpdatedAt != nil {
		t.Fatalf("expected logo updated timestamp to be cleared")
	}
	if _, err := os.Stat(logoFile); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected logo file deleted, stat err=%v", err)
	}
}

func TestGetCompanyProfileReturnsNullLogoDataURLWhenRemoved(t *testing.T) {
	repo := newFakeRepository()
	store := newTestLocalLogoStore(t)
	svc := NewService(repo, store)

	_, err := svc.UploadCompanyLogo(
		context.Background(),
		&models.Claims{UserID: 1, Role: "admin"},
		"logo.png",
		"image/png",
		[]byte{137, 80, 78, 71, 13, 10, 26, 10, 0},
	)
	if err != nil {
		t.Fatalf("upload logo failed: %v", err)
	}
	if _, err := svc.RemoveCompanyLogo(context.Background(), &models.Claims{UserID: 1, Role: "admin"}); err != nil {
		t.Fatalf("remove logo failed: %v", err)
	}

	profile, err := svc.GetCompanyProfile(context.Background(), &models.Claims{UserID: 1, Role: "admin"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if profile.LogoDataURL != "" {
		t.Fatalf("expected empty logo data URL after removal")
	}
}

func newTestLocalLogoStore(t *testing.T) *LocalLogoStore {
	t.Helper()
	tmpDir := t.TempDir()
	store, err := NewLocalLogoStore(tmpDir)
	if err != nil {
		t.Fatalf("create local logo store: %v", err)
	}
	return store
}

func TestSaveCompanyProfileValidatesWebsiteScheme(t *testing.T) {
	svc := NewService(newFakeRepository(), nil)
	_, err := svc.SaveCompanyProfile(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, SaveCompanyProfileInput{
		Name:           "Acme",
		SupportWebsite: "ftp://example.com",
	})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestImportCompanyLogoFromURLRejectsRedirectToNonHTTPURL(t *testing.T) {
	svc := NewService(newFakeRepository(), newTestLocalLogoStore(t))
	svc.httpClient = newTestHTTPClient(func(_ *http.Request) (*http.Response, error) {
		return nil, fmt.Errorf("%w: redirect target must be http or https", ErrValidation)
	})
	_, err := svc.ImportCompanyLogoFromURL(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "https://example.test/logo.png")
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestValidateLogoDataRejectsMIMETypeMismatch(t *testing.T) {
	_, _, err := validateLogoData("image/jpeg", []byte{137, 80, 78, 71, 13, 10, 26, 10, 0})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestNormalizeLogoURLAddsHTTPSForBareHost(t *testing.T) {
	parsed, err := normalizeLogoURL("example.com/logo.png")
	if err != nil {
		t.Fatalf("expected valid URL, got %v", err)
	}
	if parsed.Scheme != "https" {
		t.Fatalf("expected https scheme, got %s", parsed.Scheme)
	}
}

func TestLogoPathStoredAsRelativePath(t *testing.T) {
	repo := newFakeRepository()
	store := newTestLocalLogoStore(t)
	svc := NewService(repo, store)

	profile, err := svc.UploadCompanyLogo(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "a.png", "image/png", []byte{137, 80, 78, 71, 13, 10, 26, 10, 0})
	if err != nil {
		t.Fatalf("upload logo failed: %v", err)
	}
	if strings.Contains(profile.LogoPath, ":") || strings.HasPrefix(profile.LogoPath, "/") {
		t.Fatalf("expected relative logo path, got %q", profile.LogoPath)
	}
}

func TestRemoveCompanyLogoBestEffortDeleteDoesNotFail(t *testing.T) {
	repo := newFakeRepository()
	store := &failingDeleteLogoStore{LocalLogoStore: newTestLocalLogoStore(t)}
	svc := NewService(repo, store)

	_, err := svc.UploadCompanyLogo(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, "a.png", "image/png", []byte{137, 80, 78, 71, 13, 10, 26, 10, 0})
	if err != nil {
		t.Fatalf("upload logo failed: %v", err)
	}

	_, err = svc.RemoveCompanyLogo(context.Background(), &models.Claims{UserID: 1, Role: "admin"})
	if err != nil {
		t.Fatalf("expected no error on best-effort delete, got %v", err)
	}
}

type failingDeleteLogoStore struct {
	*LocalLogoStore
}

func (f *failingDeleteLogoStore) DeleteLogo(_ context.Context, _ string) error {
	return fmt.Errorf("delete failed")
}

type testRoundTripper func(req *http.Request) (*http.Response, error)

func (f testRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func newTestHTTPClient(fn func(req *http.Request) (*http.Response, error)) *http.Client {
	return &http.Client{Transport: testRoundTripper(fn)}
}

func newHTTPResponse(statusCode int, contentType string, body []byte) *http.Response {
	return &http.Response{
		StatusCode: statusCode,
		Header: http.Header{
			"Content-Type": []string{contentType},
		},
		Body: io.NopCloser(bytes.NewReader(body)),
	}
}
