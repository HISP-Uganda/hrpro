package departments

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"hrpro/internal/models"
)

var (
	ErrValidation             = errors.New("validation failed")
	ErrNotFound               = errors.New("department not found")
	ErrDuplicateName          = errors.New("department name already exists")
	ErrDepartmentHasEmployees = errors.New("department has employees")
)

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) CreateDepartment(ctx context.Context, _ *models.Claims, input UpsertDepartmentInput) (*Department, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrValidation)
	}

	description := normalizeOptional(input.Description)

	exists, err := s.repository.ExistsByNameCaseInsensitive(ctx, name, nil)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, ErrDuplicateName
	}

	return s.repository.Create(ctx, name, description)
}

func (s *Service) UpdateDepartment(ctx context.Context, _ *models.Claims, id int64, input UpsertDepartmentInput) (*Department, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrValidation)
	}

	description := normalizeOptional(input.Description)

	exists, err := s.repository.ExistsByNameCaseInsensitive(ctx, name, &id)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, ErrDuplicateName
	}

	department, err := s.repository.Update(ctx, id, name, description)
	if err != nil {
		return nil, err
	}

	if department == nil {
		return nil, ErrNotFound
	}

	return department, nil
}

func (s *Service) DeleteDepartment(ctx context.Context, _ *models.Claims, id int64) error {
	if id <= 0 {
		return fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	employeeCount, err := s.repository.CountEmployeesByDepartmentID(ctx, id)
	if err != nil {
		return err
	}

	if employeeCount > 0 {
		return ErrDepartmentHasEmployees
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

func (s *Service) GetDepartment(ctx context.Context, _ *models.Claims, id int64) (*Department, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	department, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if department == nil {
		return nil, ErrNotFound
	}

	return department, nil
}

func (s *Service) ListDepartments(ctx context.Context, _ *models.Claims, query ListDepartmentsQuery) (*ListDepartmentsResult, error) {
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

	return &ListDepartmentsResult{
		Items:      items,
		TotalCount: total,
		Page:       query.Page,
		PageSize:   query.PageSize,
	}, nil
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
