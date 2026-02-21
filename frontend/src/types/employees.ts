export type Employee = {
  id: number
  firstName: string
  lastName: string
  otherName?: string
  gender?: string
  dateOfBirth?: string
  phone?: string
  email?: string
  nationalId?: string
  address?: string
  departmentId?: number
  departmentName?: string
  position: string
  employmentStatus: string
  dateOfHire: string
  baseSalaryAmount: number
  createdAt: string
  updatedAt: string
}

export type UpsertEmployeeInput = {
  firstName: string
  lastName: string
  otherName?: string
  gender?: string
  dateOfBirth?: string
  phone?: string
  email?: string
  nationalId?: string
  address?: string
  departmentId?: number
  position: string
  employmentStatus: string
  dateOfHire: string
  baseSalaryAmount: number
}

export type ListEmployeesQuery = {
  page: number
  pageSize: number
  q?: string
  status?: string
  departmentId?: number
}

export type ListEmployeesResult = {
  items: Employee[]
  totalCount: number
  page: number
  pageSize: number
}
