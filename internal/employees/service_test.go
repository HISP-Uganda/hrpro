package employees

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct {
	createInput RepositoryUpsertInput
}

func (f *fakeRepository) Create(_ context.Context, input RepositoryUpsertInput) (*Employee, error) {
	f.createInput = input
	return &Employee{ID: 1, FirstName: input.FirstName, LastName: input.LastName}, nil
}

func (f *fakeRepository) Update(_ context.Context, _ int64, _ RepositoryUpsertInput) (*Employee, error) {
	return &Employee{ID: 1}, nil
}

func (f *fakeRepository) Delete(_ context.Context, _ int64) (bool, error) {
	return true, nil
}

func (f *fakeRepository) GetByID(_ context.Context, _ int64) (*Employee, error) {
	return &Employee{ID: 1}, nil
}

func (f *fakeRepository) List(_ context.Context, _ ListEmployeesQuery) ([]Employee, int64, error) {
	return []Employee{}, 0, nil
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

func stringPtr(value string) *string {
	return &value
}
