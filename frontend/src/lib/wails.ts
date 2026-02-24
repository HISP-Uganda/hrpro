import type { LoginInput, LoginResult, User } from '../types/auth'
import type { AppGateway } from '../types/api'
import type { ListAuditLogsQuery, ListAuditLogsResult } from '../types/audit'
import type { AttendanceRecord, AttendanceRow, LunchSummary, PostAbsentToLeaveResult } from '../types/attendance'
import type { Department, ListDepartmentsQuery, ListDepartmentsResult, UpsertDepartmentInput } from '../types/departments'
import type { DashboardSummary } from '../types/dashboard'
import type { Employee, ListEmployeesQuery, ListEmployeesResult, UpsertEmployeeInput } from '../types/employees'
import type {
  ApplyLeaveInput,
  LeaveBalance,
  LeaveEntitlement,
  LeaveLockedDate,
  LeaveRequest,
  LeaveType,
  LeaveTypeUpsertInput,
  ListLeaveRequestsFilter,
  UpsertEntitlementInput,
} from '../types/leave'
import type {
  ListPayrollBatchesFilter,
  ListPayrollBatchesResult,
  PayrollBatch,
  PayrollBatchDetail,
  PayrollEntry,
  UpdatePayrollEntryAmountsInput,
} from '../types/payroll'
import type {
  AttendanceSummaryReportFilter,
  AttendanceSummaryReportResult,
  AuditLogReportFilter,
  AuditLogReportResult,
  CSVExportResult,
  EmployeeReportFilter,
  EmployeeReportResult,
  LeaveRequestsReportFilter,
  LeaveRequestsReportResult,
  PagerInput,
  PayrollBatchesReportFilter,
  PayrollBatchesReportResult,
} from '../types/reports'
import type { AppSettings, CompanyLogo, UpdateSettingsInput } from '../types/settings'
import type { CreateUserInput, ListUsersQuery, ListUsersResult, ManagedUser, UpdateUserInput } from '../types/users'

