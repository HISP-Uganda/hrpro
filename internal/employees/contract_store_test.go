package employees

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLocalContractStoreSaveAndDelete(t *testing.T) {
	store, err := NewLocalContractStore(t.TempDir())
	if err != nil {
		t.Fatalf("create store: %v", err)
	}

	relative, err := store.SaveContract(context.Background(), 42, ".pdf", []byte("dummy"))
	if err != nil {
		t.Fatalf("save contract: %v", err)
	}
	if !strings.HasPrefix(relative, "employees/42/contract/") {
		t.Fatalf("unexpected relative path: %s", relative)
	}

	fullPath := filepath.Join(store.rootDir, filepath.FromSlash(relative))
	if _, err := os.Stat(fullPath); err != nil {
		t.Fatalf("expected file to exist: %v", err)
	}

	if err := store.DeleteContract(context.Background(), relative); err != nil {
		t.Fatalf("delete contract: %v", err)
	}
	if _, err := os.Stat(fullPath); !os.IsNotExist(err) {
		t.Fatalf("expected file removed, err=%v", err)
	}
}
