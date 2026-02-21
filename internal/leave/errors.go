package leave

import "errors"

var (
	ErrValidation          = errors.New("validation failed")
	ErrNotFound            = errors.New("record not found")
	ErrForbidden           = errors.New("forbidden")
	ErrLockedDateConflict  = errors.New("requested dates include locked date")
	ErrOverlapApproved     = errors.New("requested dates overlap approved leave")
	ErrInsufficientBalance = errors.New("insufficient leave balance")
	ErrInvalidTransition   = errors.New("invalid status transition")
)
