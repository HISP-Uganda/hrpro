package handlers

import (
	"errors"
	"fmt"

	"hrpro/internal/models"
	"hrpro/internal/services"
)

const (
	AuthExpiredCode      = "AUTH_EXPIRED"
	AuthUnauthorizedCode = "AUTH_UNAUTHORIZED"
)

type accessTokenValidator interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

func validateAuthClaims(authService accessTokenValidator, accessToken string) (*models.Claims, error) {
	claims, err := authService.ValidateAccessToken(extractBearerToken(accessToken))
	if err != nil {
		return nil, mapAuthTokenError(err)
	}
	return claims, nil
}

func mapAuthTokenError(err error) error {
	switch {
	case errors.Is(err, services.ErrAccessTokenExpired):
		return fmt.Errorf(AuthExpiredCode)
	case errors.Is(err, services.ErrAccessTokenInvalid), errors.Is(err, services.ErrAccessTokenMissing):
		return fmt.Errorf(AuthUnauthorizedCode)
	default:
		return err
	}
}
