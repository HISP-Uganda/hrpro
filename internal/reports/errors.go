package reports

import "errors"

var (
	ErrValidation          = errors.New("validation failed")
	ErrAccessDenied        = errors.New("access denied")
	ErrExportLimitExceeded = errors.New("export limit exceeded")
)
