package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Env                  string
	DBConnectionString   string
	JWTSecret            string
	AccessTokenExpiry    time.Duration
	RefreshTokenExpiry   time.Duration
	InitialAdminUsername string
	InitialAdminPassword string
	InitialAdminRole     string
}

func Load() (Config, error) {
	accessMinutes, err := readIntEnv("APP_ACCESS_TOKEN_EXPIRY_MINUTES", 15)
	if err != nil {
		return Config{}, err
	}

	refreshHours, err := readIntEnv("APP_REFRESH_TOKEN_EXPIRY_HOURS", 168)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		Env:                  readStringEnv("APP_ENV", "development"),
		DBConnectionString:   os.Getenv("APP_DB_CONNECTION_STRING"),
		JWTSecret:            os.Getenv("APP_JWT_SECRET"),
		AccessTokenExpiry:    time.Duration(accessMinutes) * time.Minute,
		RefreshTokenExpiry:   time.Duration(refreshHours) * time.Hour,
		InitialAdminUsername: os.Getenv("APP_INITIAL_ADMIN_USERNAME"),
		InitialAdminPassword: os.Getenv("APP_INITIAL_ADMIN_PASSWORD"),
		InitialAdminRole:     readStringEnv("APP_INITIAL_ADMIN_ROLE", "Admin"),
	}

	if cfg.DBConnectionString == "" {
		return Config{}, fmt.Errorf("APP_DB_CONNECTION_STRING is required")
	}

	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("APP_JWT_SECRET is required")
	}

	return cfg, nil
}

func readIntEnv(key string, fallback int) (int, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("invalid %s: %w", key, err)
	}

	if parsed <= 0 {
		return 0, fmt.Errorf("%s must be positive", key)
	}

	return parsed, nil
}

func readStringEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
