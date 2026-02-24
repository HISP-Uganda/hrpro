package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/audit"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/settings"
)

type SettingsAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type SettingsHandler struct {
	authService SettingsAuthService
	service     *settings.Service
}

type GetSettingsRequest struct {
	AccessToken string `json:"accessToken"`
}

type UpdateSettingsRequest struct {
	AccessToken string                       `json:"accessToken"`
	Payload     settings.UpdateSettingsInput `json:"payload"`
}

type UploadCompanyLogoRequest struct {
	AccessToken string `json:"accessToken"`
	Filename    string `json:"filename"`
	MimeType    string `json:"mimeType"`
	Data        []byte `json:"data"`
}

type GetCompanyLogoRequest struct {
	AccessToken string `json:"accessToken"`
}

type SaveCompanyProfileRequest struct {
	AccessToken string                           `json:"accessToken"`
	Payload     settings.SaveCompanyProfileInput `json:"payload"`
}

type ImportCompanyLogoFromURLRequest struct {
	AccessToken string `json:"accessToken"`
	URL         string `json:"url"`
}

func NewSettingsHandler(authService SettingsAuthService, service *settings.Service) *SettingsHandler {
	return &SettingsHandler{authService: authService, service: service}
}

func (h *SettingsHandler) GetSettings(ctx context.Context, request GetSettingsRequest) (*settings.SettingsDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.GetSettings(ctx, claims)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) UpdateSettings(ctx context.Context, request UpdateSettingsRequest) (*settings.SettingsDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.UpdateSettings(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) GetCompanyProfile(ctx context.Context, request GetSettingsRequest) (*settings.CompanyProfileDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.GetCompanyProfile(ctx, claims)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) SaveCompanyProfile(ctx context.Context, request SaveCompanyProfileRequest) (*settings.CompanyProfileDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.SaveCompanyProfile(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) UploadCompanyLogo(ctx context.Context, request UploadCompanyLogoRequest) (*settings.CompanyProfileDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.UploadCompanyLogo(ctx, claims, request.Filename, request.MimeType, request.Data)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) ImportCompanyLogoFromURL(ctx context.Context, request ImportCompanyLogoFromURLRequest) (*settings.CompanyProfileDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.ImportCompanyLogoFromURL(ctx, claims, request.URL)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) RemoveCompanyLogo(ctx context.Context, request GetSettingsRequest) (*settings.CompanyProfileDTO, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.RemoveCompanyLogo(ctx, claims)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) GetCompanyLogo(ctx context.Context, request GetCompanyLogoRequest) (*settings.CompanyLogo, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.GetCompanyLogo(ctx, claims)
	if err != nil {
		return nil, mapSettingsError(err)
	}
	return item, nil
}

func (h *SettingsHandler) validateClaims(accessToken string) (*models.Claims, error) {
	claims, err := h.authService.ValidateAccessToken(extractBearerToken(accessToken))
	if err != nil {
		return nil, err
	}
	return claims, nil
}

func mapSettingsError(err error) error {
	switch {
	case errors.Is(err, settings.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, settings.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, settings.ErrForbidden), errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