type WailsAppBinding = {
  Login: (input: LoginInput) => Promise<LoginResult>
  Logout: (input: { refreshToken: string }) => Promise<void>
  GetMe: (accessToken: string) => Promise<{ user: User }>

  CreateEmployee: (input: { accessToken: string; payload: UpsertEmployeeInput }) => Promise<Employee>
  UpdateEmployee: (input: { accessToken: string; id: number; payload: UpsertEmployeeInput }) => Promise<Employee>
  DeleteEmployee: (input: { accessToken: string; id: number }) => Promise<void>
  GetEmployee: (input: { accessToken: string; id: number }) => Promise<Employee>
  ListEmployees: (input: {
    accessToken: string
    page: number
    pageSize: number
    q?: string
    status?: string
    departmentId?: number
  }) => Promise<ListEmployeesResult>

  CreateDepartment: (input: { accessToken: string; payload: UpsertDepartmentInput }) => Promise<Department>
  UpdateDepartment: (input: { accessToken: string; id: number; payload: UpsertDepartmentInput }) => Promise<Department>
  DeleteDepartment: (input: { accessToken: string; id: number }) => Promise<void>
  GetDepartment: (input: { accessToken: string; id: number }) => Promise<Department>
  ListDepartments: (input: {
    accessToken: string
    page: number
    pageSize: number
    q?: string
  }) => Promise<ListDepartmentsResult>

  ListLeaveTypes: (input: { accessToken: string; activeOnly: boolean }) => Promise<LeaveType[]>
  CreateLeaveType: (input: { accessToken: string; payload: LeaveTypeUpsertInput }) => Promise<LeaveType>
  UpdateLeaveType: (input: { accessToken: string; id: number; payload: LeaveTypeUpsertInput }) => Promise<LeaveType>
  SetLeaveTypeActive: (input: { accessToken: string; id: number; active: boolean }) => Promise<LeaveType>

  ListLockedDates: (input: { accessToken: string; year: number }) => Promise<LeaveLockedDate[]>
  LockDate: (input: { accessToken: string; date: string; reason: string }) => Promise<LeaveLockedDate>
  UnlockDate: (input: { accessToken: string; date: string }) => Promise<void>

  GetMyLeaveBalance: (input: { accessToken: string; year: number }) => Promise<LeaveBalance>
  GetLeaveBalance: (input: { accessToken: string; employeeId: number; year: number }) => Promise<LeaveBalance>
  UpsertEntitlement: (input: { accessToken: string; payload: UpsertEntitlementInput }) => Promise<LeaveEntitlement>

  ApplyLeave: (input: { accessToken: string; payload: ApplyLeaveInput }) => Promise<LeaveRequest>
  ListMyLeaveRequests: (input: { accessToken: string; filter?: ListLeaveRequestsFilter }) => Promise<LeaveRequest[]>
  ListAllLeaveRequests: (input: { accessToken: string; filter?: ListLeaveRequestsFilter }) => Promise<LeaveRequest[]>
  ApproveLeave: (input: { accessToken: string; id: number }) => Promise<LeaveRequest>
  RejectLeave: (input: { accessToken: string; id: number; reason?: string }) => Promise<LeaveRequest>
  CancelLeave: (input: { accessToken: string; id: number }) => Promise<LeaveRequest>

  ListPayrollBatches: (input: { accessToken: string; filter: ListPayrollBatchesFilter }) => Promise<ListPayrollBatchesResult>
  CreatePayrollBatch: (input: { accessToken: string; payload: { month: string } }) => Promise<PayrollBatch>
  GetPayrollBatch: (input: { accessToken: string; batchId: number }) => Promise<PayrollBatchDetail>
  GeneratePayrollEntries: (input: { accessToken: string; batchId: number }) => Promise<void>
  UpdatePayrollEntryAmounts: (input: {
    accessToken: string
    entryId: number
    payload: UpdatePayrollEntryAmountsInput
  }) => Promise<PayrollEntry>
  ApprovePayrollBatch: (input: { accessToken: string; batchId: number }) => Promise<PayrollBatch>
  LockPayrollBatch: (input: { accessToken: string; batchId: number }) => Promise<PayrollBatch>
  ExportPayrollBatchCSV: (input: { accessToken: string; batchId: number }) => Promise<CSVExportResult>
  SaveFileWithDialog: (input: {
    suggestedFilename: string
    dataBytes: number[]
    mimeType: string
  }) => Promise<{ savedPath: string; cancelled: boolean }>

  ListUsers: (input: { accessToken: string; page: number; pageSize: number; q?: string }) => Promise<ListUsersResult>
  GetUser: (input: { accessToken: string; id: number }) => Promise<ManagedUser>
  CreateUser: (input: { accessToken: string; payload: CreateUserInput }) => Promise<ManagedUser>
  UpdateUser: (input: { accessToken: string; id: number; payload: UpdateUserInput }) => Promise<ManagedUser>
  ResetUserPassword: (input: { accessToken: string; id: number; payload: { newPassword: string } }) => Promise<void>
  SetUserActive: (input: { accessToken: string; id: number; active: boolean }) => Promise<ManagedUser>

  ListAuditLogs: (input: { accessToken: string; page: number; pageSize: number; q?: string }) => Promise<ListAuditLogsResult>
  GetDashboardSummary: (input: { accessToken: string }) => Promise<DashboardSummary>

  ListAttendanceByDate: (input: { accessToken: string; date: string }) => Promise<AttendanceRow[]>
  UpsertAttendance: (input: { accessToken: string; date: string; employeeId: number; status: string; reason?: string }) => Promise<AttendanceRecord>
  GetMyAttendanceRange: (input: { accessToken: string; startDate: string; endDate: string }) => Promise<AttendanceRecord[]>
  GetLunchSummary: (input: { accessToken: string; date: string }) => Promise<LunchSummary>
  UpsertLunchVisitors: (input: { accessToken: string; date: string; visitorsCount: number }) => Promise<LunchSummary>
  PostAbsentToLeave: (input: { accessToken: string; date: string; employeeId: number }) => Promise<PostAbsentToLeaveResult>

  ListEmployeeReport: (input: { accessToken: string; filters: EmployeeReportFilter; pager: PagerInput }) => Promise<EmployeeReportResult>
  ExportEmployeeReportCSV: (input: { accessToken: string; filters: EmployeeReportFilter }) => Promise<CSVExportResult>

  ListLeaveRequestsReport: (input: {
    accessToken: string
    filters: LeaveRequestsReportFilter
    pager: PagerInput
  }) => Promise<LeaveRequestsReportResult>
  ExportLeaveRequestsReportCSV: (input: { accessToken: string; filters: LeaveRequestsReportFilter }) => Promise<CSVExportResult>

  ListAttendanceSummaryReport: (input: {
    accessToken: string
    filters: AttendanceSummaryReportFilter
    pager: PagerInput
  }) => Promise<AttendanceSummaryReportResult>
  ExportAttendanceSummaryReportCSV: (input: { accessToken: string; filters: AttendanceSummaryReportFilter }) => Promise<CSVExportResult>

  ListPayrollBatchesReport: (input: {
    accessToken: string
    filters: PayrollBatchesReportFilter
    pager: PagerInput
  }) => Promise<PayrollBatchesReportResult>
  ExportPayrollBatchesReportCSV: (input: { accessToken: string; filters: PayrollBatchesReportFilter }) => Promise<CSVExportResult>

  ListAuditLogReport: (input: { accessToken: string; filters: AuditLogReportFilter; pager: PagerInput }) => Promise<AuditLogReportResult>
  ExportAuditLogReportCSV: (input: { accessToken: string; filters: AuditLogReportFilter }) => Promise<CSVExportResult>

  GetSettings: (input: { accessToken: string }) => Promise<AppSettings>
  UpdateSettings: (input: { accessToken: string; payload: UpdateSettingsInput }) => Promise<AppSettings>
  UploadCompanyLogo: (input: { accessToken: string; filename: string; data: number[] }) => Promise<string>
  GetCompanyLogo: (input: { accessToken: string }) => Promise<CompanyLogo>
}

