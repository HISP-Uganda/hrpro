package users

import "errors"

var (
	ErrValidation              = errors.New("validation failed")
	ErrNotFound                = errors.New("user not found")
	ErrDuplicateUsername       = errors.New("username already exists")
	ErrCannotDeactivateSelf    = errors.New("cannot deactivate own account")
	ErrCannotRemoveOwnAdmin    = errors.New("cannot remove own admin role")
)
