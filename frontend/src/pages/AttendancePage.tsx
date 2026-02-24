import { useEffect, useMemo, useState } from 'react'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { type GridColDef } from '@mui/x-data-grid'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { isAttendanceManagerRole, isStaffRole } from '../auth/roles'
import { AppDataGrid } from '../components/AppDataGrid'
import { AppShell } from '../components/AppShell'
import type { AttendanceRow, AttendanceStatus } from '../types/attendance'

function statusChipColor(status: AttendanceStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (status === 'present') return 'success'
  if (status === 'late') return 'warning'
  if (status === 'field') return 'info'
  if (status === 'absent') return 'error'
  if (status === 'leave') return 'default'
  return 'default'
}

function toLabel(status: AttendanceStatus): string {
  if (status === 'unmarked') return 'Unmarked'
  if (status === 'present') return 'Present'
  if (status === 'late') return 'Late'
  if (status === 'field') return 'Field'
  if (status === 'absent') return 'Absent'
  return 'Leave'
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
})

export function AttendancePage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role ?? ''
  const isManager = isAttendanceManagerRole(role)
  const staffOnly = isStaffRole(role)

  const [tab, setTab] = useState(0)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [lunchDate, setLunchDate] = useState(new Date().toISOString().slice(0, 10))
  const [visitorsCount, setVisitorsCount] = useState(0)
  const [postTarget, setPostTarget] = useState<AttendanceRow | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const attendanceQuery = useQuery({
    queryKey: ['attendance', 'by-date', date],
    queryFn: () => router.options.context.api.listAttendanceByDate(accessToken, date),
    enabled: Boolean(accessToken),
  })

  const lunchQuery = useQuery({
    queryKey: ['attendance', 'lunch', lunchDate],
    queryFn: () => router.options.context.api.getLunchSummary(accessToken, lunchDate),
    enabled: Boolean(accessToken) && !staffOnly,
  })

  const markMutation = useMutation({
    mutationFn: ({ employeeId, status }: { employeeId: number; status: AttendanceStatus }) =>
      router.options.context.api.upsertAttendance(accessToken, date, employeeId, status),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['attendance', 'by-date', date] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['attendance', 'lunch', date] })
      setSnackbar({ message: 'Attendance updated', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to update attendance', severity: 'error' })
    },
  })

  const postMutation = useMutation({
    mutationFn: (employeeId: number) => router.options.context.api.postAbsentToLeave(accessToken, date, employeeId),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['attendance', 'by-date', date] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['attendance', 'lunch', date] })
      setPostTarget(null)
      setSnackbar({ message: 'Absent posted to leave', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to post absent to leave', severity: 'error' })
    },
  })

  const visitorsMutation = useMutation({
    mutationFn: () => router.options.context.api.upsertLunchVisitors(accessToken, lunchDate, visitorsCount),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['attendance', 'lunch', lunchDate] })
      setSnackbar({ message: 'Visitors updated', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to update visitors', severity: 'error' })
    },
  })

  const rows = attendanceQuery.data ?? []

  const columns = useMemo<GridColDef[]>(() => {
    return [
      { field: 'employeeName', headerName: 'Employee Name', flex: 1.3, minWidth: 180 },
      {
        field: 'departmentName',
        headerName: 'Department',
        flex: 1,
        minWidth: 140,
        valueGetter: (params) => params.row.departmentName || 'Unassigned',
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 140,
        renderCell: ({ row }) => <Chip size="small" label={toLabel(row.status)} color={statusChipColor(row.status)} />,
      },
      {
        field: 'isLocked',
        headerName: 'Lock',
        minWidth: 120,
        renderCell: ({ row }) =>
          row.isLocked ? <Chip size="small" color="warning" label="Locked" /> : <Chip size="small" label="Open" />,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 520,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          if (!isManager) {
            return <Typography variant="body2" color="text.secondary">Read-only</Typography>
          }

          const disabled = markMutation.isPending || postMutation.isPending || !row.canEdit
          return (
            <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
              <Button size="small" variant="outlined" disabled={disabled} onClick={() => markMutation.mutate({ employeeId: row.employeeId, status: 'present' })}>Present</Button>
              <Button size="small" variant="outlined" disabled={disabled} onClick={() => markMutation.mutate({ employeeId: row.employeeId, status: 'late' })}>Late</Button>
              <Button size="small" variant="outlined" disabled={disabled} onClick={() => markMutation.mutate({ employeeId: row.employeeId, status: 'field' })}>Field</Button>
              <Button size="small" variant="outlined" color="error" disabled={disabled} onClick={() => markMutation.mutate({ employeeId: row.employeeId, status: 'absent' })}>Absent</Button>
              <Button size="small" variant="outlined" disabled={disabled} onClick={() => markMutation.mutate({ employeeId: row.employeeId, status: 'leave' })}>Leave</Button>
              {row.status === 'absent' ? (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EventBusyOutlinedIcon />}
                  disabled={postMutation.isPending}
                  onClick={() => setPostTarget(row)}
                >
                  Post Absent to Leave
                </Button>
              ) : null}
            </Stack>
          )
        },
      },
    ]
  }, [isManager, markMutation.isPending, postMutation.isPending])

  const lunchSummary = lunchQuery.data
  useEffect(() => {
    if (lunchSummary) {
      setVisitorsCount(lunchSummary.visitorsCount)
    }
  }, [lunchSummary])

  return (
    <AppShell title="Attendance">
      <Stack spacing={3}>
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, pt: 1 }}>
            <Tab label={staffOnly ? 'My Attendance' : 'Daily Register'} icon={<CheckCircleOutlineIcon />} iconPosition="start" />
            {!staffOnly ? <Tab label="Lunch & Catering" icon={<RestaurantOutlinedIcon />} iconPosition="start" /> : null}
          </Tabs>

          <CardContent>
            {tab === 0 ? (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                  <TextField
                    label="Attendance Date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ maxWidth: 220 }}
                  />
                  {isManager ? (
                    <Typography variant="body2" color="text.secondary">
                      First mark locks the row. Admin override is enabled for locked edits.
                    </Typography>
                  ) : null}
                </Stack>

                {attendanceQuery.isLoading ? <Skeleton variant="rounded" height={360} /> : null}
                {attendanceQuery.isError ? <Alert severity="error">{(attendanceQuery.error as Error).message}</Alert> : null}

                {!attendanceQuery.isLoading && !attendanceQuery.isError && rows.length === 0 ? (
                  <Alert severity="info">No employees available for this date.</Alert>
                ) : null}

                {!attendanceQuery.isLoading && !attendanceQuery.isError ? (
                  <Box sx={{ height: 460, width: '100%' }}>
                    <AppDataGrid
                      rows={rows}
                      columns={columns}
                      getRowId={(row) => row.employeeId}
                      disableRowSelectionOnClick
                      pageSizeOptions={[10, 25, 50]}
                      initialState={{
                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                      }}
                    />
                  </Box>
                ) : null}
              </Stack>
            ) : null}

            {!staffOnly && tab === 1 ? (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems="center">
                  <TextField
                    label="Lunch Date"
                    type="date"
                    value={lunchDate}
                    onChange={(event) => setLunchDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ maxWidth: 220 }}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      label="Visitors"
                      type="number"
                      value={visitorsCount}
                      onChange={(event) => setVisitorsCount(Number(event.target.value || 0))}
                      size="small"
                      inputProps={{ min: 0 }}
                      sx={{ width: 140 }}
                      disabled={!lunchSummary?.canEditVisitors || visitorsMutation.isPending}
                    />
                    <Button
                      variant="contained"
                      onClick={() => visitorsMutation.mutate()}
                      disabled={!lunchSummary?.canEditVisitors || visitorsMutation.isPending}
                    >
                      Save Visitors
                    </Button>
                  </Stack>
                </Stack>

                {lunchQuery.isLoading ? <Skeleton variant="rounded" height={220} /> : null}
                {lunchQuery.isError ? <Alert severity="error">{(lunchQuery.error as Error).message}</Alert> : null}

                {lunchSummary ? (
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Staff Present</Typography><Typography variant="h5">{lunchSummary.staffPresentCount}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Staff in Field</Typography><Typography variant="h5">{lunchSummary.staffFieldCount}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Visitors</Typography><Typography variant="h5">{lunchSummary.visitorsCount}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Total Plates</Typography><Typography variant="h5">{lunchSummary.totalPlates}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Total Cost</Typography><Typography variant="h5">{currency.format(lunchSummary.totalCostAmount)}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Staff Contribution</Typography><Typography variant="h5">{currency.format(lunchSummary.staffContributionTotal)}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack spacing={0.5}><Typography variant="body2" color="text.secondary">Organization Balance</Typography><Typography variant="h5">{currency.format(lunchSummary.organizationBalance)}</Typography></Stack></CardContent></Card>
                    <Card variant="outlined"><CardContent><Stack direction="row" spacing={1} alignItems="center"><ScheduleOutlinedIcon fontSize="small" /><Typography variant="body2" color="text.secondary">Date: {lunchSummary.attendanceDate}</Typography></Stack></CardContent></Card>
                  </Box>
                ) : null}
              </Stack>
            ) : null}
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={Boolean(postTarget)} onClose={() => setPostTarget(null)}>
        <DialogTitle>Post Absent To Leave</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Convert {postTarget?.employeeName ?? 'this employee'} from Absent to Leave for {date}? This will run leave validation rules.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<FlightTakeoffOutlinedIcon />}
            disabled={postMutation.isPending || !postTarget}
            onClick={() => {
              if (!postTarget) {
                return
              }
              postMutation.mutate(postTarget.employeeId)
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar ? <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>{snackbar.message}</Alert> : <Box />}
      </Snackbar>
    </AppShell>
  )
}