declare global {
  interface Window {
    go?: {
      main?: {
        App?: WailsAppBinding
      }
    }
  }
}

function getAppBinding(): WailsAppBinding {
  const binding = window.go?.main?.App
  if (!binding) {
    throw new Error('Wails bindings are unavailable')
  }

  return binding
}

export class WailsGateway implements AppGateway {
  async login(input: LoginInput): Promise<LoginResult> {
    return getAppBinding().Login(input)
  }

  async logout(refreshToken: string): Promise<void> {
    await getAppBinding().Logout({ refreshToken })
  }

  async getMe(accessToken: string): Promise<User> {
    const response = await getAppBinding().GetMe(accessToken)
    return response.user
  }

  async createEmployee(accessToken: string, payload: UpsertEmployeeInput): Promise<Employee> {
    return getAppBinding().CreateEmployee({ accessToken, payload })
  }

  async updateEmployee(accessToken: string, id: number, payload: UpsertEmployeeInput): Promise<Employee> {
    return getAppBinding().UpdateEmployee({ accessToken, id, payload })
  }

  async deleteEmployee(accessToken: string, id: number): Promise<void> {
    await getAppBinding().DeleteEmployee({ accessToken, id })
  }

  async getEmployee(accessToken: string, id: number): Promise<Employee> {
    return getAppBinding().GetEmployee({ accessToken, id })
  }

