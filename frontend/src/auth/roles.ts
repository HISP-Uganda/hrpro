export function normalizeRole(role: string | null | undefined): string {
  return (role ?? '').trim().toLowerCase().replace(/\s+/g, '_')
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'admin'
}

export function isHROrAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'hr_officer'
}

export function isFinanceOrAdminRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'finance_officer'
}

export function isStaffRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'staff'
}

export function isAttendanceManagerRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'hr_officer'
}

export function canAccessEmployeeReportRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'hr_officer' || normalized === 'finance_officer' || normalized === 'viewer'
}

export function canAccessLeaveReportRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'hr_officer' || normalized === 'viewer'
}

export function canAccessAttendanceReportRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'admin' || normalized === 'hr_officer' || normalized === 'viewer'
}

export function canAccessPayrollReportRole(role: string | null | undefined): boolean {
  return isFinanceOrAdminRole(role)
}

export function canAccessAuditReportRole(role: string | null | undefined): boolean {
  return isAdminRole(role)
}

export function canAccessAnyReportRole(role: string | null | undefined): boolean {
  return (
    canAccessEmployeeReportRole(role) ||
    canAccessLeaveReportRole(role) ||
    canAccessAttendanceReportRole(role) ||
    canAccessPayrollReportRole(role) ||
    canAccessAuditReportRole(role)
  )
}
