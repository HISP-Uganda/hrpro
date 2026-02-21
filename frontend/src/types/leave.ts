export type LeaveType = {
  id: number
  name: string
  paid: boolean
  countsTowardEntitlement: boolean
  requiresAttachment: boolean
  requiresApproval: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export type LeaveLockedDate = {
  id: number
  date: string
  reason?: string
  createdBy?: number
  createdAt: string
}

export type LeaveEntitlement = {
  id: number
  employeeId: number
  year: number
  totalDays: number
  reservedDays: number
  createdAt: string
  updatedAt: string
}

export type LeaveBalance = {
  employeeId: number
  year: number
  totalDays: number
  reservedDays: number
  approvedDays: number
  pendingDays: number
  availableDays: number
}

export type LeaveRequest = {
  id: number
  employeeId: number
  employeeName: string
  departmentName?: string
  leaveTypeId: number
  leaveTypeName: string
  startDate: string
  endDate: string
  workingDays: number
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
  reason?: string
  approvedBy?: number
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export type LeaveTypeUpsertInput = {
  name: string
  paid: boolean
  countsTowardEntitlement: boolean
  requiresAttachment: boolean
  requiresApproval: boolean
}

export type UpsertEntitlementInput = {
  employeeId: number
  year: number
  totalDays: number
  reservedDays: number
}

export type ApplyLeaveInput = {
  leaveTypeId: number
  startDate: string
  endDate: string
  reason?: string
}

export type ListLeaveRequestsFilter = {
  status?: string
  dateFrom?: string
  dateTo?: string
  employee?: string
  leaveType?: string
  dept?: string
}
