package employees

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"path/filepath"
	"strings"
	"time"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/phone"
)

const (
	maxContractSizeBytes = 10 * 1024 * 1024
)

var (
	ErrValidation = errors.New("validation failed")
	ErrNotFound   = errors.New("employee not found")
)

type PhoneDefaultsProvider interface {
	GetPhoneDefaults(ctx context.Context) (defaultCountryISO2 string, defaultCountryCallingCode string, err error)
}

type Service struct {
	repository            Repository
	contractStore         ContractStore
	phoneDefaultsProvider PhoneDefaultsProvider
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) SetContractStore(store ContractStore) {
	s.contractStore = store
}

func (s *Service) SetPhoneDefaultsProvider(provider PhoneDefaultsProvider) {
	s.phoneDefaultsProvider = provider
}

func (s *Service) CreateEmployee(ctx context.Context, _ *models.Claims, input UpsertEmployeeInput) (*Employee, error) {
	normalized, err := s.normalizeAndValidate(ctx, input)
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
		return nil, newFieldValidationError("id", "must be positive")
	}

	normalized, err := s.normalizeAndValidate(ctx, input)
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

func (s *Service) UploadEmployeeContract(
	ctx context.Context,
	claims *models.Claims,
	employeeID int64,
	filename string,
	mimeType string,
	data []byte,
) (*Employee, error) {
	if err := middleware.RequireRoles(claims, "admin", "hr officer"); err != nil {
		return nil, middleware.ErrForbidden
	}
	if employeeID <= 0 {
		return nil, fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("%w: contract file is required", ErrValidation)
	}
	if len(data) > maxContractSizeBytes {
		return nil, fmt.Errorf("%w: contract file exceeds %d bytes", ErrValidation, maxContractSizeBytes)
	}
	if s.contractStore == nil {
		return nil, fmt.Errorf("contract store is not configured")
	}

	employee, err := s.repository.GetByID(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	if employee == nil {
		return nil, ErrNotFound
	}

	extension, err := resolveContractExtension(filename, mimeType)
	if err != nil {
		return nil, err
	}

	newPath, err := s.contractStore.SaveContract(ctx, employeeID, extension, data)
	if err != nil {
		return nil, err
	}

	updated, err := s.repository.UpdateContractFilePath(ctx, employeeID, &newPath)
	if err != nil {
		_ = s.contractStore.DeleteContract(ctx, newPath)
		return nil, err
	}
	if updated == nil {
		_ = s.contractStore.DeleteContract(ctx, newPath)
		return nil, ErrNotFound
	}

	previousPath := normalizeOptional(employee.ContractFilePath)
	if previousPath != nil && *previousPath != newPath {
		_ = s.contractStore.DeleteContract(ctx, *previousPath)
	}

	return updated, nil
}

func (s *Service) RemoveEmployeeContract(ctx context.Context, claims *models.Claims, employeeID int64) (*Employee, error) {
	if err := middleware.RequireRoles(claims, "admin", "hr officer"); err != nil {
		return nil, middleware.ErrForbidden
	}
	if employeeID <= 0 {
		return nil, fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}

	employee, err := s.repository.GetByID(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	if employee == nil {
		return nil, ErrNotFound
	}

	updated, err := s.repository.UpdateContractFilePath(ctx, employeeID, nil)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrNotFound
	}

	if s.contractStore != nil {
		previousPath := normalizeOptional(employee.ContractFilePath)
		if previousPath != nil {
			_ = s.contractStore.DeleteContract(ctx, *previousPath)
		}
	}

	return updated, nil
}

func (s *Service) DeleteEmployee(ctx context.Context, _ *models.Claims, id int64) error {
	if id <= 0 {
		return newFieldValidationError("id", "must be positive")
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
		return nil, newFieldValidationError("id", "must be positive")
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

func (s *Service) normalizeAndValidate(ctx context.Context, input UpsertEmployeeInput) (RepositoryUpsertInput, error) {
	firstName := strings.TrimSpace(input.FirstName)
	lastName := strings.TrimSpace(input.LastName)
	position := strings.TrimSpace(input.Position)
	employmentStatus := strings.TrimSpace(input.EmploymentStatus)
	dateOfHire := strings.TrimSpace(input.DateOfHire)

	switch {
	case firstName == "":
		return RepositoryUpsertInput{}, newFieldValidationError("firstName", "is required")
	case lastName == "":
		return RepositoryUpsertInput{}, newFieldValidationError("lastName", "is required")
	case position == "":
		return RepositoryUpsertInput{}, newFieldValidationError("position", "is required")
	case employmentStatus == "":
		return RepositoryUpsertInput{}, newFieldValidationError("employmentStatus", "is required")
	case dateOfHire == "":
		return RepositoryUpsertInput{}, newFieldValidationError("dateOfHire", "is required")
	}

	if input.BaseSalaryAmount < 0 {
		return RepositoryUpsertInput{}, newFieldValidationError("baseSalaryAmount", "must be >= 0")
	}

	hireDate, err := time.Parse("2006-01-02", dateOfHire)
	if err != nil {
		return RepositoryUpsertInput{}, newFieldValidationError("dateOfHire", "must use YYYY-MM-DD")
	}

	normalized := RepositoryUpsertInput{
		FirstName:        firstName,
		LastName:         lastName,
		OtherName:        normalizeOptional(input.OtherName),
		Gender:           normalizeOptional(input.Gender),
		Email:            normalizeOptional(input.Email),
		NationalID:       normalizeOptional(input.NationalID),
		Address:          normalizeOptional(input.Address),
		JobDescription:   normalizeOptional(input.JobDescription),
		ContractURL:      normalizeOptionalURL(input.ContractURL),
		DepartmentID:     input.DepartmentID,
		Position:         position,
		EmploymentStatus: employmentStatus,
		DateOfHire:       hireDate,
		BaseSalaryAmount: input.BaseSalaryAmount,
	}

	if normalized.DateOfBirth, err = parseOptionalDate(input.DateOfBirth); err != nil {
		return RepositoryUpsertInput{}, newFieldValidationError("dateOfBirth", "must use YYYY-MM-DD")
	}

	if normalized.Gender, err = normalizeGender(input.Gender); err != nil {
		return RepositoryUpsertInput{}, err
	}

	if normalized.Email != nil {
		if _, err := mail.ParseAddress(*normalized.Email); err != nil {
			return RepositoryUpsertInput{}, newFieldValidationError("email", "is invalid")
		}
	}

	phoneInput := normalizeOptional(input.Phone)
	if phoneInput != nil {
		defaultISO2 := "UG"
		if s.phoneDefaultsProvider != nil {
			iso2, _, err := s.phoneDefaultsProvider.GetPhoneDefaults(ctx)
			if err != nil {
				return RepositoryUpsertInput{}, err
			}
			if strings.TrimSpace(iso2) != "" {
				defaultISO2 = iso2
			}
		}

		e164, err := phone.NormalizePhone(*phoneInput, defaultISO2)
		if err != nil {
			return RepositoryUpsertInput{}, newFieldValidationError("phone", "is invalid")
		}
		normalized.Phone = &e164
		normalized.PhoneE164 = &e164
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

func normalizeGender(value *string) (*string, error) {
	normalized := normalizeOptional(value)
	if normalized == nil {
		return nil, newFieldValidationError("gender", "is required")
	}

	switch strings.ToLower(*normalized) {
	case "male":
		gender := "Male"
		return &gender, nil
	case "female":
		gender := "Female"
		return &gender, nil
	default:
		return nil, newFieldValidationError("gender", "must be Male or Female")
	}
}

func normalizeOptionalURL(value *string) *string {
	normalized := normalizeOptional(value)
	if normalized == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*normalized)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func resolveContractExtension(filename string, mimeType string) (string, error) {
	trimmedMIME := strings.ToLower(strings.TrimSpace(mimeType))
	if separator := strings.Index(trimmedMIME, ";"); separator >= 0 {
		trimmedMIME = strings.TrimSpace(trimmedMIME[:separator])
	}

	switch trimmedMIME {
	case "application/pdf":
		return ".pdf", nil
	case "application/msword":
		return ".doc", nil
	case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return ".docx", nil
	}

	ext := strings.ToLower(strings.TrimSpace(filepath.Ext(filename)))
	switch ext {
	case ".pdf", ".doc", ".docx":
		return ext, nil
	default:
		return "", fmt.Errorf("%w: contract file must be pdf/doc/docx", ErrValidation)
	}
}
