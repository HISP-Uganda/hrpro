package middleware

import (
	"errors"
	"fmt"

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
	for _, role := range allowedRoles {
		if claims.Role == role {
			return nil
		}
	}

	return ErrForbidden
}
