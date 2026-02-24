package handlers

import (
	"strings"
	"testing"

	"hrpro/internal/employees"
)

func TestMapEmployeeErrorIncludesFieldNameForValidationError(t *testing.T) {
	err := mapEmployeeError(&employees.FieldValidationError{
		Field:   "phone",
		Message: "is invalid",
	})
	if err == nil {
		t.Fatalf("expected error")
	}
	msg := err.Error()
	if !strings.Contains(msg, "validation error") {
		t.Fatalf("expected validation error message, got %q", msg)
	}
	if !strings.Contains(msg, "field=phone") {
		t.Fatalf("expected field name in message, got %q", msg)
	}
}
