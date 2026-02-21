export type AttendanceStatus = 'unmarked' | 'present' | 'late' | 'field' | 'absent' | 'leave'

export type AttendanceRecord = {
  id: number
  attendanceDate: string
  employeeId: number
  status: AttendanceStatus
  markedByUserId: number
  markedAt: string
  isLocked: boolean
  lockReason?: string
  createdAt: string
  updatedAt: string
}

export type AttendanceRow = {
  employeeId: number
  employeeName: string
  departmentName?: string
  attendanceId?: number
  status: AttendanceStatus
  isLocked: boolean
  canPostToLeave: boolean
  canEdit: boolean
  markedByUserId?: number
  markedAt?: string
}

export type LunchSummary = {
  attendanceDate: string
  staffPresentCount: number
  staffFieldCount: number
  visitorsCount: number
  totalPlates: number
  plateCostAmount: number
  totalCostAmount: number
  staffContributionAmount: number
  staffContributionTotal: number
  organizationBalance: number
  canEditVisitors: boolean
}

export type PostAbsentToLeaveResult = {
  success: boolean
  message: string
  leaveId?: number
  status: AttendanceStatus
}
