package payroll

import "errors"

var (
	ErrValidation        = errors.New("validation failed")
	ErrForbidden         = errors.New("forbidden")
	ErrNotFound          = errors.New("record not found")
	ErrDuplicateMonth    = errors.New("payroll batch already exists for month")
	ErrInvalidTransition = errors.New("invalid payroll status transition")
	ErrImmutableBatch    = errors.New("batch is immutable")
	ErrExportNotAllowed  = errors.New("export allowed only for approved or locked batches")
)
