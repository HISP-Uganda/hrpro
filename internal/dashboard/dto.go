package dashboard

import "time"

type DepartmentHeadcount struct {
	DepartmentName string `db:"department_name" json:"departmentName"`
	Count          int64  `db:"count" json:"count"`
}

type AuditEvent struct {
	ID            int64     `db:"id" json:"id"`
	ActorUserID   *int64    `db:"actor_user_id" json:"actorUserId,omitempty"`
	ActorUsername *string   `db:"actor_username" json:"actorUsername,omitempty"`
	Action        string    `db:"action" json:"action"`
	EntityType    *string   `db:"entity_type" json:"entityType,omitempty"`
	EntityID      *int64    `db:"entity_id" json:"entityId,omitempty"`
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
}

type SummaryDTO struct {
	TotalEmployees         int64                 `json:"totalEmployees"`
	ActiveEmployees        int64                 `json:"activeEmployees"`
	InactiveEmployees      int64                 `json:"inactiveEmployees"`
	PendingLeaveRequests   int64                 `json:"pendingLeaveRequests"`
	ApprovedLeaveThisMonth int64                 `json:"approvedLeaveThisMonth"`
	EmployeesOnLeaveToday  int64                 `json:"employeesOnLeaveToday"`
	CurrentPayrollStatus   *string               `json:"currentPayrollStatus,omitempty"`
	CurrentPayrollTotal    *float64              `json:"currentPayrollTotal,omitempty"`
	ActiveUsers            *int64                `json:"activeUsers,omitempty"`
	EmployeesPerDepartment []DepartmentHeadcount `json:"employeesPerDepartment"`
	RecentAuditEvents      []AuditEvent          `json:"recentAuditEvents"`
}
