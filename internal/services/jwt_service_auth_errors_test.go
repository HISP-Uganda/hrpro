package services

import (
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

func TestTokenServiceValidateAccessTokenMapsMissingExpiredAndInvalid(t *testing.T) {
	service := NewTokenService("test-secret")
	user := models.User{
		ID:       1,
		Username: "admin",
		Role:     "Admin",
	}

	if _, err := service.ValidateAccessToken(""); !errors.Is(err, ErrAccessTokenMissing) {
		t.Fatalf("expected ErrAccessTokenMissing, got %v", err)
	}

	expiredToken, err := service.CreateAccessToken(user, -1*time.Minute)
	if err != nil {
		t.Fatalf("create expired token: %v", err)
	}
	if _, err := service.ValidateAccessToken(expiredToken); !errors.Is(err, ErrAccessTokenExpired) {
		t.Fatalf("expected ErrAccessTokenExpired, got %v", err)
	}

	if _, err := service.ValidateAccessToken("not-a-jwt-token"); !errors.Is(err, ErrAccessTokenInvalid) {
		t.Fatalf("expected ErrAccessTokenInvalid, got %v", err)
	}
}
