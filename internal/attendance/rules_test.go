package attendance

import "testing"

func TestValidateStatus(t *testing.T) {
	valid := []string{"present", "late", "field", "absent", "leave"}
	for _, status := range valid {
		if _, err := ValidateStatus(status); err != nil {
			t.Fatalf("expected %s to be valid, got error %v", status, err)
		}
	}

	if _, err := ValidateStatus("missing"); err == nil {
		t.Fatal("expected invalid status error")
	}
}

func TestCanEditLocked(t *testing.T) {
	if CanEditLocked(true, "HR Officer") {
		t.Fatal("expected HR Officer to be blocked for locked record")
	}
	if !CanEditLocked(true, "Admin") {
		t.Fatal("expected Admin to override locked record")
	}
	if !CanEditLocked(false, "Viewer") {
		t.Fatal("expected unlocked record to be editable")
	}
}
