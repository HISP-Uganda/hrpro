package payroll

import "testing"

func TestCalculateTotals(t *testing.T) {
	gross, net := CalculateTotals(1200, 250, 100, 50)

	if gross != 1450 {
		t.Fatalf("expected gross 1450, got %.2f", gross)
	}
	if net != 1300 {
		t.Fatalf("expected net 1300, got %.2f", net)
	}
}
