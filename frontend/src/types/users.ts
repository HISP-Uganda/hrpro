export type UserRole = 'admin' | 'hr_officer' | 'finance_officer' | 'viewer'

export type ManagedUser = {
  id: number
  username: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export type ListUsersQuery = {
  page: number
  pageSize: number
  q?: string
}

export type ListUsersResult = {
  items: ManagedUser[]
  totalCount: number
  page: number
  pageSize: number
}

export type CreateUserInput = {
  username: string
  password: string
  role: UserRole
}

export type UpdateUserInput = {
  username: string
  role: UserRole
}