  async listEmployees(accessToken: string, query: ListEmployeesQuery): Promise<ListEmployeesResult> {
    return getAppBinding().ListEmployees({
      accessToken,
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      status: query.status,
      departmentId: query.departmentId,
    })
  }

  async createDepartment(accessToken: string, payload: UpsertDepartmentInput): Promise<Department> {
    return getAppBinding().CreateDepartment({ accessToken, payload })
  }

  async updateDepartment(accessToken: string, id: number, payload: UpsertDepartmentInput): Promise<Department> {
    return getAppBinding().UpdateDepartment({ accessToken, id, payload })
  }

  async deleteDepartment(accessToken: string, id: number): Promise<void> {
    await getAppBinding().DeleteDepartment({ accessToken, id })
  }

  async getDepartment(accessToken: string, id: number): Promise<Department> {
    return getAppBinding().GetDepartment({ accessToken, id })
  }

  async listDepartments(accessToken: string, query: ListDepartmentsQuery): Promise<ListDepartmentsResult> {
    return getAppBinding().ListDepartments({
      accessToken,
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
    })
  }

  async listLeaveTypes(accessToken: string, activeOnly: boolean): Promise<LeaveType[]> {
    return getAppBinding().ListLeaveTypes({ accessToken, activeOnly })
  }

  async createLeaveType(accessToken: string, payload: LeaveTypeUpsertInput): Promise<LeaveType> {
    return getAppBinding().CreateLeaveType({ accessToken, payload })
  }

  async updateLeaveType(accessToken: string, id: number, payload: LeaveTypeUpsertInput): Promise<LeaveType> {
    return getAppBinding().UpdateLeaveType({ accessToken, id, payload })
  }

  async setLeaveTypeActive(accessToken: string, id: number, active: boolean): Promise<LeaveType> {
    return getAppBinding().SetLeaveTypeActive({ accessToken, id, active })
  }

  async listLockedDates(accessToken: string, year: number): Promise<LeaveLockedDate[]> {
    return getAppBinding().ListLockedDates({ accessToken, year })
  }

  async lockDate(accessToken: string, date: string, reason: string): Promise<LeaveLockedDate> {
    return getAppBinding().LockDate({ accessToken, date, reason })
  }

  async unlockDate(accessToken: string, date: string): Promise<void> {
    await getAppBinding().UnlockDate({ accessToken, date })
  }

  async getMyLeaveBalance(accessToken: string, year: number): Promise<LeaveBalance> {
    return getAppBinding().GetMyLeaveBalance({ accessToken, year })
  }

  async getLeaveBalance(accessToken: string, employeeId: number, year: number): Promise<LeaveBalance> {
    return getAppBinding().GetLeaveBalance({ accessToken, employeeId, year })
  }

  async upsertEntitlement(accessToken: string, payload: UpsertEntitlementInput): Promise<LeaveEntitlement> {
    return getAppBinding().UpsertEntitlement({ accessToken, payload })
  }

  async applyLeave(accessToken: string, payload: ApplyLeaveInput): Promise<LeaveRequest> {
    return getAppBinding().ApplyLeave({ accessToken, payload })
  }

  async listMyLeaveRequests(accessToken: string, filter?: ListLeaveRequestsFilter): Promise<LeaveRequest[]> {
    return getAppBinding().ListMyLeaveRequests({ accessToken, filter })
  }

  async listAllLeaveRequests(accessToken: string, filter?: ListLeaveRequestsFilter): Promise<LeaveRequest[]> {
    return getAppBinding().ListAllLeaveRequests({ accessToken, filter })
  }

  async approveLeave(accessToken: string, id: number): Promise<LeaveRequest> {
    return getAppBinding().ApproveLeave({ accessToken, id })
  }

  async rejectLeave(accessToken: string, id: number, reason?: string): Promise<LeaveRequest> {
    return getAppBinding().RejectLeave({ accessToken, id, reason })
  }

