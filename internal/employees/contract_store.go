package employees

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type ContractStore interface {
	SaveContract(ctx context.Context, employeeID int64, extension string, data []byte) (string, error)
	DeleteContract(ctx context.Context, relativePath string) error
}

type LocalContractStore struct {
	rootDir string
}

func NewLocalContractStore(rootDir string) (*LocalContractStore, error) {
	trimmed := strings.TrimSpace(rootDir)
	if trimmed == "" {
		return nil, fmt.Errorf("contract store root dir is required")
	}

	absRoot, err := filepath.Abs(trimmed)
	if err != nil {
		return nil, fmt.Errorf("resolve contract store root dir: %w", err)
	}

	if err := os.MkdirAll(absRoot, 0o700); err != nil {
		return nil, fmt.Errorf("create contract store root dir: %w", err)
	}

	return &LocalContractStore{rootDir: absRoot}, nil
}

func (s *LocalContractStore) SaveContract(_ context.Context, employeeID int64, extension string, data []byte) (string, error) {
	if employeeID <= 0 {
		return "", fmt.Errorf("employee id must be positive")
	}
	if len(data) == 0 {
		return "", fmt.Errorf("contract file is required")
	}

	ext := normalizeContractExtension(extension)
	if ext == "" {
		return "", fmt.Errorf("invalid contract extension")
	}

	dirPath := filepath.Join(s.rootDir, "employees", fmt.Sprintf("%d", employeeID), "contract")
	if err := os.MkdirAll(dirPath, 0o700); err != nil {
		return "", fmt.Errorf("create contract directory: %w", err)
	}

	filename := fmt.Sprintf("%d-%s%s", time.Now().UTC().UnixNano(), randomSuffix(8), ext)
	filePath := filepath.Join(dirPath, filename)
	if err := os.WriteFile(filePath, data, 0o600); err != nil {
		return "", fmt.Errorf("write contract file: %w", err)
	}

	relative, err := filepath.Rel(s.rootDir, filePath)
	if err != nil {
		return "", fmt.Errorf("resolve relative contract path: %w", err)
	}
	normalized := filepath.ToSlash(relative)
	if strings.HasPrefix(normalized, "../") || normalized == ".." {
		return "", fmt.Errorf("invalid relative contract path")
	}
	return normalized, nil
}

func (s *LocalContractStore) DeleteContract(_ context.Context, relativePath string) error {
	trimmed := strings.TrimSpace(relativePath)
	if trimmed == "" {
		return nil
	}

	clean := filepath.Clean(filepath.FromSlash(trimmed))
	fullPath := filepath.Join(s.rootDir, clean)
	if !strings.HasPrefix(fullPath, s.rootDir+string(os.PathSeparator)) && fullPath != s.rootDir {
		return fmt.Errorf("invalid contract path")
	}

	if err := os.Remove(fullPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete contract file: %w", err)
	}
	return nil
}

func normalizeContractExtension(value string) string {
	trimmed := strings.ToLower(strings.TrimSpace(value))
	if trimmed == "" {
		return ""
	}
	if !strings.HasPrefix(trimmed, ".") {
		trimmed = "." + trimmed
	}
	switch trimmed {
	case ".pdf", ".doc", ".docx":
		return trimmed
	default:
		return ""
	}
}

func randomSuffix(length int) string {
	if length <= 0 {
		return "x"
	}
	buf := make([]byte, (length+1)/2)
	if _, err := rand.Read(buf); err != nil {
		return "x"
	}
	value := hex.EncodeToString(buf)
	if len(value) < length {
		return value
	}
	return value[:length]
}
