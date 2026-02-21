import type { LoginInput, LoginResult, User } from '../types/auth'
import type { AppGateway } from '../types/api'
import type { Department, ListDepartmentsQuery, ListDepartmentsResult, UpsertDepartmentInput } from '../types/departments'
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
}