  async cancelLeave(accessToken: string, id: number): Promise<LeaveRequest> {
    return getAppBinding().CancelLeave({ accessToken, id })
  }

  async listPayrollBatches(accessToken: string, filter: ListPayrollBatchesFilter): Promise<ListPayrollBatchesResult> {
    return getAppBinding().ListPayrollBatches({ accessToken, filter })
  }

  async createPayrollBatch(accessToken: string, month: string): Promise<PayrollBatch> {
    return getAppBinding().CreatePayrollBatch({ accessToken, payload: { month } })
  }

  async getPayrollBatch(accessToken: string, batchId: number): Promise<PayrollBatchDetail> {
    return getAppBinding().GetPayrollBatch({ accessToken, batchId })
  }

  async generatePayrollEntries(accessToken: string, batchId: number): Promise<void> {
    await getAppBinding().GeneratePayrollEntries({ accessToken, batchId })
  }

  async updatePayrollEntryAmounts(
    accessToken: string,
    entryId: number,
    payload: UpdatePayrollEntryAmountsInput,
  ): Promise<PayrollEntry> {
    return getAppBinding().UpdatePayrollEntryAmounts({ accessToken, entryId, payload })
  }

  async approvePayrollBatch(accessToken: string, batchId: number): Promise<PayrollBatch> {
    return getAppBinding().ApprovePayrollBatch({ accessToken, batchId })
  }

  async lockPayrollBatch(accessToken: string, batchId: number): Promise<PayrollBatch> {
    return getAppBinding().LockPayrollBatch({ accessToken, batchId })
  }

  async exportPayrollBatchCSV(accessToken: string, batchId: number): Promise<CSVExportResult> {
    return getAppBinding().ExportPayrollBatchCSV({ accessToken, batchId })
  }

  async saveFileWithDialog(
    suggestedFilename: string,
    dataBytes: number[],
    mimeType: string,
  ): Promise<{ savedPath: string; cancelled: boolean }> {
    return getAppBinding().SaveFileWithDialog({ suggestedFilename, dataBytes, mimeType })
  }

  async listUsers(accessToken: string, query: ListUsersQuery): Promise<ListUsersResult> {
    return getAppBinding().ListUsers({
      accessToken,
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
    })
  }

  async getUser(accessToken: string, id: number): Promise<ManagedUser> {
    return getAppBinding().GetUser({ accessToken, id })
  }

  async createUser(accessToken: string, payload: CreateUserInput): Promise<ManagedUser> {
    return getAppBinding().CreateUser({ accessToken, payload })
  }

  async updateUser(accessToken: string, id: number, payload: UpdateUserInput): Promise<ManagedUser> {
    return getAppBinding().UpdateUser({ accessToken, id, payload })
  }

  async resetUserPassword(accessToken: string, id: number, newPassword: string): Promise<void> {
    await getAppBinding().ResetUserPassword({ accessToken, id, payload: { newPassword } })
  }

  async setUserActive(accessToken: string, id: number, active: boolean): Promise<ManagedUser> {
    return getAppBinding().SetUserActive({ accessToken, id, active })
  }

  async listAuditLogs(accessToken: string, query: ListAuditLogsQuery): Promise<ListAuditLogsResult> {
    return getAppBinding().ListAuditLogs({
      accessToken,
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
    })
  }

  async getDashboardSummary(accessToken: string): Promise<DashboardSummary> {
    return getAppBinding().GetDashboardSummary({ accessToken })
  }

  async listAttendanceByDate(accessToken: string, date: string): Promise<AttendanceRow[]> {
    return getAppBinding().ListAttendanceByDate({ accessToken, date })
  }

  async upsertAttendance(
    accessToken: string,
    date: string,
    employeeId: number,
    status: string,
    reason?: string,
  ): Promise<AttendanceRecord> {
    return getAppBinding().UpsertAttendance({ accessToken, date, employeeId, status, reason })
  }

