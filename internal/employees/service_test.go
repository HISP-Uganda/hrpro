package employees

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct {
	createInput    RepositoryUpsertInput
	employee       *Employee
	updatedPath    *string
	updatePathCall int
}

func (f *fakeRepository) Create(_ context.Context, input RepositoryUpsertInput) (*Employee, error) {
	f.createInput = input
	return &Employee{ID: 1, FirstName: input.FirstName, LastName: input.LastName, Phone: input.Phone, PhoneE164: input.PhoneE164}, nil
}

func (f *fakeRepository) Update(_ context.Context, id int64, _ RepositoryUpsertInput) (*Employee, error) {
	return &Employee{ID: id}, nil
}

func (f *fakeRepository) UpdateContractFilePath(_ context.Context, id int64, contractFilePath *string) (*Employee, error) {
	f.updatedPath = contractFilePath
	f.updatePathCall++
	if f.employee == nil {
		return nil, nil
	}
	f.employee.ContractFilePath = contractFilePath
	return &Employee{ID: id, ContractFilePath: contractFilePath}, nil
}

func (f *fakeRepository) Delete(_ context.Context, _ int64) (bool, error) {
	return true, nil
}

func (f *fakeRepository) GetByID(_ context.Context, id int64) (*Employee, error) {
	if f.employee == nil {
		return nil, nil
	}
	return &Employee{
		ID:               id,
		ContractFilePath: f.employee.ContractFilePath,
	}, nil
}

func (f *fakeRepository) List(_ context.Context, _ ListEmployeesQuery) ([]Employee, int64, error) {
	return []Employee{}, 0, nil
}

type fakePhoneDefaultsProvider struct {
	iso2      string
	calling   string
	called    int
	returnErr error
}

func (f *fakePhoneDefaultsProvider) GetPhoneDefaults(_ context.Context) (string, string, error) {
	f.called++
	if f.returnErr != nil {
		return "", "", f.returnErr
	}
	return f.iso2, f.calling, nil
}

type fakeContractStore struct {
	savedPath   string
	deletedPath string
	deleteCall  int
	saveCall    int
}

func (f *fakeContractStore) SaveContract(_ context.Context, _ int64, _ string, _ []byte) (string, error) {
	f.saveCall++
	if f.savedPath == "" {
		f.savedPath = "employees/1/contract/test.pdf"
	}
	return f.savedPath, nil
}

func (f *fakeContractStore) DeleteContract(_ context.Context, relativePath string) error {
	f.deleteCall++
	f.deletedPath = relativePath
	return nil
}

