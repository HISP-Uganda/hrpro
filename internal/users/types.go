package users

import "time"

type User struct {
	ID          int64      `db:"id" json:"id"`
	Username    string     `db:"username" json:"username"`
	Role        string     `db:"role" json:"role"`
	IsActive    bool       `db:"is_active" json:"isActive"`
	CreatedAt   time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updatedAt"`
	LastLoginAt *time.Time `db:"last_login_at" json:"lastLoginAt,omitempty"`
}

type ListUsersQuery struct {
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Q        string `json:"q"`
}

type ListUsersResult struct {
	Items      []User `json:"items"`
	TotalCount int64  `json:"totalCount"`
	Page       int    `json:"page"`
	PageSize   int    `json:"pageSize"`
}

type CreateUserInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type UpdateUserInput struct {
	Username string `json:"username"`
	Role     string `json:"role"`
}

type ResetUserPasswordInput struct {
	NewPassword string `json:"newPassword"`
}
