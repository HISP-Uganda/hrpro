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
		DBConnectionString:   readStringEnv("APP_DB_CONNECTION_STRING", ""),
		AccessTokenExpiry:    time.Duration(accessMinutes) * time.Minute,
		RefreshTokenExpiry:   time.Duration(refreshHours) * time.Hour,
		InitialAdminUsername: os.Getenv("APP_INITIAL_ADMIN_USERNAME"),
		InitialAdminPassword: os.Getenv("APP_INITIAL_ADMIN_PASSWORD"),
		InitialAdminRole:     readStringEnv("APP_INITIAL_ADMIN_ROLE", "Admin"),
	}

	if cfg.DBConnectionString == "" {
		localDB, err := LoadLocalDatabaseConfig()
		if err != nil && !os.IsNotExist(err) {
			return Config{}, fmt.Errorf("load local database config: %w", err)
		}
		if err == nil {
			cfg.DBConnectionString = localDB.ConnectionString()
		}
	}

	secret, err := EnsureJWTSecret()
	if err != nil {
		return Config{}, fmt.Errorf("resolve jwt secret: %w", err)
	}
	cfg.JWTSecret = secret

	return cfg, nil
}

type StartupHealth struct {
	DBOk         bool
	RuntimeOK    bool
	DBError      string
	RuntimeError string
}

func EvaluateStartupHealth() StartupHealth {
	health := StartupHealth{}

	dbConnectionString := readStringEnv("APP_DB_CONNECTION_STRING", "")
	if dbConnectionString != "" {
		health.DBOk = true
	} else {
		localDB, err := LoadLocalDatabaseConfig()
		if err != nil {
			if os.IsNotExist(err) {
				health.DBError = "database connection is not configured"
			} else {
				health.DBError = err.Error()
			}
		} else {
			health.DBOk = true
			dbConnectionString = localDB.ConnectionString()
		}
	}

	if dbConnectionString == "" && health.DBError == "" {
		health.DBError = "database connection is not configured"
	}

	if _, err := EnsureJWTSecret(); err != nil {
		health.RuntimeError = err.Error()
	} else {
		health.RuntimeOK = true
	}

	return health
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
