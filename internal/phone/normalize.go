package phone

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	e164Pattern        = regexp.MustCompile(`^\+[1-9][0-9]{6,14}$`)
	nonDigitPattern    = regexp.MustCompile(`[^0-9]`)
	callingCodePattern = regexp.MustCompile(`^\+[1-9][0-9]{0,3}$`)
)

func ValidateAndNormalizePhone(input string, defaultISO2 string, defaultCallingCode string) (string, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "", fmt.Errorf("phone is required")
	}

	if strings.HasPrefix(trimmed, "+") {
		candidate := "+" + nonDigitPattern.ReplaceAllString(strings.TrimPrefix(trimmed, "+"), "")
		if !e164Pattern.MatchString(candidate) {
			return "", fmt.Errorf("phone is invalid")
		}
		return candidate, nil
	}

	digits := nonDigitPattern.ReplaceAllString(trimmed, "")
	if strings.HasPrefix(digits, "00") && len(digits) > 2 {
		candidate := "+" + strings.TrimPrefix(digits, "00")
		if !e164Pattern.MatchString(candidate) {
			return "", fmt.Errorf("phone is invalid")
		}
		return candidate, nil
	}

	callingCode := normalizeCallingCode(defaultCallingCode)
	if callingCode == "" {
		callingCode = inferCallingCodeFromISO2(defaultISO2)
	}
	if callingCode == "" {
		return "", fmt.Errorf("default country calling code is not configured")
	}

	for strings.HasPrefix(digits, "0") && len(digits) > 1 {
		digits = strings.TrimPrefix(digits, "0")
	}
	candidate := callingCode + digits
	if !e164Pattern.MatchString(candidate) {
		return "", fmt.Errorf("phone is invalid")
	}
	return candidate, nil
}

func normalizeCallingCode(value string) string {
	trimmed := strings.TrimSpace(value)
	if !strings.HasPrefix(trimmed, "+") {
		trimmed = "+" + nonDigitPattern.ReplaceAllString(trimmed, "")
	}
	if !callingCodePattern.MatchString(trimmed) {
		return ""
	}
	return trimmed
}

func inferCallingCodeFromISO2(value string) string {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "UG":
		return "+256"
	case "TZ":
		return "+255"
	case "KE":
		return "+254"
	case "RW":
		return "+250"
	case "BI":
		return "+257"
	case "US":
		return "+1"
	default:
		return ""
	}
}
