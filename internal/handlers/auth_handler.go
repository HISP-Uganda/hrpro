package handlers

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"hrpro/internal/middleware"
	"hrpro/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserDTO struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

type LoginResponse struct {
	AccessToken  string  `json:"accessToken"`
	RefreshToken string  `json:"refreshToken"`
	User         UserDTO `json:"user"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type GetMeResponse struct {
	User UserDTO `json:"user"`
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(ctx context.Context, request LoginRequest) (*LoginResponse, error) {
	result, err := h.authService.Login(ctx, request.Username, request.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) || errors.Is(err, services.ErrInactiveUser) {
			return nil, fmt.Errorf("authentication failed")
		}

		return nil, err
	}

	return &LoginResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		User: UserDTO{
			ID:       result.User.ID,
			Username: result.User.Username,
			Role:     result.User.Role,
		},
	}, nil
}

func (h *AuthHandler) Logout(ctx context.Context, request LogoutRequest) error {
	return h.authService.Logout(ctx, request.RefreshToken)
}

func (h *AuthHandler) GetMe(ctx context.Context, accessToken string) (*GetMeResponse, error) {
	token := extractBearerToken(accessToken)
	if token == "" {
		return nil, fmt.Errorf("access token is required")
	}

	claims, err := middleware.ValidateJWT(h.authService, token)
	if err != nil {
		return nil, err
	}

	user, err := h.authService.GetMe(ctx, token)
	if err != nil {
		return nil, err
	}

	return &GetMeResponse{
		User: UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Role:     claims.Role,
		},
	}, nil
}

func extractBearerToken(raw string) string {
	value := strings.TrimSpace(raw)
	if strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return strings.TrimSpace(value[7:])
	}

	return value
}
