export type DashboardDepartmentHeadcount = {
  departmentName: string
  count: number
}

export type DashboardAuditEvent = {
  id: number
  actorUserId?: number
  actorUsername?: string
  action: string
  entityType?: string
  entityId?: number
  createdAt: string
}

export type DashboardSummary = {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  pendingLeaveRequests: number
  approvedLeaveThisMonth: number
  employeesOnLeaveToday: number
  currentPayrollStatus?: string
  currentPayrollTotal?: number
  activeUsers?: number
  employeesPerDepartment: DashboardDepartmentHeadcount[]
  recentAuditEvents: DashboardAuditEvent[]
}
