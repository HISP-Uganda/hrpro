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
