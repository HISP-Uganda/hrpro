package db

import (
	"strings"
	"testing"
)

func TestEmployeeEnhancementMigrationExists(t *testing.T) {
	content, err := migrationsFS.ReadFile("migrations/000013_add_employee_contract_phone_defaults.up.sql")
	if err != nil {
		t.Fatalf("expected migration file, got %v", err)
	}
	sql := string(content)
	required := []string{
		"job_description",
		"contract_url",
		"contract_file_path",
		"phone_e164",
	}
	for _, token := range required {
		if !strings.Contains(sql, token) {
			t.Fatalf("expected migration to contain %q", token)
		}
	}
}
