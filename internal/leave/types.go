package leave

import "time"

const (
	StatusPending   = "Pending"
	StatusApproved  = "Approved"
	StatusRejected  = "Rejected"
	StatusCancelled = "Cancelled"
)

type LeaveType struct {
	ID                      int64     `db:"id" json:"id"`
	Name                    string    `db:"name" json:"name"`
	Paid                    bool      `db:"paid" json:"paid"`
	CountsTowardEntitlement bool      `db:"counts_toward_entitlement" json:"countsTowardEntitlement"`
	RequiresAttachment      bool      `db:"requires_attachment" json:"requiresAttachment"`
	RequiresApproval        bool      `db:"requires_approval" json:"requiresApproval"`
	Active                  bool      `db:"active" json:"active"`
	CreatedAt               time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt               time.Time `db:"updated_at" json:"updatedAt"`
}

type LeaveTypeUpsertInput struct {
	Name                    string `json:"name"`
	Paid                    bool   `json:"paid"`
	CountsTowardEntitlement bool   `json:"countsTowardEntitlement"`
	RequiresAttachment      bool   `json:"requiresAttachment"`
	RequiresApproval        bool   `json:"requiresApproval"`
}

type LeaveEntitlement struct {
	ID           int64     `db:"id" json:"id"`
	EmployeeID   int64     `db:"employee_id" json:"employeeId"`
	Year         int       `db:"year" json:"year"`
	TotalDays    float64   `db:"total_days" json:"totalDays"`
	ReservedDays float64   `db:"reserved_days" json:"reservedDays"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt    time.Time `db:"updated_at" json:"updatedAt"`
}

type LeaveLockedDate struct {
	ID        int64     `db:"id" json:"id"`
	Date      time.Time `db:"date" json:"date"`
	Reason    *string   `db:"reason" json:"reason,omitempty"`
	CreatedBy *int64    `db:"created_by" json:"createdBy,omitempty"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}

type LeaveRequest struct {
	ID            int64      `db:"id" json:"id"`
	EmployeeID    int64      `db:"employee_id" json:"employeeId"`
	EmployeeName  string     `db:"employee_name" json:"employeeName"`
	Department    *string    `db:"department_name" json:"departmentName,omitempty"`
	LeaveTypeID   int64      `db:"leave_type_id" json:"leaveTypeId"`
	LeaveTypeName string     `db:"leave_type_name" json:"leaveTypeName"`
	StartDate     time.Time  `db:"start_date" json:"startDate"`
	EndDate       time.Time  `db:"end_date" json:"endDate"`
	WorkingDays   float64    `db:"working_days" json:"workingDays"`
	Status        string     `db:"status" json:"status"`
	Reason        *string    `db:"reason" json:"reason,omitempty"`
	ApprovedBy    *int64     `db:"approved_by" json:"approvedBy,omitempty"`
	ApprovedAt    *time.Time `db:"approved_at" json:"approvedAt,omitempty"`
	CreatedAt     time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updatedAt"`
}

type LeaveBalance struct {
	EmployeeID    int64   `json:"employeeId"`
	Year          int     `json:"year"`
	TotalDays     float64 `json:"totalDays"`
	ReservedDays  float64 `json:"reservedDays"`
	ApprovedDays  float64 `json:"approvedDays"`
	PendingDays   float64 `json:"pendingDays"`
	AvailableDays float64 `json:"availableDays"`
}

type UpsertEntitlementInput struct {
	EmployeeID   int64   `json:"employeeId"`
	Year         int     `json:"year"`
	TotalDays    float64 `json:"totalDays"`
	ReservedDays float64 `json:"reservedDays"`
}

type ApplyLeaveInput struct {
	LeaveTypeID int64   `json:"leaveTypeId"`
	StartDate   string  `json:"startDate"`
	EndDate     string  `json:"endDate"`
	Reason      *string `json:"reason"`
}

type ListLeaveRequestsFilter struct {
	Status    string `json:"status"`
	DateFrom  string `json:"dateFrom"`
	DateTo    string `json:"dateTo"`
	Employee  string `json:"employee"`
	LeaveType string `json:"leaveType"`
	Dept      string `json:"dept"`
}
