export type PayrollBatchStatus = 'Draft' | 'Approved' | 'Locked'

export type PayrollBatch = {
  id: number
  month: string
  status: PayrollBatchStatus
  createdBy: number
  createdAt: string
  approvedBy?: number
  approvedAt?: string
  lockedAt?: string
}

export type PayrollEntry = {
  id: number
  batchId: number
  employeeId: number
  employeeName: string
  baseSalary: number
  allowancesTotal: number
  deductionsTotal: number
  taxTotal: number
  grossPay: number
  netPay: number
  createdAt: string
  updatedAt: string
}

export type PayrollBatchDetail = {
  batch: PayrollBatch
  entries: PayrollEntry[]
}

export type ListPayrollBatchesFilter = {
  month?: string
  status?: PayrollBatchStatus | ''
  page?: number
  pageSize?: number
}

export type ListPayrollBatchesResult = {
  items: PayrollBatch[]
  totalCount: number
  page: number
  pageSize: number
}

export type UpdatePayrollEntryAmountsInput = {
  allowancesTotal: number
  deductionsTotal: number
  taxTotal: number
}