func TestCreateEmployeeValidation(t *testing.T) {
	service := NewService(&fakeRepository{})
	claims := &models.Claims{Role: "Admin"}

	tests := []struct {
		name    string
		input   UpsertEmployeeInput
		wantErr error
	}{
		{
			name: "missing required first name",
			input: UpsertEmployeeInput{
				LastName:         "Doe",
				Position:         "Engineer",
				EmploymentStatus: "Active",
				DateOfHire:       "2026-02-21",
			},
			wantErr: ErrValidation,
		},
		{
			name: "invalid email",
			input: UpsertEmployeeInput{
				FirstName:        "Jane",
				LastName:         "Doe",
				Gender:           stringPtr("Female"),
				Position:         "Engineer",
				EmploymentStatus: "Active",
				DateOfHire:       "2026-02-21",
				Email:            stringPtr("not-an-email"),
			},
			wantErr: ErrValidation,
		},
		{
			name: "invalid phone",
			input: UpsertEmployeeInput{
				FirstName:        "Jane",
				LastName:         "Doe",
				Gender:           stringPtr("Female"),
				Position:         "Engineer",
				EmploymentStatus: "Active",
				DateOfHire:       "2026-02-21",
				Phone:            stringPtr("bad-phone***"),
			},
			wantErr: ErrValidation,
		},
		{
			name: "negative salary",
			input: UpsertEmployeeInput{
				FirstName:        "Jane",
				LastName:         "Doe",
				Gender:           stringPtr("Female"),
				Position:         "Engineer",
				EmploymentStatus: "Active",
				DateOfHire:       "2026-02-21",
				BaseSalaryAmount: -1,
			},
			wantErr: ErrValidation,
		},
		{
			name: "valid input",
			input: UpsertEmployeeInput{
				FirstName:        "Jane",
				LastName:         "Doe",
				Gender:           stringPtr("Female"),
				Position:         "Engineer",
				EmploymentStatus: "Active",
				DateOfHire:       "2026-02-21",
				BaseSalaryAmount: 1000,
				Phone:            stringPtr("+256701234567"),
				Email:            stringPtr("jane@example.com"),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.CreateEmployee(context.Background(), claims, tt.input)

			if tt.wantErr == nil && err != nil {
				t.Fatalf("expected no error, got %v", err)
			}

			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("expected error %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestCreateEmployeeNormalizesDate(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)

	_, err := service.CreateEmployee(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertEmployeeInput{
			FirstName:        "Jane",
			LastName:         "Doe",
			Gender:           stringPtr("Female"),
			Position:         "Engineer",
			EmploymentStatus: "Active",
			DateOfHire:       "2026-02-21",
			DateOfBirth:      stringPtr("1999-01-10"),
		},
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if repo.createInput.DateOfBirth == nil {
		t.Fatalf("expected date of birth to be set")
	}

	expected := time.Date(1999, time.January, 10, 0, 0, 0, 0, time.UTC)
	if !repo.createInput.DateOfBirth.Equal(expected) {
		t.Fatalf("expected %v, got %v", expected, repo.createInput.DateOfBirth)
	}
}

func TestCreateEmployeeNormalizesNationalPhoneUsingDefaults(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)
	defaults := &fakePhoneDefaultsProvider{iso2: "UG", calling: "+256"}
	service.SetPhoneDefaultsProvider(defaults)

	_, err := service.CreateEmployee(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertEmployeeInput{
			FirstName:        "Jane",
			LastName:         "Doe",
			Gender:           stringPtr("Female"),
			Position:         "Engineer",
			EmploymentStatus: "Active",
			DateOfHire:       "2026-02-21",
			Phone:            stringPtr("0701234567"),
		},
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if defaults.called != 1 {
		t.Fatalf("expected phone defaults provider to be called once")
	}
	if repo.createInput.Phone == nil || *repo.createInput.Phone != "+256701234567" {
		t.Fatalf("expected normalized phone +256701234567, got %+v", repo.createInput.Phone)
	}
	if repo.createInput.PhoneE164 == nil || *repo.createInput.PhoneE164 != "+256701234567" {
		t.Fatalf("expected phone_e164 +256701234567, got %+v", repo.createInput.PhoneE164)
	}
}

func TestCreateEmployeeAllowsEmptyOptionalPhone(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)
	defaults := &fakePhoneDefaultsProvider{iso2: "UG", calling: "+256"}
	service.SetPhoneDefaultsProvider(defaults)

	_, err := service.CreateEmployee(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertEmployeeInput{
			FirstName:        "Jane",
			LastName:         "Doe",
			Gender:           stringPtr("Female"),
			Position:         "Engineer",
			EmploymentStatus: "Active",
			DateOfHire:       "2026-02-21",
			Phone:            stringPtr("   "),
		},
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if defaults.called != 0 {
		t.Fatalf("expected phone defaults provider not to be called when phone is empty")
	}
	if repo.createInput.Phone != nil {
		t.Fatalf("expected normalized phone to be nil, got %+v", repo.createInput.Phone)
	}
	if repo.createInput.PhoneE164 != nil {
		t.Fatalf("expected phone_e164 to be nil, got %+v", repo.createInput.PhoneE164)
	}
}

func TestCreateEmployeeRejectsInvalidGender(t *testing.T) {
	service := NewService(&fakeRepository{})

	_, err := service.CreateEmployee(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertEmployeeInput{
			FirstName:        "Jane",
			LastName:         "Doe",
			Gender:           stringPtr("Other"),
			Position:         "Engineer",
			EmploymentStatus: "Active",
			DateOfHire:       "2026-02-21",
		},
	)
	if err == nil {
		t.Fatalf("expected error")
	}
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
	var fieldErr *FieldValidationError
	if !errors.As(err, &fieldErr) {
		t.Fatalf("expected FieldValidationError, got %T", err)
	}
	if fieldErr.Field != "gender" {
		t.Fatalf("expected gender field error, got %q", fieldErr.Field)
	}
}

func TestCreateEmployeeStoresCanonicalGender(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)

	_, err := service.CreateEmployee(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertEmployeeInput{
			FirstName:        "Jane",
			LastName:         "Doe",
			Gender:           stringPtr("male"),
			Position:         "Engineer",
			EmploymentStatus: "Active",
			DateOfHire:       "2026-02-21",
			Phone:            stringPtr("+256701234567"),
		},
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if repo.createInput.Gender == nil || *repo.createInput.Gender != "Male" {
		t.Fatalf("expected canonical gender Male, got %+v", repo.createInput.Gender)
	}
	if repo.createInput.Phone == nil || *repo.createInput.Phone != "+256701234567" {
		t.Fatalf("expected international phone to remain E.164, got %+v", repo.createInput.Phone)
	}
}

func TestCreateEmployeeInvalidPhoneReturnsPhoneFieldError(t *testing.T) {
	service := NewService(&fakeRepository{})
	defaults := &fakePhoneDefaultsProvider{iso2: "UG", calling: "+256"}
	service.SetPhoneDefaultsProvider(defaults)

	_, err := service.CreateEmployee(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertEmployeeInput{
			FirstName:        "Jane",
			LastName:         "Doe",
			Gender:           stringPtr("Female"),
			Position:         "Engineer",
			EmploymentStatus: "Active",
			DateOfHire:       "2026-02-21",
			Phone:            stringPtr("123"),
		},
	)
	if err == nil {
		t.Fatalf("expected error")
	}
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
	var fieldErr *FieldValidationError
	if !errors.As(err, &fieldErr) {
		t.Fatalf("expected FieldValidationError, got %T", err)
	}
	if fieldErr.Field != "phone" {
		t.Fatalf("expected phone field error, got %q", fieldErr.Field)
	}
}

func TestUploadRemoveEmployeeContract(t *testing.T) {
	repo := &fakeRepository{
		employee: &Employee{ID: 1, ContractFilePath: stringPtr("employees/1/contract/old.pdf")},
	}
	store := &fakeContractStore{savedPath: "employees/1/contract/new.pdf"}
	service := NewService(repo)
	service.SetContractStore(store)

	claims := &models.Claims{Role: "Admin"}
	updated, err := service.UploadEmployeeContract(context.Background(), claims, 1, "contract.pdf", "application/pdf", []byte("pdf-data"))
	if err != nil {
		t.Fatalf("upload contract failed: %v", err)
	}
	if updated.ContractFilePath == nil || *updated.ContractFilePath != "employees/1/contract/new.pdf" {
		t.Fatalf("expected updated contract path, got %+v", updated.ContractFilePath)
	}
	if store.deleteCall == 0 || store.deletedPath != "employees/1/contract/old.pdf" {
		t.Fatalf("expected old contract to be deleted best-effort")
	}

	removed, err := service.RemoveEmployeeContract(context.Background(), claims, 1)
	if err != nil {
		t.Fatalf("remove contract failed: %v", err)
	}
	if removed.ContractFilePath != nil {
		t.Fatalf("expected contract path cleared")
	}
}

func stringPtr(value string) *string {
	return &value
}