  async getMyAttendanceRange(accessToken: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return getAppBinding().GetMyAttendanceRange({ accessToken, startDate, endDate })
  }

  async getLunchSummary(accessToken: string, date: string): Promise<LunchSummary> {
    return getAppBinding().GetLunchSummary({ accessToken, date })
  }

  async upsertLunchVisitors(accessToken: string, date: string, visitorsCount: number): Promise<LunchSummary> {
    return getAppBinding().UpsertLunchVisitors({ accessToken, date, visitorsCount })
  }

  async postAbsentToLeave(accessToken: string, date: string, employeeId: number): Promise<PostAbsentToLeaveResult> {
    return getAppBinding().PostAbsentToLeave({ accessToken, date, employeeId })
  }

  async listEmployeeReport(accessToken: string, filters: EmployeeReportFilter, pager: PagerInput): Promise<EmployeeReportResult> {
    return getAppBinding().ListEmployeeReport({ accessToken, filters, pager })
  }

  async exportEmployeeReportCSV(accessToken: string, filters: EmployeeReportFilter): Promise<CSVExportResult> {
    return getAppBinding().ExportEmployeeReportCSV({ accessToken, filters })
  }

  async listLeaveRequestsReport(
    accessToken: string,
    filters: LeaveRequestsReportFilter,
    pager: PagerInput,
  ): Promise<LeaveRequestsReportResult> {
    return getAppBinding().ListLeaveRequestsReport({ accessToken, filters, pager })
  }

  async exportLeaveRequestsReportCSV(accessToken: string, filters: LeaveRequestsReportFilter): Promise<CSVExportResult> {
    return getAppBinding().ExportLeaveRequestsReportCSV({ accessToken, filters })
  }

  async listAttendanceSummaryReport(
    accessToken: string,
    filters: AttendanceSummaryReportFilter,
    pager: PagerInput,
  ): Promise<AttendanceSummaryReportResult> {
    return getAppBinding().ListAttendanceSummaryReport({ accessToken, filters, pager })
  }

  async exportAttendanceSummaryReportCSV(accessToken: string, filters: AttendanceSummaryReportFilter): Promise<CSVExportResult> {
    return getAppBinding().ExportAttendanceSummaryReportCSV({ accessToken, filters })
  }

  async listPayrollBatchesReport(
    accessToken: string,
    filters: PayrollBatchesReportFilter,
    pager: PagerInput,
  ): Promise<PayrollBatchesReportResult> {
    return getAppBinding().ListPayrollBatchesReport({ accessToken, filters, pager })
  }

  async exportPayrollBatchesReportCSV(accessToken: string, filters: PayrollBatchesReportFilter): Promise<CSVExportResult> {
    return getAppBinding().ExportPayrollBatchesReportCSV({ accessToken, filters })
  }

  async listAuditLogReport(accessToken: string, filters: AuditLogReportFilter, pager: PagerInput): Promise<AuditLogReportResult> {
    return getAppBinding().ListAuditLogReport({ accessToken, filters, pager })
  }

  async exportAuditLogReportCSV(accessToken: string, filters: AuditLogReportFilter): Promise<CSVExportResult> {
    return getAppBinding().ExportAuditLogReportCSV({ accessToken, filters })
  }

  async getSettings(accessToken: string): Promise<AppSettings> {
    return getAppBinding().GetSettings({ accessToken })
  }

  async updateSettings(accessToken: string, payload: UpdateSettingsInput): Promise<AppSettings> {
    return getAppBinding().UpdateSettings({ accessToken, payload })
  }

  async uploadCompanyLogo(accessToken: string, filename: string, data: number[]): Promise<string> {
    return getAppBinding().UploadCompanyLogo({ accessToken, filename, data })
  }

  async getCompanyLogo(accessToken: string): Promise<CompanyLogo> {
    return getAppBinding().GetCompanyLogo({ accessToken })
  }
}
