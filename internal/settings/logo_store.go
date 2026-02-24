package settings

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var logoFilenameSanitizer = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

type LogoStore interface {
	SaveLogo(ctx context.Context, extension string, data []byte) (string, error)
	ReadLogo(ctx context.Context, logoPath string) (*CompanyLogo, error)
	DeleteLogo(ctx context.Context, logoPath string) error
}

type LocalLogoStore struct {
	rootDir     string
	brandingDir string
}

func NewLocalLogoStore(rootDir string) (*LocalLogoStore, error) {
	trimmed := strings.TrimSpace(rootDir)
	if trimmed == "" {
		return nil, fmt.Errorf("logo store root directory is required")
	}
	brandingDir := filepath.Join(trimmed, "branding")
	if err := os.MkdirAll(brandingDir, 0o700); err != nil {
		return nil, fmt.Errorf("create logo store directory: %w", err)
	}
	return &LocalLogoStore{rootDir: trimmed, brandingDir: brandingDir}, nil
}

func (s *LocalLogoStore) SaveLogo(_ context.Context, extension string, data []byte) (string, error) {
	ext := sanitizeLogoExtension(extension)
	if ext == "" {
		ext = ".bin"
	}
	token, err := randomToken(8)
	if err != nil {
		return "", fmt.Errorf("generate logo token: %w", err)
	}
	storedName := fmt.Sprintf("logo_%s%s", token, ext)
	fullPath := filepath.Join(s.brandingDir, storedName)
	if err := os.WriteFile(fullPath, data, 0o600); err != nil {
		return "", fmt.Errorf("save logo file: %w", err)
	}
	return filepath.ToSlash(filepath.Join("branding", storedName)), nil
}

func (s *LocalLogoStore) ReadLogo(_ context.Context, logoPath string) (*CompanyLogo, error) {
	fullPath, safePath, err := s.resolveLogoPath(logoPath)
	if err != nil {
		return nil, ErrNotFound
	}
	data, err := os.ReadFile(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("read logo file: %w", err)
	}

	mimeType := http.DetectContentType(data)

	return &CompanyLogo{Filename: safePath, MimeType: mimeType, Data: data}, nil
}

func (s *LocalLogoStore) DeleteLogo(_ context.Context, logoPath string) error {
	fullPath, _, err := s.resolveLogoPath(logoPath)
	if err != nil {
		return nil
	}
	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete logo file: %w", err)
	}
	return nil
}

func (s *LocalLogoStore) resolveLogoPath(logoPath string) (string, string, error) {
	trimmed := strings.TrimSpace(logoPath)
	if trimmed == "" {
		return "", "", ErrNotFound
	}
	clean := filepath.Clean(strings.ReplaceAll(trimmed, "\\", "/"))
	clean = strings.TrimPrefix(clean, "/")
	if !strings.HasPrefix(clean, "branding/") {
		return "", "", ErrNotFound
	}
	fullPath := filepath.Join(s.rootDir, filepath.FromSlash(clean))
	relative, err := filepath.Rel(s.rootDir, fullPath)
	if err != nil {
		return "", "", ErrNotFound
	}
	if strings.HasPrefix(relative, "..") {
		return "", "", ErrNotFound
	}
	return fullPath, filepath.Base(fullPath), nil
}

func sanitizeLogoExtension(extension string) string {
	ext := strings.ToLower(strings.TrimSpace(extension))
	if ext == "" {
		return ""
	}
	if !strings.HasPrefix(ext, ".") {
		ext = "." + ext
	}
	ext = logoFilenameSanitizer.ReplaceAllString(ext, "")
	if len(ext) > 8 {
		ext = ext[:8]
	}
	if len(ext) <= 1 {
		return ""
	}
	return ext
}

func randomToken(byteLength int) (string, error) {
	raw := make([]byte, byteLength)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return hex.EncodeToString(raw), nil
}
