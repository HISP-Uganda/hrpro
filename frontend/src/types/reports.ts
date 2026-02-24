export type Pager = {
  page: number
  pageSize: number
  totalCount: number
}

export type PagerInput = {
  page: number
  pageSize: number
}

export type EmployeeReportFilter = {
  departmentId?: number
  employmentStatus?: string
  q?: string
}

export type EmployeeReportRow = {
  employeeName: string
  departmentName: string
  position: string
  jobDescription: string
  status: string
  dateOfHire: string
  phone: string
  email: string
  baseSalaryAmount?: number | null
}

export type EmployeeReportResult = {
  rows: EmployeeReportRow[]
  pager: Pager
}

export type LeaveRequestsReportFilter = {
  dateFrom: string
  dateTo: string
  departmentId?: number
  employeeId?: number
  leaveTypeId?: number
  status?: string
}

export type LeaveRequestsReportRow = {
  employeeName: string
  departmentName: string
  leaveType: string
  startDate: string
  endDate: string
  workingDays: number
  status: string
  approvedBy?: string
  approvedAt?: string
}

export type LeaveRequestsReportResult = {
  rows: LeaveRequestsReportRow[]
  pager: Pager
}

export type AttendanceSummaryReportFilter = {
  dateFrom: string
  dateTo: string
  departmentId?: number
  employeeId?: number
}

export type AttendanceSummaryReportRow = {
  employeeId: number
  employeeName: string
  departmentName: string
  presentCount: number
  lateCount: number
  fieldCount: number
  absentCount: number
  leaveCount: number
  unmarkedCount: number
}

export type AttendanceSummaryReportResult = {
  rows: AttendanceSummaryReportRow[]
  pager: Pager
}

export type PayrollBatchesReportFilter = {
  monthFrom?: string
  monthTo?: string
  status?: string
}

export type PayrollBatchesReportRow = {
  month: string
  status: string
  createdAt: string
  approvedAt?: string
  lockedAt?: string
  entriesCount: number
  totalNetPay: number
}

export type PayrollBatchesReportResult = {
  rows: PayrollBatchesReportRow[]
  pager: Pager
}

export type AuditLogReportFilter = {
  dateFrom: string
  dateTo: string
  actorUserId?: number
  action?: string
  entityType?: string
}

export type AuditLogReportRow = {
  createdAt: string
  actorUsername: string
  action: string
  entityType: string
  entityId?: number
  metadataJson: string
}

export type AuditLogReportResult = {
  rows: AuditLogReportRow[]
  pager: Pager
}

export type CSVExportResult = {
  filename: string
  data: string
  mimeType: string
}
