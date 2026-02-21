package attendance

import "time"

const (
	StatusUnmarked = "unmarked"
	StatusPresent  = "present"
	StatusLate     = "late"
	StatusField    = "field"
	StatusAbsent   = "absent"
	StatusLeave    = "leave"
)

type AttendanceRecord struct {
	ID             int64     `db:"id" json:"id"`
	AttendanceDate time.Time `db:"attendance_date" json:"attendanceDate"`
	EmployeeID     int64     `db:"employee_id" json:"employeeId"`
	Status         string    `db:"status" json:"status"`
	MarkedByUserID int64     `db:"marked_by_user_id" json:"markedByUserId"`
	MarkedAt       time.Time `db:"marked_at" json:"markedAt"`
	IsLocked       bool      `db:"is_locked" json:"isLocked"`
	LockReason     *string   `db:"lock_reason" json:"lockReason,omitempty"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt      time.Time `db:"updated_at" json:"updatedAt"`
}

type AttendanceRow struct {
	EmployeeID     int64      `db:"employee_id" json:"employeeId"`
	EmployeeName   string     `db:"employee_name" json:"employeeName"`
	DepartmentName *string    `db:"department_name" json:"departmentName,omitempty"`
	AttendanceID   *int64     `db:"attendance_id" json:"attendanceId,omitempty"`
	Status         string     `db:"status" json:"status"`
	IsLocked       bool       `db:"is_locked" json:"isLocked"`
	CanPostToLeave bool       `json:"canPostToLeave"`
	CanEdit        bool       `json:"canEdit"`
	MarkedByUserID *int64     `db:"marked_by_user_id" json:"markedByUserId,omitempty"`
	MarkedAt       *time.Time `db:"marked_at" json:"markedAt,omitempty"`
}

type LunchDaily struct {
	AttendanceDate          time.Time `db:"attendance_date" json:"attendanceDate"`
	VisitorsCount           int       `db:"visitors_count" json:"visitorsCount"`
	PlateCostAmount         int       `db:"plate_cost_amount" json:"plateCostAmount"`
	StaffContributionAmount int       `db:"staff_contribution_amount" json:"staffContributionAmount"`
	UpdatedByUserID         int64     `db:"updated_by_user_id" json:"updatedByUserId"`
	UpdatedAt               time.Time `db:"updated_at" json:"updatedAt"`
}

type LunchSummary struct {
	AttendanceDate          string `json:"attendanceDate"`
	StaffPresentCount       int    `json:"staffPresentCount"`
	StaffFieldCount         int    `json:"staffFieldCount"`
	VisitorsCount           int    `json:"visitorsCount"`
	TotalPlates             int    `json:"totalPlates"`
	PlateCostAmount         int    `json:"plateCostAmount"`
	TotalCostAmount         int    `json:"totalCostAmount"`
	StaffContributionAmount int    `json:"staffContributionAmount"`
	StaffContributionTotal  int    `json:"staffContributionTotal"`
	OrganizationBalance     int    `json:"organizationBalance"`
	CanEditVisitors         bool   `json:"canEditVisitors"`
}

type PostAbsentToLeaveResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	LeaveID *int64 `json:"leaveId,omitempty"`
	Status  string `json:"status"`
}
