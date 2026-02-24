package phone

import "testing"

func TestValidateAndNormalizePhoneNational(t *testing.T) {
	got, err := ValidateAndNormalizePhone("0701234567", "UG", "+256")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got != "+256701234567" {
		t.Fatalf("expected +256701234567, got %s", got)
	}
}

func TestValidateAndNormalizePhoneInternational(t *testing.T) {
	got, err := ValidateAndNormalizePhone("+256701234567", "UG", "+256")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got != "+256701234567" {
		t.Fatalf("expected +256701234567, got %s", got)
	}
}

func TestValidateAndNormalizePhoneInvalid(t *testing.T) {
	if _, err := ValidateAndNormalizePhone("bad-phone", "UG", "+256"); err == nil {
		t.Fatalf("expected error")
	}
}
