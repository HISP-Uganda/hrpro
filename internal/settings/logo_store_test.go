package settings

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestNewLocalLogoStoreCreatesBrandingPath(t *testing.T) {
	root := filepath.Join(t.TempDir(), "hrpro")
	store, err := NewLocalLogoStore(root)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if store.rootDir != root {
		t.Fatalf("unexpected root dir: %q", store.rootDir)
	}
	brandingDir := filepath.Join(root, "branding")
	info, err := os.Stat(brandingDir)
	if err != nil {
		t.Fatalf("expected branding dir, got %v", err)
	}
	if !info.IsDir() {
		t.Fatalf("expected branding path to be a directory")
	}
}

func TestLocalLogoStoreUsesBrandingRelativePath(t *testing.T) {
	store, err := NewLocalLogoStore(t.TempDir())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	logoPath, err := store.SaveLogo(context.Background(), ".png", []byte{137, 80, 78, 71, 13, 10, 26, 10, 0})
	if err != nil {
		t.Fatalf("save logo: %v", err)
	}
	if filepath.IsAbs(logoPath) {
		t.Fatalf("expected relative path, got %q", logoPath)
	}
	if filepath.Dir(filepath.FromSlash(logoPath)) != "branding" {
		t.Fatalf("expected branding relative path, got %q", logoPath)
	}
}

func TestLocalLogoStoreRejectsTraversalRead(t *testing.T) {
	store, err := NewLocalLogoStore(t.TempDir())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	_, err = store.ReadLogo(context.Background(), "../secret.txt")
	if err == nil {
		t.Fatalf("expected not found error")
	}
}
