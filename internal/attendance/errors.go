package attendance

import "errors"

var (
	ErrValidation       = errors.New("validation failed")
	ErrNotFound         = errors.New("record not found")
	ErrForbidden        = errors.New("forbidden")
	ErrLocked           = errors.New("attendance record is locked")
	ErrNotAbsent        = errors.New("attendance status must be absent")
	ErrLeaveIntegration = errors.New("leave integration failed")
)
