package phone

import "testing"

func TestNormalizePhoneNational(t *testing.T) {
	got, err := NormalizePhone("0701234567", "UG")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got != "+256701234567" {
		t.Fatalf("expected +256701234567, got %s", got)
	}
}

func TestNormalizePhoneInternational(t *testing.T) {
	got, err := NormalizePhone("+256701234567", "UG")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if got != "+256701234567" {
		t.Fatalf("expected +256701234567, got %s", got)
	}
}

func TestNormalizePhoneInvalid(t *testing.T) {
	if _, err := NormalizePhone("bad-phone", "UG"); err == nil {
		t.Fatalf("expected error")
	}
}
