package main

import (
	"context"
	"fmt"
	"time"

	"hrpro/internal/config"
	"hrpro/internal/db"
	"hrpro/internal/handlers"
	"hrpro/internal/repositories"
	"hrpro/internal/services"

	"github.com/jmoiron/sqlx"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	db          *sqlx.DB
	authHandler *handlers.AuthHandler
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.bootstrap(ctx); err != nil {
		runtime.LogErrorf(ctx, "startup failed: %v", err)
		panic(err)
	}
}

func (a *App) shutdown(_ context.Context) {
	if a.db != nil {
		_ = a.db.Close()
	}
}

func (a *App) bootstrap(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	database, err := db.NewPool(cfg.DBConnectionString)
	if err != nil {
		return fmt.Errorf("create database pool: %w", err)
	}

	if err := db.ValidateConnection(ctx, database); err != nil {
		_ = database.Close()
		return err
	}

	if cfg.Env != "production" {
		if err := db.RunMigrations(database.DB); err != nil {
			_ = database.Close()
			return err
		}
	}

	userRepo := repositories.NewUserRepository(database)
	refreshRepo := repositories.NewRefreshTokenRepository(database)
	tokenService := services.NewTokenService(cfg.JWTSecret)
	authService := services.NewAuthService(
		userRepo,
		refreshRepo,
		tokenService,
		cfg.AccessTokenExpiry,
		cfg.RefreshTokenExpiry,
	)

	if err := authService.SeedInitialAdmin(
		ctx,
		cfg.InitialAdminUsername,
		cfg.InitialAdminPassword,
		cfg.InitialAdminRole,
	); err != nil {
		_ = database.Close()
		return fmt.Errorf("seed initial admin: %w", err)
	}

	a.db = database
	a.authHandler = handlers.NewAuthHandler(authService)
	return nil
}

func (a *App) Login(request handlers.LoginRequest) (*handlers.LoginResponse, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.authHandler.Login(ctx, request)
}

func (a *App) Logout(request handlers.LogoutRequest) error {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.authHandler.Logout(ctx, request)
}

func (a *App) GetMe(accessToken string) (*handlers.GetMeResponse, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.authHandler.GetMe(ctx, accessToken)
}
