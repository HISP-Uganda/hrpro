package config

import (
	"os"
	"strings"
	"testing"
)

func TestLoadPrefersEnvConnectionStringOverLocalConfig(t *testing.T) {
	t.Setenv("APP_JWT_SECRET", "env-secret")
	t.Setenv("APP_DB_CONNECTION_STRING", "postgres://env-user:env-pass@env-host:5432/env-db?sslmode=require")
	t.Setenv("APP_CONFIG_DIR", t.TempDir())

	if err := SaveLocalDatabaseConfig(DatabaseConnectionParams{
		Host:     "file-host",
		Port:     5432,
		Database: "file-db",
		User:     "file-user",
		Password: "file-pass",
		SSLMode:  "disable",
	}); err != nil {
		t.Fatalf("SaveLocalDatabaseConfig() error = %v", err)
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	want := "postgres://env-user:env-pass@env-host:5432/env-db?sslmode=require"
	if cfg.DBConnectionString != want {
		t.Fatalf("DBConnectionString = %q, want %q", cfg.DBConnectionString, want)
	}
}

func TestLoadUsesLocalConfigWhenEnvConnectionStringMissing(t *testing.T) {
	t.Setenv("APP_JWT_SECRET", "env-secret")
	t.Setenv("APP_DB_CONNECTION_STRING", "")
	t.Setenv("APP_CONFIG_DIR", t.TempDir())

	input := DatabaseConnectionParams{
		Host:     "127.0.0.1",
		Port:     5432,
		Database: "hrpro",
		User:     "postgres",
		Password: "super-secret",
		SSLMode:  "disable",
	}

	if err := SaveLocalDatabaseConfig(input); err != nil {
		t.Fatalf("SaveLocalDatabaseConfig() error = %v", err)
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	want := input.ConnectionString()
	if cfg.DBConnectionString != want {
		t.Fatalf("DBConnectionString = %q, want %q", cfg.DBConnectionString, want)
	}
}

func TestJWTSecretPrecedenceEnvOverFile(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())
	t.Setenv("APP_DB_CONNECTION_STRING", "")
	t.Setenv("APP_JWT_SECRET", "env-secret")

	if err := SaveLocalConfig(LocalConfig{
		JWTSecret: "file-secret",
	}); err != nil {
		t.Fatalf("SaveLocalConfig() error = %v", err)
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.JWTSecret != "env-secret" {
		t.Fatalf("JWTSecret = %q, want env-secret", cfg.JWTSecret)
	}
}

func TestJWTSecretUsesFileWhenEnvMissing(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())
	t.Setenv("APP_DB_CONNECTION_STRING", "")
	t.Setenv("APP_JWT_SECRET", "")

	if err := SaveLocalConfig(LocalConfig{
		JWTSecret: "file-secret",
	}); err != nil {
		t.Fatalf("SaveLocalConfig() error = %v", err)
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.JWTSecret != "file-secret" {
		t.Fatalf("JWTSecret = %q, want file-secret", cfg.JWTSecret)
	}
}

func TestEnsureJWTSecretGeneratesAndPersists(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())
	t.Setenv("APP_JWT_SECRET", "")

	first, err := EnsureJWTSecret()
	if err != nil {
		t.Fatalf("EnsureJWTSecret() error = %v", err)
	}
	if len(strings.TrimSpace(first)) < 32 {
		t.Fatalf("generated JWT secret too short")
	}

	cfg, err := LoadLocalConfig()
	if err != nil {
		t.Fatalf("LoadLocalConfig() error = %v", err)
	}
	if strings.TrimSpace(cfg.JWTSecret) == "" {
		t.Fatalf("expected persisted jwt secret")
	}
	if cfg.JWTSecret != first {
		t.Fatalf("persisted secret mismatch")
	}
}

func TestEnsureJWTSecretReusesPersistedOnRestart(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())
	t.Setenv("APP_JWT_SECRET", "")

	first, err := EnsureJWTSecret()
	if err != nil {
		t.Fatalf("EnsureJWTSecret() error = %v", err)
	}

	second, err := EnsureJWTSecret()
	if err != nil {
		t.Fatalf("EnsureJWTSecret() second call error = %v", err)
	}

	if first != second {
		t.Fatalf("secret changed between calls")
	}
}

func TestSaveLocalDatabaseConfigWritesRestrictedPermissionsAndReloads(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())

	input := DatabaseConnectionParams{
		Host:     "localhost",
		Port:     5432,
		Database: "hrpro",
		User:     "postgres",
		Password: "postgres",
		SSLMode:  "disable",
	}
	if err := SaveLocalDatabaseConfig(input); err != nil {
		t.Fatalf("SaveLocalDatabaseConfig() error = %v", err)
	}

	path, err := ResolveLocalConfigPath()
	if err != nil {
		t.Fatalf("ResolveLocalConfigPath() error = %v", err)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("stat config path: %v", err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("file permissions = %#o, want %#o", got, 0o600)
	}

	loaded, err := LoadLocalDatabaseConfig()
	if err != nil {
		t.Fatalf("LoadLocalDatabaseConfig() error = %v", err)
	}
	if loaded.ConnectionString() != input.ConnectionString() {
		t.Fatalf("reloaded DB config mismatch")
	}

	if _, err := os.Stat(path + ".tmp"); !os.IsNotExist(err) {
		t.Fatalf("expected no lingering temp file")
	}
}

func TestEvaluateStartupHealthGeneratesRuntimeSecretWhenMissing(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())
	t.Setenv("APP_DB_CONNECTION_STRING", "postgres://u:p@localhost:5432/hrpro?sslmode=disable")
	t.Setenv("APP_JWT_SECRET", "")

	health := EvaluateStartupHealth()
	if !health.DBOk {
		t.Fatalf("expected dbOk true")
	}
	if !health.RuntimeOK {
		t.Fatalf("expected runtimeOk true, got runtimeError=%q", health.RuntimeError)
	}

	cfg, err := LoadLocalConfig()
	if err != nil {
		t.Fatalf("LoadLocalConfig() error = %v", err)
	}
	if strings.TrimSpace(cfg.JWTSecret) == "" {
		t.Fatalf("expected generated jwt secret to be persisted")
	}
}

func TestEvaluateStartupHealthUsesPersistedSecretWhenEnvMissing(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", t.TempDir())
	t.Setenv("APP_DB_CONNECTION_STRING", "postgres://u:p@localhost:5432/hrpro?sslmode=disable")
	t.Setenv("APP_JWT_SECRET", "")

	if err := SaveLocalConfig(LocalConfig{
		JWTSecret: "persisted-secret",
	}); err != nil {
		t.Fatalf("SaveLocalConfig() error = %v", err)
	}

	health := EvaluateStartupHealth()
	if !health.RuntimeOK {
		t.Fatalf("expected runtimeOk true, got runtimeError=%q", health.RuntimeError)
	}

	secret, err := ResolveJWTSecret()
	if err != nil {
		t.Fatalf("ResolveJWTSecret() error = %v", err)
	}
	if secret != "persisted-secret" {
		t.Fatalf("secret mismatch: %q", secret)
	}
}
