package reports

import (
	"bytes"
	"encoding/csv"
	"fmt"
)

func exportEmployeeCSV(rows []EmployeeReportRow) (string, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := []string{"employee_name", "department_name", "position", "status", "date_of_hire", "phone", "email", "base_salary_amount"}
	if err := writer.Write(headers); err != nil {
		return "", fmt.Errorf("write employee csv header: %w", err)
	}

	for _, row := range rows {
		salary := ""
		if row.BaseSalaryAmount != nil {
			salary = fmt.Sprintf("%.2f", *row.BaseSalaryAmount)
		}
		record := []string{row.EmployeeName, row.DepartmentName, row.Position, row.Status, row.DateOfHire.Format("2006-01-02"), row.Phone, row.Email, salary}
		if err := writer.Write(record); err != nil {
			return "", fmt.Errorf("write employee csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("flush employee csv: %w", err)
	}

	return buffer.String(), nil
}

func exportLeaveCSV(rows []LeaveRequestsReportRow) (string, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := []string{"employee_name", "department_name", "leave_type", "start_date", "end_date", "working_days", "status", "approved_by", "approved_at"}
	if err := writer.Write(headers); err != nil {
		return "", fmt.Errorf("write leave csv header: %w", err)
	}

	for _, row := range rows {
		approvedBy := ""
		if row.ApprovedBy != nil {
			approvedBy = *row.ApprovedBy
		}
		approvedAt := ""
		if row.ApprovedAt != nil {
			approvedAt = row.ApprovedAt.Format("2006-01-02")
		}
		record := []string{row.EmployeeName, row.DepartmentName, row.LeaveType, row.StartDate.Format("2006-01-02"), row.EndDate.Format("2006-01-02"), fmt.Sprintf("%.2f", row.WorkingDays), row.Status, approvedBy, approvedAt}
		if err := writer.Write(record); err != nil {
			return "", fmt.Errorf("write leave csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("flush leave csv: %w", err)
	}

	return buffer.String(), nil
}

func exportAttendanceSummaryCSV(rows []AttendanceSummaryReportRow) (string, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := []string{"employee_name", "department_name", "present_count", "late_count", "field_count", "absent_count", "leave_count", "unmarked_count"}
	if err := writer.Write(headers); err != nil {
		return "", fmt.Errorf("write attendance summary csv header: %w", err)
	}

	for _, row := range rows {
		record := []string{
			row.EmployeeName,
			row.Department,
			fmt.Sprintf("%d", row.PresentCount),
			fmt.Sprintf("%d", row.LateCount),
			fmt.Sprintf("%d", row.FieldCount),
			fmt.Sprintf("%d", row.AbsentCount),
			fmt.Sprintf("%d", row.LeaveCount),
			fmt.Sprintf("%d", row.UnmarkedCount),
		}
		if err := writer.Write(record); err != nil {
			return "", fmt.Errorf("write attendance summary csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("flush attendance summary csv: %w", err)
	}

	return buffer.String(), nil
}

func exportPayrollBatchesCSV(rows []PayrollBatchesReportRow) (string, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := []string{"month", "status", "created_at", "approved_at", "locked_at", "entries_count", "total_net_pay"}
	if err := writer.Write(headers); err != nil {
		return "", fmt.Errorf("write payroll report csv header: %w", err)
	}

	for _, row := range rows {
		approvedAt := ""
		if row.ApprovedAt != nil {
			approvedAt = row.ApprovedAt.Format("2006-01-02")
		}
		lockedAt := ""
		if row.LockedAt != nil {
			lockedAt = row.LockedAt.Format("2006-01-02")
		}
		record := []string{row.Month, row.Status, row.CreatedAt.Format("2006-01-02"), approvedAt, lockedAt, fmt.Sprintf("%d", row.EntriesCount), fmt.Sprintf("%.2f", row.TotalNetPay)}
		if err := writer.Write(record); err != nil {
			return "", fmt.Errorf("write payroll report csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("flush payroll report csv: %w", err)
	}

	return buffer.String(), nil
}

func exportAuditCSV(rows []AuditLogReportRow) (string, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := []string{"created_at", "actor_username", "action", "entity_type", "entity_id", "metadata_json"}
	if err := writer.Write(headers); err != nil {
		return "", fmt.Errorf("write audit csv header: %w", err)
	}

	for _, row := range rows {
		entityID := ""
		if row.EntityID != nil {
			entityID = fmt.Sprintf("%d", *row.EntityID)
		}
		record := []string{row.CreatedAt.Format("2006-01-02"), row.ActorUsername, row.Action, row.EntityType, entityID, row.MetadataJSON}
		if err := writer.Write(record); err != nil {
			return "", fmt.Errorf("write audit csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", fmt.Errorf("flush audit csv: %w", err)
	}

	return buffer.String(), nil
}
