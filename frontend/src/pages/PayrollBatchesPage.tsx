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
  TextField,
  Typography,
  MenuItem,
} from '@mui/material'
import {
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
} from '@mui/x-data-grid'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import { AppShell } from '../components/AppShell'
import { AppDataGrid, AppDataGridToolbar } from '../components/AppDataGrid'
import { isFinanceOrAdminRole } from '../auth/roles'
import type { PayrollBatch, PayrollBatchStatus } from '../types/payroll'

function statusChipColor(status: PayrollBatchStatus): 'default' | 'warning' | 'success' {
  if (status === 'Draft') return 'warning'
  if (status === 'Approved') return 'success'
  return 'default'
}

function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

export function PayrollBatchesPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role ?? ''
  const canManagePayroll = isFinanceOrAdminRole(role)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<PayrollBatchStatus | ''>('')
  const [month, setMonth] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [createMonth, setCreateMonth] = useState('')
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    approvedBy: false,
  })
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const batchesQuery = useQuery({
    queryKey: ['payroll', 'batches', page, pageSize, status, month],
    queryFn: () =>
      router.options.context.api.listPayrollBatches(accessToken, {
        page: page + 1,
        pageSize,
        status,
        month: month || undefined,
      }),
    enabled: Boolean(accessToken) && canManagePayroll,
  })

  const createBatchMutation = useMutation({
    mutationFn: () => router.options.context.api.createPayrollBatch(accessToken, createMonth),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['payroll', 'batches'] })
      setOpenCreate(false)
      setCreateMonth('')
      setSnackbar({ message: 'Payroll batch created', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to create payroll batch', severity: 'error' })
    },
  })

  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page, pageSize }),
    [page, pageSize],
  )

  const existingMonths = new Set((batchesQuery.data?.items ?? []).map((item) => item.month))
  const monthExists = createMonth !== '' && existingMonths.has(createMonth)

  const columns = useMemo<GridColDef<PayrollBatch>[]>(
    () => [
      { field: 'month', headerName: 'Month', width: 140, minWidth: 120, flex: 0.3 },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        renderCell: (params) => <Chip size="small" color={statusChipColor(params.row.status)} label={params.row.status} />,
      },
      {
        field: 'createdAt',
        headerName: 'Created At',
        minWidth: 180,
        flex: 0.6,
        valueFormatter: (params) => formatDate(String(params.value ?? '')),
      },
      {
        field: 'approvedAt',
        headerName: 'Approved At',
        minWidth: 180,
        flex: 0.6,
        valueFormatter: (params) => formatDate(String(params.value ?? '')),
      },
      {
        field: 'lockedAt',
        headerName: 'Locked At',
        minWidth: 180,
        flex: 0.6,
        valueFormatter: (params) => formatDate(String(params.value ?? '')),
      },
      {
        field: 'approvedBy',
        headerName: 'Approved By',
        minWidth: 120,
        flex: 0.3,
      },
      {
        field: 'actions',
        headerName: 'Action',
        sortable: false,
        filterable: false,
        width: 130,
        renderCell: (params) => (
          <Button variant="outlined" size="small" onClick={() => navigate({ to: '/payroll/$batchId', params: { batchId: String(params.row.id) } })}>
            Open
          </Button>
        ),
      },
    ],
    [navigate],
  )

  return (
    <AppShell title="Payroll">
      <Stack spacing={2.5}>
        {!canManagePayroll ? (
          <Alert severity="error">Payroll is restricted to Admin and Finance Officer roles.</Alert>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Payroll Batches
          </Typography>
          <Button variant="contained" onClick={() => setOpenCreate(true)} disabled={!canManagePayroll}>
            Create Batch
          </Button>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Month"
            type="month"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value)
              setPage(0)
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', md: 220 } }}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PayrollBatchStatus | '')
              setPage(0)
            }}
            sx={{ width: { xs: '100%', md: 220 } }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Locked">Locked</MenuItem>
          </TextField>
        </Stack>

        <Box sx={{ height: 560, width: '100%' }}>
          {batchesQuery.isLoading ? (
            <Stack spacing={1.2}>
              <Skeleton variant="rounded" height={52} />
              <Skeleton variant="rounded" height={420} />
            </Stack>
          ) : null}

          {!batchesQuery.isLoading ? (
            <AppDataGrid<PayrollBatch>
              rows={batchesQuery.data?.items ?? []}
              columns={columns}
              disableRowSelectionOnClick
              paginationMode="server"
              rowCount={batchesQuery.data?.totalCount ?? 0}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) => {
                setPage(model.page)
                setPageSize(model.pageSize)
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              slots={{ toolbar: AppDataGridToolbar }}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
              sx={{
                borderRadius: 2,
                '& .MuiDataGrid-cell': { alignItems: 'center' },
              }}
            />
          ) : null}
        </Box>
      </Stack>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create Payroll Batch</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Month"
              type="month"
              value={createMonth}
              onChange={(event) => setCreateMonth(event.target.value)}
              InputLabelProps={{ shrink: true }}
              error={monthExists}
              helperText={monthExists ? 'A batch for this month already exists in the current list.' : 'Use YYYY-MM format.'}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={createBatchMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => createBatchMutation.mutate()}
            disabled={!createMonth || monthExists || createBatchMutation.isPending}
          >
            {createBatchMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.message}</Alert> : <span />}
      </Snackbar>
    </AppShell>
  )
}
