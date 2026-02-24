package config

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const (
	appConfigDirName  = "hrpro"
	appConfigFileName = "config.json"
)

type DatabaseConnectionParams struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Database string `json:"database"`
	User     string `json:"user"`
	Password string `json:"password"`
	SSLMode  string `json:"sslmode"`
}

type LocalConfig struct {
	Database  *DatabaseConnectionParams `json:"database,omitempty"`
	JWTSecret string                    `json:"jwtSecret,omitempty"`
}

func (p DatabaseConnectionParams) Validate() error {
	if strings.TrimSpace(p.Host) == "" {
		return fmt.Errorf("host is required")
	}
	if p.Port <= 0 || p.Port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535")
	}
	if strings.TrimSpace(p.Database) == "" {
		return fmt.Errorf("database is required")
	}
	if strings.TrimSpace(p.User) == "" {
		return fmt.Errorf("user is required")
	}
	if strings.TrimSpace(p.SSLMode) == "" {
		return fmt.Errorf("sslmode is required")
	}
	return nil
}

func (p DatabaseConnectionParams) ConnectionString() string {
	query := url.Values{}
	query.Set("sslmode", strings.TrimSpace(p.SSLMode))

	u := &url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(strings.TrimSpace(p.User), p.Password),
		Host:     fmt.Sprintf("%s:%d", strings.TrimSpace(p.Host), p.Port),
		Path:     "/" + strings.TrimSpace(p.Database),
		RawQuery: query.Encode(),
	}

	return u.String()
}

func ResolveLocalConfigPath() (string, error) {
	baseDir := strings.TrimSpace(os.Getenv("APP_CONFIG_DIR"))
	if baseDir == "" {
		var err error
		baseDir, err = os.UserConfigDir()
		if err != nil {
			return "", fmt.Errorf("resolve user config dir: %w", err)
		}
	}

	return filepath.Join(baseDir, appConfigDirName, appConfigFileName), nil
}

func LoadLocalConfig() (LocalConfig, error) {
	path, err := ResolveLocalConfigPath()
	if err != nil {
		return LocalConfig{}, err
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		return LocalConfig{}, err
	}

	var cfg LocalConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return LocalConfig{}, fmt.Errorf("parse %s: %w", path, err)
	}

	if cfg.Database != nil {
		if err := cfg.Database.Validate(); err != nil {
			return LocalConfig{}, fmt.Errorf("invalid database config: %w", err)
		}
	}

	return cfg, nil
}

func SaveLocalConfig(cfg LocalConfig) error {
	if cfg.Database != nil {
		if err := cfg.Database.Validate(); err != nil {
			return err
		}
	}
	path, err := ResolveLocalConfigPath()
	if err != nil {
		return err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return fmt.Errorf("create config directory: %w", err)
	}
	if err := os.Chmod(dir, 0o700); err != nil {
		return fmt.Errorf("chmod config directory: %w", err)
	}

	raw, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal config: %w", err)
	}

	tmpPath := path + ".tmp"
	file, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o600)
	if err != nil {
		return fmt.Errorf("open temp config: %w", err)
	}

	if _, err := file.Write(raw); err != nil {
		_ = file.Close()
		return fmt.Errorf("write temp config: %w", err)
	}

	_ = file.Sync()

	if err := file.Close(); err != nil {
		return fmt.Errorf("write temp config: %w", err)
	}

	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("replace config: %w", err)
	}
	_ = syncDirectory(dir)

	if err := os.Chmod(path, 0o600); err != nil {
		return fmt.Errorf("chmod config: %w", err)
	}

	return nil
}

func syncDirectory(dir string) error {
	directory, err := os.Open(dir)
	if err != nil {
		return err
	}
	defer func() {
		_ = directory.Close()
	}()
	return directory.Sync()
}

func LoadLocalDatabaseConfig() (DatabaseConnectionParams, error) {
	cfg, err := LoadLocalConfig()
	if err != nil {
		return DatabaseConnectionParams{}, err
	}
	if cfg.Database == nil {
		return DatabaseConnectionParams{}, os.ErrNotExist
	}
	return *cfg.Database, nil
}

func SaveLocalDatabaseConfig(params DatabaseConnectionParams) error {
	if err := params.Validate(); err != nil {
		return err
	}

	cfg, err := LoadLocalConfig()
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("load existing config: %w", err)
	}
	if os.IsNotExist(err) {
		cfg = LocalConfig{}
	}

	paramsCopy := params
	cfg.Database = &paramsCopy

	return SaveLocalConfig(cfg)
}

func ResolveJWTSecret() (string, error) {
	secret := strings.TrimSpace(os.Getenv("APP_JWT_SECRET"))
	if secret != "" {
		return secret, nil
	}

	cfg, err := LoadLocalConfig()
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}

	return strings.TrimSpace(cfg.JWTSecret), nil
}

func EnsureJWTSecret() (string, error) {
	if secret := strings.TrimSpace(os.Getenv("APP_JWT_SECRET")); secret != "" {
		return secret, nil
	}

	cfg, err := LoadLocalConfig()
	if err != nil && !os.IsNotExist(err) {
		return "", err
	}
	if os.IsNotExist(err) {
		cfg = LocalConfig{}
	}

	if existing := strings.TrimSpace(cfg.JWTSecret); existing != "" {
		return existing, nil
	}

	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", fmt.Errorf("generate jwt secret: %w", err)
	}

	generated := base64.StdEncoding.EncodeToString(randomBytes)
	cfg.JWTSecret = generated

	if err := SaveLocalConfig(cfg); err != nil {
		return "", fmt.Errorf("persist jwt secret: %w", err)
	}

	return generated, nil
}

func ParsePort(value string) (int, error) {
	port, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return 0, fmt.Errorf("invalid port: %w", err)
	}
	return port, nil
}
