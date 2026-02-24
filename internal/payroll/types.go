package payroll

import "time"

const (
	StatusDraft    = "Draft"
	StatusApproved = "Approved"
	StatusLocked   = "Locked"
)

type PayrollBatch struct {
	ID         int64      `db:"id" json:"id"`
	Month      string     `db:"month" json:"month"`
	Status     string     `db:"status" json:"status"`
	CreatedBy  int64      `db:"created_by" json:"createdBy"`
	CreatedAt  time.Time  `db:"created_at" json:"createdAt"`
	ApprovedBy *int64     `db:"approved_by" json:"approvedBy,omitempty"`
	ApprovedAt *time.Time `db:"approved_at" json:"approvedAt,omitempty"`
	LockedAt   *time.Time `db:"locked_at" json:"lockedAt,omitempty"`
}

type PayrollEntry struct {
	ID              int64     `db:"id" json:"id"`
	BatchID         int64     `db:"batch_id" json:"batchId"`
	EmployeeID      int64     `db:"employee_id" json:"employeeId"`
	EmployeeName    string    `db:"employee_name" json:"employeeName"`
	BaseSalary      float64   `db:"base_salary" json:"baseSalary"`
	AllowancesTotal float64   `db:"allowances_total" json:"allowancesTotal"`
	DeductionsTotal float64   `db:"deductions_total" json:"deductionsTotal"`
	TaxTotal        float64   `db:"tax_total" json:"taxTotal"`
	GrossPay        float64   `db:"gross_pay" json:"grossPay"`
	NetPay          float64   `db:"net_pay" json:"netPay"`
	CreatedAt       time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt       time.Time `db:"updated_at" json:"updatedAt"`
}

type ListBatchesFilter struct {
	Month    string `json:"month"`
	Status   string `json:"status"`
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
}

type ListBatchesResult struct {
	Items      []PayrollBatch `json:"items"`
	TotalCount int64          `json:"totalCount"`
	Page       int            `json:"page"`
	PageSize   int            `json:"pageSize"`
}

type PayrollBatchDetail struct {
	Batch   PayrollBatch   `json:"batch"`
	Entries []PayrollEntry `json:"entries"`
}

type CreateBatchInput struct {
	Month string `json:"month"`
}

type UpdateEntryAmountsInput struct {
	AllowancesTotal float64 `json:"allowancesTotal"`
	DeductionsTotal float64 `json:"deductionsTotal"`
	TaxTotal        float64 `json:"taxTotal"`
}

type EmployeeSalary struct {
	EmployeeID   int64   `db:"employee_id"`
	EmployeeName string  `db:"employee_name"`
	BaseSalary   float64 `db:"base_salary"`
}

type CSVExport struct {
	Filename string `json:"filename"`
	Data     string `json:"data"`
	MimeType string `json:"mimeType"`
}
