package reports

import "time"

type PagerInput struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
}

type Pager struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalCount int64 `json:"totalCount"`
}

type EmployeeListFilter struct {
	DepartmentID     *int64 `json:"departmentId"`
	EmploymentStatus string `json:"employmentStatus"`
	Q                string `json:"q"`
}

type EmployeeReportRow struct {
	EmployeeName     string    `db:"employee_name" json:"employeeName"`
	DepartmentName   string    `db:"department_name" json:"departmentName"`
	Position         string    `db:"position" json:"position"`
	Status           string    `db:"status" json:"status"`
	DateOfHire       time.Time `db:"date_of_hire" json:"dateOfHire"`
	Phone            string    `db:"phone" json:"phone"`
	Email            string    `db:"email" json:"email"`
	BaseSalaryAmount *float64  `db:"base_salary_amount" json:"baseSalaryAmount"`
}

type EmployeeReportListResult struct {
	Rows  []EmployeeReportRow `json:"rows"`
	Pager Pager               `json:"pager"`
}

type LeaveRequestsFilter struct {
	DateFrom     string `json:"dateFrom"`
	DateTo       string `json:"dateTo"`
	DepartmentID *int64 `json:"departmentId"`
	EmployeeID   *int64 `json:"employeeId"`
	LeaveTypeID  *int64 `json:"leaveTypeId"`
	Status       string `json:"status"`
}

type LeaveRequestsReportRow struct {
	EmployeeName   string     `db:"employee_name" json:"employeeName"`
	DepartmentName string     `db:"department_name" json:"departmentName"`
	LeaveType      string     `db:"leave_type" json:"leaveType"`
	StartDate      time.Time  `db:"start_date" json:"startDate"`
	EndDate        time.Time  `db:"end_date" json:"endDate"`
	WorkingDays    float64    `db:"working_days" json:"workingDays"`
	Status         string     `db:"status" json:"status"`
	ApprovedBy     *string    `db:"approved_by" json:"approvedBy,omitempty"`
	ApprovedAt     *time.Time `db:"approved_at" json:"approvedAt,omitempty"`
}

type LeaveRequestsReportListResult struct {
	Rows  []LeaveRequestsReportRow `json:"rows"`
	Pager Pager                    `json:"pager"`
}

type AttendanceSummaryFilter struct {
	DateFrom     string `json:"dateFrom"`
	DateTo       string `json:"dateTo"`
	DepartmentID *int64 `json:"departmentId"`
	EmployeeID   *int64 `json:"employeeId"`
}

type AttendanceSummaryReportRow struct {
	EmployeeID    int64  `db:"employee_id" json:"employeeId"`
	EmployeeName  string `db:"employee_name" json:"employeeName"`
	Department    string `db:"department_name" json:"departmentName"`
	PresentCount  int    `db:"present_count" json:"presentCount"`
	LateCount     int    `db:"late_count" json:"lateCount"`
	FieldCount    int    `db:"field_count" json:"fieldCount"`
	AbsentCount   int    `db:"absent_count" json:"absentCount"`
	LeaveCount    int    `db:"leave_count" json:"leaveCount"`
	UnmarkedCount int    `db:"unmarked_count" json:"unmarkedCount"`
}

type AttendanceSummaryReportListResult struct {
	Rows  []AttendanceSummaryReportRow `json:"rows"`
	Pager Pager                        `json:"pager"`
}

type PayrollBatchesFilter struct {
	MonthFrom string `json:"monthFrom"`
	MonthTo   string `json:"monthTo"`
	Status    string `json:"status"`
}

type PayrollBatchesReportRow struct {
	Month        string     `db:"month" json:"month"`
	Status       string     `db:"status" json:"status"`
	CreatedAt    time.Time  `db:"created_at" json:"createdAt"`
	ApprovedAt   *time.Time `db:"approved_at" json:"approvedAt,omitempty"`
	LockedAt     *time.Time `db:"locked_at" json:"lockedAt,omitempty"`
	EntriesCount int64      `db:"entries_count" json:"entriesCount"`
	TotalNetPay  float64    `db:"total_net_pay" json:"totalNetPay"`
}

type PayrollBatchesReportListResult struct {
	Rows  []PayrollBatchesReportRow `json:"rows"`
	Pager Pager                     `json:"pager"`
}

type AuditLogFilter struct {
	DateFrom    string `json:"dateFrom"`
	DateTo      string `json:"dateTo"`
	ActorUserID *int64 `json:"actorUserId"`
	Action      string `json:"action"`
	EntityType  string `json:"entityType"`
}

type AuditLogReportRow struct {
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
	ActorUsername string    `db:"actor_username" json:"actorUsername"`
	Action        string    `db:"action" json:"action"`
	EntityType    string    `db:"entity_type" json:"entityType"`
	EntityID      *int64    `db:"entity_id" json:"entityId,omitempty"`
	MetadataJSON  string    `db:"metadata_json" json:"metadataJson"`
}

type AuditLogReportListResult struct {
	Rows  []AuditLogReportRow `json:"rows"`
	Pager Pager               `json:"pager"`
}

type CSVExport struct {
	Filename string `json:"filename"`
	Data     string `json:"data"`
}
