package departments

import (
	"context"
	"errors"
	"testing"

	"hrpro/internal/models"
)

type fakeRepository struct {
	existsByName  bool
	employeesByID map[int64]int64
}

func (f *fakeRepository) Create(_ context.Context, name string, description *string) (*Department, error) {
	return &Department{ID: 1, Name: name, Description: description}, nil
}

func (f *fakeRepository) Update(_ context.Context, id int64, name string, description *string) (*Department, error) {
	return &Department{ID: id, Name: name, Description: description}, nil
}

func (f *fakeRepository) Delete(_ context.Context, _ int64) (bool, error) {
	return true, nil
}

func (f *fakeRepository) GetByID(_ context.Context, id int64) (*Department, error) {
	return &Department{ID: id, Name: "IT"}, nil
}

func (f *fakeRepository) List(_ context.Context, _ ListDepartmentsQuery) ([]Department, int64, error) {
	return []Department{}, 0, nil
}

func (f *fakeRepository) ExistsByNameCaseInsensitive(_ context.Context, _ string, _ *int64) (bool, error) {
	return f.existsByName, nil
}

func (f *fakeRepository) CountEmployeesByDepartmentID(_ context.Context, departmentID int64) (int64, error) {
	return f.employeesByID[departmentID], nil
}

func TestCreateDepartmentRejectsDuplicateNames(t *testing.T) {
	service := NewService(&fakeRepository{existsByName: true})

	_, err := service.CreateDepartment(
		context.Background(),
		&models.Claims{Role: "Admin"},
		UpsertDepartmentInput{Name: "  Finance "},
	)

	if !errors.Is(err, ErrDuplicateName) {
		t.Fatalf("expected duplicate name error, got %v", err)
	}
}

func TestDeleteDepartmentFailsWhenEmployeesExist(t *testing.T) {
	service := NewService(&fakeRepository{employeesByID: map[int64]int64{10: 2}})

	err := service.DeleteDepartment(
		context.Background(),
		&models.Claims{Role: "Admin"},
		10,
	)

	if !errors.Is(err, ErrDepartmentHasEmployees) {
		t.Fatalf("expected department has employees error, got %v", err)
	}
}
