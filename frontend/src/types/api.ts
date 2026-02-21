import type { LoginInput, LoginResult, User } from './auth'
import type { Employee, ListEmployeesQuery, ListEmployeesResult, UpsertEmployeeInput } from './employees'

export type AppGateway = {
  login: (input: LoginInput) => Promise<LoginResult>
  logout: (refreshToken: string) => Promise<void>
  getMe: (accessToken: string) => Promise<User>
  createEmployee: (accessToken: string, payload: UpsertEmployeeInput) => Promise<Employee>
  updateEmployee: (accessToken: string, id: number, payload: UpsertEmployeeInput) => Promise<Employee>
  deleteEmployee: (accessToken: string, id: number) => Promise<void>
  getEmployee: (accessToken: string, id: number) => Promise<Employee>
  listEmployees: (accessToken: string, query: ListEmployeesQuery) => Promise<ListEmployeesResult>
}
