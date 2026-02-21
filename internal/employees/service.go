package employees

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"hrpro/internal/models"
)

var (
	ErrValidation = errors.New("validation failed")
	ErrNotFound   = errors.New("employee not found")
)

var phonePattern = regexp.MustCompile(`^[0-9+()\-\s]{7,20}$`)

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) CreateEmployee(ctx context.Context, _ *models.Claims, input UpsertEmployeeInput) (*Employee, error) {
	normalized, err := normalizeAndValidate(input)
	if err != nil {
		return nil, err
	}

	employee, err := s.repository.Create(ctx, normalized)
	if err != nil {
		return nil, err
	}

	return employee, nil
}

func (s *Service) UpdateEmployee(ctx context.Context, _ *models.Claims, id int64, input UpsertEmployeeInput) (*Employee, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	normalized, err := normalizeAndValidate(input)
	if err != nil {
		return nil, err
	}

	employee, err := s.repository.Update(ctx, id, normalized)
	if err != nil {
		return nil, err
	}

	if employee == nil {
		return nil, ErrNotFound
	}

	return employee, nil
}

func (s *Service) DeleteEmployee(ctx context.Context, _ *models.Claims, id int64) error {
	if id <= 0 {
		return fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	deleted, err := s.repository.Delete(ctx, id)
	if err != nil {
		return err
	}

	if !deleted {
		return ErrNotFound
	}

	return nil
}

func (s *Service) GetEmployee(ctx context.Context, _ *models.Claims, id int64) (*Employee, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	employee, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if employee == nil {
		return nil, ErrNotFound
	}

	return employee, nil
}

func (s *Service) ListEmployees(ctx context.Context, _ *models.Claims, query ListEmployeesQuery) (*ListEmployeesResult, error) {
	if query.Page <= 0 {
		query.Page = 1
	}

	if query.PageSize <= 0 {
		query.PageSize = 10
	}

	if query.PageSize > 100 {
		query.PageSize = 100
	}

	items, total, err := s.repository.List(ctx, query)
	if err != nil {
		return nil, err
	}

	return &ListEmployeesResult{
		Items:      items,
		TotalCount: total,
		Page:       query.Page,
		PageSize:   query.PageSize,
	}, nil
}

func normalizeAndValidate(input UpsertEmployeeInput) (RepositoryUpsertInput, error) {
	firstName := strings.TrimSpace(input.FirstName)
	lastName := strings.TrimSpace(input.LastName)
	position := strings.TrimSpace(input.Position)
	employmentStatus := strings.TrimSpace(input.EmploymentStatus)
	dateOfHire := strings.TrimSpace(input.DateOfHire)

	switch {
	case firstName == "":
		return RepositoryUpsertInput{}, fmt.Errorf("%w: first_name is required", ErrValidation)
	case lastName == "":
		return RepositoryUpsertInput{}, fmt.Errorf("%w: last_name is required", ErrValidation)
	case position == "":
		return RepositoryUpsertInput{}, fmt.Errorf("%w: position is required", ErrValidation)
	case employmentStatus == "":
		return RepositoryUpsertInput{}, fmt.Errorf("%w: employment_status is required", ErrValidation)
	case dateOfHire == "":
		return RepositoryUpsertInput{}, fmt.Errorf("%w: date_of_hire is required", ErrValidation)
	}

	if input.BaseSalaryAmount < 0 {
		return RepositoryUpsertInput{}, fmt.Errorf("%w: base_salary_amount must be >= 0", ErrValidation)
	}

	hireDate, err := time.Parse("2006-01-02", dateOfHire)
	if err != nil {
		return RepositoryUpsertInput{}, fmt.Errorf("%w: date_of_hire must use YYYY-MM-DD", ErrValidation)
	}

	normalized := RepositoryUpsertInput{
		FirstName:        firstName,
		LastName:         lastName,
		OtherName:        normalizeOptional(input.OtherName),
		Gender:           normalizeOptional(input.Gender),
		Phone:            normalizeOptional(input.Phone),
		Email:            normalizeOptional(input.Email),
		NationalID:       normalizeOptional(input.NationalID),
		Address:          normalizeOptional(input.Address),
		DepartmentID:     input.DepartmentID,
		Position:         position,
		EmploymentStatus: employmentStatus,
		DateOfHire:       hireDate,
		BaseSalaryAmount: input.BaseSalaryAmount,
	}

	if normalized.DateOfBirth, err = parseOptionalDate(input.DateOfBirth); err != nil {
		return RepositoryUpsertInput{}, fmt.Errorf("%w: date_of_birth must use YYYY-MM-DD", ErrValidation)
	}

	if normalized.Email != nil {
		if _, err := mail.ParseAddress(*normalized.Email); err != nil {
			return RepositoryUpsertInput{}, fmt.Errorf("%w: email is invalid", ErrValidation)
		}
	}

	if normalized.Phone != nil && !phonePattern.MatchString(*normalized.Phone) {
		return RepositoryUpsertInput{}, fmt.Errorf("%w: phone is invalid", ErrValidation)
	}

	return normalized, nil
}

func normalizeOptional(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func parseOptionalDate(value *string) (*time.Time, error) {
	normalized := normalizeOptional(value)
	if normalized == nil {
		return nil, nil
	}

	parsed, err := time.Parse("2006-01-02", *normalized)
	if err != nil {
		return nil, err
	}

	return &parsed, nil
}
