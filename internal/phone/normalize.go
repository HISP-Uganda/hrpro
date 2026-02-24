package phone

import (
	"fmt"
	"strings"

	"github.com/nyaruka/phonenumbers"
)

func NormalizePhone(input string, defaultISO2 string) (string, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "", fmt.Errorf("phone is required")
	}

	region := strings.ToUpper(strings.TrimSpace(defaultISO2))
	if strings.HasPrefix(trimmed, "+") {
		region = ""
	}

	parsed, err := phonenumbers.Parse(trimmed, region)
	if err != nil {
		return "", fmt.Errorf("phone is invalid")
	}
	if !phonenumbers.IsValidNumber(parsed) {
		return "", fmt.Errorf("phone is invalid")
	}
	return phonenumbers.Format(parsed, phonenumbers.E164), nil
}
