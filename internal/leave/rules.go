package leave

import (
	"fmt"
	"strings"
	"time"
)

func ParseISODate(value string) (time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, fmt.Errorf("%w: date is required", ErrValidation)
	}

	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return time.Time{}, fmt.Errorf("%w: date must be YYYY-MM-DD", ErrValidation)
	}

	return parsed, nil
}

func CalculateWorkingDays(startDate, endDate time.Time) ([]time.Time, float64, error) {
	if endDate.Before(startDate) {
		return nil, 0, fmt.Errorf("%w: end date must be on/after start date", ErrValidation)
	}

	workingDates := make([]time.Time, 0)
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		if d.Weekday() == time.Saturday || d.Weekday() == time.Sunday {
			continue
		}

		workingDates = append(workingDates, d)
	}

	if len(workingDates) == 0 {
		return nil, 0, fmt.Errorf("%w: selected range has no working days", ErrValidation)
	}

	return workingDates, float64(len(workingDates)), nil
}

func DatesOverlap(aStart, aEnd, bStart, bEnd time.Time) bool {
	if aEnd.Before(aStart) || bEnd.Before(bStart) {
		return false
	}

	return !aEnd.Before(bStart) && !bEnd.Before(aStart)
}

func ContainsDate(days []time.Time, target time.Time) bool {
	for _, day := range days {
		if day.Equal(target) {
			return true
		}
	}

	return false
}

func CanTransitionStatus(currentStatus, nextStatus string, actorIsAdminOrHR, isSelf bool) bool {
	switch {
	case currentStatus == StatusPending && nextStatus == StatusApproved:
		return actorIsAdminOrHR
	case currentStatus == StatusPending && nextStatus == StatusRejected:
		return actorIsAdminOrHR
	case currentStatus == StatusPending && nextStatus == StatusCancelled:
		return actorIsAdminOrHR || isSelf
	case currentStatus == StatusApproved && nextStatus == StatusCancelled:
		return actorIsAdminOrHR
	default:
		return false
	}
}
