package handlers

import (
	"context"
	"fmt"

	"hrpro/internal/dashboard"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type DashboardAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type DashboardHandler struct {
	authService DashboardAuthService
	service     *dashboard.Service
}

type GetDashboardSummaryRequest struct {
	AccessToken string `json:"accessToken"`
}

func NewDashboardHandler(authService DashboardAuthService, service *dashboard.Service) *DashboardHandler {
	return &DashboardHandler{authService: authService, service: service}
}

func (h *DashboardHandler) GetDashboardSummary(ctx context.Context, request GetDashboardSummaryRequest) (*dashboard.SummaryDTO, error) {
	claims, err := validateAuthClaims(h.authService, request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "admin", "hr_officer", "finance_officer", "viewer"); err != nil {
		return nil, err
	}

	summary, err := h.service.GetDashboardSummary(ctx, claims)
	if err != nil {
		return nil, fmt.Errorf("get dashboard summary: %w", err)
	}
	return summary, nil
}
