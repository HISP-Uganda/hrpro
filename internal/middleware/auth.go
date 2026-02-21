package middleware

import (
	"errors"
	"fmt"
	"strings"

	"hrpro/internal/models"
)

var ErrForbidden = errors.New("forbidden")

type TokenValidator interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

func ValidateJWT(validator TokenValidator, accessToken string) (*models.Claims, error) {
	claims, err := validator.ValidateAccessToken(accessToken)
	if err != nil {
		return nil, fmt.Errorf("validate jwt: %w", err)
	}

	return claims, nil
}

func RequireRoles(claims *models.Claims, allowedRoles ...string) error {
	if claims == nil {
		return ErrForbidden
	}

	current := NormalizeRole(claims.Role)
	for _, role := range allowedRoles {
		if current == NormalizeRole(role) {
			return nil
		}
	}

	return ErrForbidden
}

func NormalizeRole(role string) string {
	normalized := strings.TrimSpace(strings.ToLower(role))
	normalized = strings.ReplaceAll(normalized, " ", "_")
	return normalized
}
