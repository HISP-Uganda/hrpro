export type AuditLog = {
  id: number
  actorUserId: number | null
  action: string
  entityType: string | null
  entityId: number | null
  metadata: string
  createdAt: string
}

export type ListAuditLogsQuery = {
  page: number
  pageSize: number
  q?: string
}

export type ListAuditLogsResult = {
  items: AuditLog[]
  totalCount: number
  page: number
  pageSize: number
}
