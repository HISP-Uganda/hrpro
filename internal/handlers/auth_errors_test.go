package handlers

import (
	"context"
	"errors"
	"testing"

	"hrpro/internal/models"
	"hrpro/internal/services"
)

type fakeAuthErrorService struct {
	err error
}

func (f *fakeAuthErrorService) ValidateAccessToken(_ string) (*models.Claims, error) {
	return nil, f.err
}

func TestEmployeesHandlerReturnsAuthExpiredCodeOnExpiredToken(t *testing.T) {
	handler := NewEmployeesHandler(&fakeAuthErrorService{err: services.ErrAccessTokenExpired}, nil)

	_, err := handler.CreateEmployee(context.Background(), CreateEmployeeRequest{AccessToken: "expired-token"})
	if err == nil || err.Error() != AuthExpiredCode {
		t.Fatalf("expected %s, got %v", AuthExpiredCode, err)
	}
}

func TestEmployeesHandlerReturnsUnauthorizedCodeOnInvalidToken(t *testing.T) {
	handler := NewEmployeesHandler(&fakeAuthErrorService{err: services.ErrAccessTokenInvalid}, nil)

	_, err := handler.CreateEmployee(context.Background(), CreateEmployeeRequest{AccessToken: "invalid-token"})
	if err == nil || err.Error() != AuthUnauthorizedCode {
		t.Fatalf("expected %s, got %v", AuthUnauthorizedCode, err)
	}
}

func TestMapAuthTokenErrorUnknownPassThrough(t *testing.T) {
	expected := errors.New("random error")
	if actual := mapAuthTokenError(expected); !errors.Is(actual, expected) {
		t.Fatalf("expected passthrough error, got %v", actual)
	}
}
