export type Department = {
  id: number
  name: string
  description?: string
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export type UpsertDepartmentInput = {
  name: string
  description?: string
}

export type ListDepartmentsQuery = {
  page: number
  pageSize: number
  q?: string
}

export type ListDepartmentsResult = {
  items: Department[]
  totalCount: number
  page: number
  pageSize: number
}
