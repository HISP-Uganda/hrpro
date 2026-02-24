package settings

import "errors"

var (
	ErrValidation = errors.New("validation failed")
	ErrForbidden  = errors.New("forbidden")
	ErrNotFound   = errors.New("settings record not found")
)
