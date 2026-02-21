import type { LoginInput, LoginResult, User } from './auth'
import type { ListAuditLogsQuery, ListAuditLogsResult } from './audit'
import type { Department, ListDepartmentsQuery, ListDepartmentsResult, UpsertDepartmentInput } from './departments'
import type { Employee, ListEmployeesQuery, ListEmployeesResult, UpsertEmployeeInput } from './employees'
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
} from './leave'
import type {
  ListPayrollBatchesFilter,
  ListPayrollBatchesResult,
  PayrollBatch,
  PayrollBatchDetail,
  PayrollEntry,
  UpdatePayrollEntryAmountsInput,
} from './payroll'
import type { CreateUserInput, ListUsersQuery, ListUsersResult, ManagedUser, UpdateUserInput } from './users'

export type AppGateway = {
  login: (input: LoginInput) => Promise<LoginResult>
  logout: (refreshToken: string) => Promise<void>
  getMe: (accessToken: string) => Promise<User>

  createEmployee: (accessToken: string, payload: UpsertEmployeeInput) => Promise<Employee>
  updateEmployee: (accessToken: string, id: number, payload: UpsertEmployeeInput) => Promise<Employee>
  deleteEmployee: (accessToken: string, id: number) => Promise<void>
  getEmployee: (accessToken: string, id: number) => Promise<Employee>
  listEmployees: (accessToken: string, query: ListEmployeesQuery) => Promise<ListEmployeesResult>

  createDepartment: (accessToken: string, payload: UpsertDepartmentInput) => Promise<Department>
  updateDepartment: (accessToken: string, id: number, payload: UpsertDepartmentInput) => Promise<Department>
  deleteDepartment: (accessToken: string, id: number) => Promise<void>
  getDepartment: (accessToken: string, id: number) => Promise<Department>
  listDepartments: (accessToken: string, query: ListDepartmentsQuery) => Promise<ListDepartmentsResult>

  listLeaveTypes: (accessToken: string, activeOnly: boolean) => Promise<LeaveType[]>
  createLeaveType: (accessToken: string, payload: LeaveTypeUpsertInput) => Promise<LeaveType>
  updateLeaveType: (accessToken: string, id: number, payload: LeaveTypeUpsertInput) => Promise<LeaveType>
  setLeaveTypeActive: (accessToken: string, id: number, active: boolean) => Promise<LeaveType>

  listLockedDates: (accessToken: string, year: number) => Promise<LeaveLockedDate[]>
  lockDate: (accessToken: string, date: string, reason: string) => Promise<LeaveLockedDate>
  unlockDate: (accessToken: string, date: string) => Promise<void>

  getMyLeaveBalance: (accessToken: string, year: number) => Promise<LeaveBalance>
  getLeaveBalance: (accessToken: string, employeeId: number, year: number) => Promise<LeaveBalance>
  upsertEntitlement: (accessToken: string, payload: UpsertEntitlementInput) => Promise<LeaveEntitlement>

  applyLeave: (accessToken: string, payload: ApplyLeaveInput) => Promise<LeaveRequest>
  listMyLeaveRequests: (accessToken: string, filter?: ListLeaveRequestsFilter) => Promise<LeaveRequest[]>
  listAllLeaveRequests: (accessToken: string, filter?: ListLeaveRequestsFilter) => Promise<LeaveRequest[]>
  approveLeave: (accessToken: string, id: number) => Promise<LeaveRequest>
  rejectLeave: (accessToken: string, id: number, reason?: string) => Promise<LeaveRequest>
  cancelLeave: (accessToken: string, id: number) => Promise<LeaveRequest>

  listPayrollBatches: (accessToken: string, filter: ListPayrollBatchesFilter) => Promise<ListPayrollBatchesResult>
  createPayrollBatch: (accessToken: string, month: string) => Promise<PayrollBatch>
  getPayrollBatch: (accessToken: string, batchId: number) => Promise<PayrollBatchDetail>
  generatePayrollEntries: (accessToken: string, batchId: number) => Promise<void>
  updatePayrollEntryAmounts: (
    accessToken: string,
    entryId: number,
    payload: UpdatePayrollEntryAmountsInput,
  ) => Promise<PayrollEntry>
  approvePayrollBatch: (accessToken: string, batchId: number) => Promise<PayrollBatch>
  lockPayrollBatch: (accessToken: string, batchId: number) => Promise<PayrollBatch>
  exportPayrollBatchCSV: (accessToken: string, batchId: number) => Promise<string>

  listUsers: (accessToken: string, query: ListUsersQuery) => Promise<ListUsersResult>
  getUser: (accessToken: string, id: number) => Promise<ManagedUser>
  createUser: (accessToken: string, payload: CreateUserInput) => Promise<ManagedUser>
  updateUser: (accessToken: string, id: number, payload: UpdateUserInput) => Promise<ManagedUser>
  resetUserPassword: (accessToken: string, id: number, newPassword: string) => Promise<void>
  setUserActive: (accessToken: string, id: number, active: boolean) => Promise<ManagedUser>

  listAuditLogs: (accessToken: string, query: ListAuditLogsQuery) => Promise<ListAuditLogsResult>
}
