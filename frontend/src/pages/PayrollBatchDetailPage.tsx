import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useRouter } from '@tanstack/react-router'

import { AppShell } from '../components/AppShell'
import type { PayrollBatchStatus, PayrollEntry } from '../types/payroll'

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function statusChipColor(status: PayrollBatchStatus): 'default' | 'warning' | 'success' {
  if (status === 'Draft') return 'warning'
  if (status === 'Approved') return 'success'
  return 'default'
}

function downloadCSV(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  return 0
}

export function PayrollBatchDetailPage() {
  const params = useParams({ strict: false })
  const router = useRouter()
  const navigate = useNavigate()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role ?? ''
  const canManagePayroll = role === 'Admin' || role === 'Finance Officer'

  const batchId = Number(params.batchId)
  const [confirm, setConfirm] = useState<null | 'generate' | 'approve' | 'lock'>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const detailQuery = useQuery({
    queryKey: ['payroll', 'batch', batchId],
    queryFn: () => router.options.context.api.getPayrollBatch(accessToken, batchId),
    enabled: Boolean(accessToken) && canManagePayroll && Number.isFinite(batchId) && batchId > 0,
  })

  const refreshDetail = async () => {
    await router.options.context.queryClient.invalidateQueries({ queryKey: ['payroll', 'batch', batchId] })
    await router.options.context.queryClient.invalidateQueries({ queryKey: ['payroll', 'batches'] })
  }

  const generateMutation = useMutation({
    mutationFn: () => router.options.context.api.generatePayrollEntries(accessToken, batchId),
    onSuccess: async () => {
      await refreshDetail()
      setSnackbar({ message: 'Payroll entries generated', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to generate entries', severity: 'error' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: () => router.options.context.api.approvePayrollBatch(accessToken, batchId),
    onSuccess: async () => {
      await refreshDetail()
      setSnackbar({ message: 'Payroll batch approved', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to approve batch', severity: 'error' })
    },
  })

  const lockMutation = useMutation({
    mutationFn: () => router.options.context.api.lockPayrollBatch(accessToken, batchId),
    onSuccess: async () => {
      await refreshDetail()
      setSnackbar({ message: 'Payroll batch locked', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to lock batch', severity: 'error' })
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => router.options.context.api.exportPayrollBatchCSV(accessToken, batchId),
    onSuccess: (csvText) => {
      const month = detailQuery.data?.batch.month ?? 'batch'
      downloadCSV(`payroll-${month}.csv`, csvText)
      setSnackbar({ message: 'Payroll CSV exported', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to export payroll', severity: 'error' })
    },
  })

  const updateEntryMutation = useMutation({
    mutationFn: ({
      entryId,
      allowancesTotal,
      deductionsTotal,
      taxTotal,
    }: {
      entryId: number
      allowancesTotal: number
      deductionsTotal: number
      taxTotal: number
    }) =>
      router.options.context.api.updatePayrollEntryAmounts(accessToken, entryId, {
        allowancesTotal,
        deductionsTotal,
        taxTotal,
      }),
    onSuccess: async () => {
      await refreshDetail()
      setSnackbar({ message: 'Entry updated', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to update entry', severity: 'error' })
    },
  })

  const batchStatus = detailQuery.data?.batch.status
  const canEditEntries = canManagePayroll && batchStatus === 'Draft'

  const columns = useMemo<GridColDef<PayrollEntry>[]>(
    () => [
      { field: 'employeeName', headerName: 'Employee', minWidth: 180, flex: 0.8 },
      {
        field: 'baseSalary',
        headerName: 'Base',
        minWidth: 120,
        type: 'number',
        valueFormatter: (params) => formatMoney(toNumber(params.value)),
      },
      {
        field: 'allowancesTotal',
        headerName: 'Allowances',
        minWidth: 130,
        type: 'number',
        editable: canEditEntries,
        valueFormatter: (params) => formatMoney(toNumber(params.value)),
      },
      {
        field: 'deductionsTotal',
        headerName: 'Deductions',
        minWidth: 130,
        type: 'number',
        editable: canEditEntries,
        valueFormatter: (params) => formatMoney(toNumber(params.value)),
      },
      {
        field: 'taxTotal',
        headerName: 'Tax',
        minWidth: 110,
        type: 'number',
        editable: canEditEntries,
        valueFormatter: (params) => formatMoney(toNumber(params.value)),
      },
      {
        field: 'grossPay',
        headerName: 'Gross',
        minWidth: 120,
        type: 'number',
        valueFormatter: (params) => formatMoney(toNumber(params.value)),
      },
      {
        field: 'netPay',
        headerName: 'Net',
        minWidth: 120,
        type: 'number',
        valueFormatter: (params) => formatMoney(toNumber(params.value)),
      },
    ],
    [canEditEntries],
  )

  const processRowUpdate = async (newRow: PayrollEntry, oldRow: PayrollEntry): Promise<PayrollEntry> => {
    const allowancesTotal = toNumber(newRow.allowancesTotal)
    const deductionsTotal = toNumber(newRow.deductionsTotal)
    const taxTotal = toNumber(newRow.taxTotal)

    if (
      allowancesTotal === toNumber(oldRow.allowancesTotal) &&
      deductionsTotal === toNumber(oldRow.deductionsTotal) &&
      taxTotal === toNumber(oldRow.taxTotal)
    ) {
      return oldRow
    }

    const updated = await updateEntryMutation.mutateAsync({
      entryId: newRow.id,
      allowancesTotal,
      deductionsTotal,
      taxTotal,
    })

    return {
      ...newRow,
      allowancesTotal: updated.allowancesTotal,
      deductionsTotal: updated.deductionsTotal,
      taxTotal: updated.taxTotal,
      grossPay: updated.grossPay,
      netPay: updated.netPay,
      updatedAt: updated.updatedAt,
    }
  }

  if (!canManagePayroll) {
    return (
      <AppShell title="Payroll">
        <Alert severity="error" sx={{ mb: 2 }}>
          Payroll is restricted to Admin and Finance Officer roles.
        </Alert>
        <Button variant="contained" onClick={() => navigate({ to: '/access-denied' })}>
          Continue
        </Button>
      </AppShell>
    )
  }

  return (
    <AppShell title="Payroll Batch">
      <Stack spacing={2.5}>
        <Button variant="text" sx={{ alignSelf: 'flex-start' }} onClick={() => navigate({ to: '/payroll' })}>
          Back to Payroll Batches
        </Button>

        {detailQuery.isLoading ? (
          <Stack spacing={1.2}>
            <Skeleton variant="rounded" height={100} />
            <Skeleton variant="rounded" height={460} />
          </Stack>
        ) : null}

        {detailQuery.data ? (
          <>
            <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={0.8}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Batch {detailQuery.data.batch.month}
                  </Typography>
                  <Chip
                    size="small"
                    label={detailQuery.data.batch.status}
                    color={statusChipColor(detailQuery.data.batch.status)}
                    sx={{ width: 'fit-content' }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(detailQuery.data.batch.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved: {formatDate(detailQuery.data.batch.approvedAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Locked: {formatDate(detailQuery.data.batch.lockedAt)}
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems="flex-start">
                  <Button
                    variant="outlined"
                    onClick={() => setConfirm('generate')}
                    disabled={detailQuery.data.batch.status !== 'Draft' || generateMutation.isPending}
                  >
                    {detailQuery.data.entries.length > 0 ? 'Regenerate Entries' : 'Generate Entries'}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setConfirm('approve')}
                    disabled={detailQuery.data.batch.status !== 'Draft' || approveMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setConfirm('lock')}
                    disabled={detailQuery.data.batch.status !== 'Approved' || lockMutation.isPending}
                  >
                    Lock
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => exportMutation.mutate()}
                    disabled={
                      (detailQuery.data.batch.status !== 'Approved' && detailQuery.data.batch.status !== 'Locked') ||
                      exportMutation.isPending
                    }
                  >
                    Export CSV
                  </Button>
                </Stack>
              </Stack>
            </Box>

            {detailQuery.data.entries.length === 0 ? (
              <Alert severity="info">No entries generated yet. Use Generate Entries to populate this batch.</Alert>
            ) : (
              <Box sx={{ height: 540, width: '100%' }}>
                <DataGrid<PayrollEntry>
                  rows={detailQuery.data.entries}
                  columns={columns}
                  disableRowSelectionOnClick
                  processRowUpdate={processRowUpdate}
                  onProcessRowUpdateError={(error) => {
                    setSnackbar({ message: (error as Error).message || 'Failed to update row', severity: 'error' })
                  }}
                  sx={{
                    borderRadius: 2,
                    '& .MuiDataGrid-columnHeaders': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      backgroundColor: 'background.paper',
                    },
                  }}
                />
              </Box>
            )}
          </>
        ) : null}
      </Stack>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirm === 'generate'
              ? 'This will regenerate all payroll entries for active employees in this batch. Continue?'
              : null}
            {confirm === 'approve' ? 'This will move the batch from Draft to Approved and make entries read-only.' : null}
            {confirm === 'lock' ? 'This will lock the approved batch permanently. Continue?' : null}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const action = confirm
              setConfirm(null)
              if (action === 'generate') {
                await generateMutation.mutateAsync()
              }
              if (action === 'approve') {
                await approveMutation.mutateAsync()
              }
              if (action === 'lock') {
                await lockMutation.mutateAsync()
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.message}</Alert> : <span />}
      </Snackbar>
    </AppShell>
  )
}
