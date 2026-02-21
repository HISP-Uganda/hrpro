package departments

import "time"

type Department struct {
	ID            int64     `db:"id" json:"id"`
	Name          string    `db:"name" json:"name"`
	Description   *string   `db:"description" json:"description,omitempty"`
	EmployeeCount int64     `db:"employee_count" json:"employeeCount"`
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt     time.Time `db:"updated_at" json:"updatedAt"`
}

type UpsertDepartmentInput struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type ListDepartmentsQuery struct {
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Q        string `json:"q"`
}

type ListDepartmentsResult struct {
	Items      []Department `json:"items"`
	TotalCount int64        `json:"totalCount"`
	Page       int          `json:"page"`
	PageSize   int          `json:"pageSize"`
}
