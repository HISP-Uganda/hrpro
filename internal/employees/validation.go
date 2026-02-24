package employees

import (
	"fmt"
	"strings"
)

type FieldValidationError struct {
	Field   string
	Message string
}

func (e *FieldValidationError) Error() string {
	return fmt.Sprintf("%s %s", e.Field, e.Message)
}

func (e *FieldValidationError) Unwrap() error {
	return ErrValidation
}

func newFieldValidationError(field string, message string) error {
	return &FieldValidationError{
		Field:   strings.TrimSpace(field),
		Message: strings.TrimSpace(message),
	}
}
