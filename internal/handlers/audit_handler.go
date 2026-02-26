package handlers

import (
	"context"
	"hrpro/internal/audit"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type AuditAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type AuditHandler struct {
	authService AuditAuthService
	service     *audit.Service
}

type ListAuditLogsRequest struct {
	AccessToken string `json:"accessToken"`
	Page        int    `json:"page"`
	PageSize    int    `json:"pageSize"`
	Q           string `json:"q"`
}

func NewAuditHandler(authService AuditAuthService, service *audit.Service) *AuditHandler {
	return &AuditHandler{authService: authService, service: service}
}

func (h *AuditHandler) ListAuditLogs(ctx context.Context, request ListAuditLogsRequest) (*audit.ListAuditLogsResult, error) {
	claims, err := validateAuthClaims(h.authService, request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin"); err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	return h.service.ListAuditLogs(ctx, claims, audit.ListAuditLogsQuery{
		Page:     request.Page,
		PageSize: request.PageSize,
		Q:        request.Q,
	})
}
