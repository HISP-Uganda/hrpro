package settings

import (
	"context"
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var logoFilenameSanitizer = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

type LogoStore interface {
	SaveLogo(ctx context.Context, filename string, data []byte) (string, error)
	ReadLogo(ctx context.Context, logoPath string) (*CompanyLogo, error)
}

type LocalLogoStore struct {
	rootDir string
}

func NewLocalLogoStore(rootDir string) (*LocalLogoStore, error) {
	trimmed := strings.TrimSpace(rootDir)
	if trimmed == "" {
		return nil, fmt.Errorf("logo store root directory is required")
	}
	if err := os.MkdirAll(trimmed, 0o755); err != nil {
		return nil, fmt.Errorf("create logo store directory: %w", err)
	}
	return &LocalLogoStore{rootDir: trimmed}, nil
}

func (s *LocalLogoStore) SaveLogo(_ context.Context, filename string, data []byte) (string, error) {
	safeName := sanitizeLogoFilename(filename)
	if safeName == "" {
		safeName = "logo.bin"
	}
	storedName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), safeName)
	fullPath := filepath.Join(s.rootDir, storedName)
	if err := os.WriteFile(fullPath, data, 0o600); err != nil {
		return "", fmt.Errorf("save logo file: %w", err)
	}
	return storedName, nil
}

func (s *LocalLogoStore) ReadLogo(_ context.Context, logoPath string) (*CompanyLogo, error) {
	safePath := filepath.Base(strings.TrimSpace(logoPath))
	if safePath == "" || safePath == "." || safePath == string(filepath.Separator) {
		return nil, ErrNotFound
	}

	fullPath := filepath.Join(s.rootDir, safePath)
	data, err := os.ReadFile(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("read logo file: %w", err)
	}

	mimeType := mime.TypeByExtension(strings.ToLower(filepath.Ext(safePath)))
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return &CompanyLogo{Filename: safePath, MimeType: mimeType, Data: data}, nil
}

func sanitizeLogoFilename(filename string) string {
	base := filepath.Base(strings.TrimSpace(filename))
	base = logoFilenameSanitizer.ReplaceAllString(base, "_")
	base = strings.Trim(base, "._-")
	if base == "" {
		return ""
	}
	if len(base) > 120 {
		base = base[:120]
	}
	return base
}
