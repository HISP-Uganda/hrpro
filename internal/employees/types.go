package employees

import "time"

type Employee struct {
	ID               int64      `db:"id" json:"id"`
	FirstName        string     `db:"first_name" json:"firstName"`
	LastName         string     `db:"last_name" json:"lastName"`
	OtherName        *string    `db:"other_name" json:"otherName,omitempty"`
	Gender           *string    `db:"gender" json:"gender,omitempty"`
	DateOfBirth      *time.Time `db:"dob" json:"dateOfBirth,omitempty"`
	Phone            *string    `db:"phone" json:"phone,omitempty"`
	PhoneE164        *string    `db:"phone_e164" json:"phoneE164,omitempty"`
	Email            *string    `db:"email" json:"email,omitempty"`
	NationalID       *string    `db:"national_id" json:"nationalId,omitempty"`
	Address          *string    `db:"address" json:"address,omitempty"`
	JobDescription   *string    `db:"job_description" json:"jobDescription,omitempty"`
	ContractURL      *string    `db:"contract_url" json:"contractUrl,omitempty"`
	ContractFilePath *string    `db:"contract_file_path" json:"contractFilePath,omitempty"`
	DepartmentID     *int64     `db:"department_id" json:"departmentId,omitempty"`
	DepartmentName   *string    `db:"department_name" json:"departmentName,omitempty"`
	Position         string     `db:"position" json:"position"`
	EmploymentStatus string     `db:"employment_status" json:"employmentStatus"`
	DateOfHire       time.Time  `db:"date_of_hire" json:"dateOfHire"`
	BaseSalaryAmount float64    `db:"base_salary_amount" json:"baseSalaryAmount"`
	CreatedAt        time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt        time.Time  `db:"updated_at" json:"updatedAt"`
}

type UpsertEmployeeInput struct {
	FirstName        string  `json:"firstName"`
	LastName         string  `json:"lastName"`
	OtherName        *string `json:"otherName"`
	Gender           *string `json:"gender"`
	DateOfBirth      *string `json:"dateOfBirth"`
	Phone            *string `json:"phone"`
	Email            *string `json:"email"`
	NationalID       *string `json:"nationalId"`
	Address          *string `json:"address"`
	JobDescription   *string `json:"jobDescription"`
	ContractURL      *string `json:"contractUrl"`
	DepartmentID     *int64  `json:"departmentId"`
	Position         string  `json:"position"`
	EmploymentStatus string  `json:"employmentStatus"`
	DateOfHire       string  `json:"dateOfHire"`
	BaseSalaryAmount float64 `json:"baseSalaryAmount"`
}

type ListEmployeesQuery struct {
	Page         int    `json:"page"`
	PageSize     int    `json:"pageSize"`
	Q            string `json:"q"`
	Status       string `json:"status"`
	DepartmentID *int64 `json:"departmentId"`
}

type ListEmployeesResult struct {
	Items      []Employee `json:"items"`
	TotalCount int64      `json:"totalCount"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
}
