package leave

import (
	"errors"
	"testing"
	"time"
)

func TestCalculateWorkingDaysExcludesWeekends(t *testing.T) {
	start := time.Date(2026, time.February, 20, 0, 0, 0, 0, time.UTC) // Friday
	end := time.Date(2026, time.February, 24, 0, 0, 0, 0, time.UTC)   // Tuesday

	_, days, err := CalculateWorkingDays(start, end)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if days != 3 {
		t.Fatalf("expected 3 working days, got %.2f", days)
	}
}

func TestCalculateWorkingDaysRejectsInvalidRange(t *testing.T) {
	start := time.Date(2026, time.February, 24, 0, 0, 0, 0, time.UTC)
	end := time.Date(2026, time.February, 20, 0, 0, 0, 0, time.UTC)

	_, _, err := CalculateWorkingDays(start, end)
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestCalculateWorkingDaysSameDayWeekday(t *testing.T) {
	date := time.Date(2026, time.February, 23, 0, 0, 0, 0, time.UTC) // Monday

	_, days, err := CalculateWorkingDays(date, date)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if days != 1 {
		t.Fatalf("expected 1 working day, got %.2f", days)
	}
}
