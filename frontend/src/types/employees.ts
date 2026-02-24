export type EmployeeGender = 'Male' | 'Female'

export type Employee = {
  id: number
  firstName: string
  lastName: string
  otherName?: string
  gender?: EmployeeGender | '' | null
  dateOfBirth?: string
  phone?: string
  phoneE164?: string
  email?: string
  nationalId?: string
  address?: string
  jobDescription?: string
  contractUrl?: string
  contractFilePath?: string | null
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
  gender?: EmployeeGender
  dateOfBirth?: string
  phone?: string
  email?: string
  nationalId?: string
  address?: string
  jobDescription?: string
  contractUrl?: string
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
