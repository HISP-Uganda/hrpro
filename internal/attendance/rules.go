package attendance

import (
	"fmt"
	"strings"
	"time"

	"hrpro/internal/middleware"
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

func NormalizeStatus(status string) string {
	return strings.TrimSpace(strings.ToLower(status))
}

func IsValidStatus(status string) bool {
	switch NormalizeStatus(status) {
	case StatusPresent, StatusLate, StatusField, StatusAbsent, StatusLeave:
		return true
	default:
		return false
	}
}

func ValidateStatus(status string) (string, error) {
	normalized := NormalizeStatus(status)
	if !IsValidStatus(normalized) {
		return "", fmt.Errorf("%w: status must be present|late|field|absent|leave", ErrValidation)
	}
	return normalized, nil
}

func CanOverrideLocked(role string) bool {
	normalized := middleware.NormalizeRole(role)
	return normalized == "master_admin" || normalized == "admin"
}

func CanEditLocked(isLocked bool, role string) bool {
	if !isLocked {
		return true
	}
	return CanOverrideLocked(role)
}

func CanReadAll(role string) bool {
	normalized := middleware.NormalizeRole(role)
	return normalized == "admin" || normalized == "master_admin" || normalized == "hr_officer" || normalized == "finance_officer" || normalized == "viewer"
}

func CanMarkAttendance(role string) bool {
	normalized := middleware.NormalizeRole(role)
	return normalized == "admin" || normalized == "master_admin" || normalized == "hr_officer"
}

func CanPostAbsentToLeave(role string) bool {
	return CanMarkAttendance(role)
}

func CanUpdateLunchVisitors(role string) bool {
	return CanMarkAttendance(role)
}

func CalculateLunchTotals(staffPresentCount, staffFieldCount, visitorsCount, plateCostAmount, staffContributionAmount int) LunchSummary {
	totalPlates := staffPresentCount + visitorsCount
	totalCost := totalPlates * plateCostAmount
	staffContributionTotal := staffPresentCount * staffContributionAmount
	organizationBalance := totalCost - staffContributionTotal

	return LunchSummary{
		StaffPresentCount:       staffPresentCount,
		StaffFieldCount:         staffFieldCount,
		VisitorsCount:           visitorsCount,
		TotalPlates:             totalPlates,
		PlateCostAmount:         plateCostAmount,
		TotalCostAmount:         totalCost,
		StaffContributionAmount: staffContributionAmount,
		StaffContributionTotal:  staffContributionTotal,
		OrganizationBalance:     organizationBalance,
	}
}
