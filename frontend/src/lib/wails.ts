import type { LoginInput, LoginResult, User } from '../types/auth'
import type { AppGateway } from '../types/api'
import type { Employee, ListEmployeesQuery, ListEmployeesResult, UpsertEmployeeInput } from '../types/employees'

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
}
