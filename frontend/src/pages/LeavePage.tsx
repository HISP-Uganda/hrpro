import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { AppShell } from '../components/AppShell'
import { isHROrAdminRole } from '../auth/roles'
import type { ApplyLeaveInput, LeaveRequest } from '../types/leave'

function calculatePreviewWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0
  }

  let days = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const weekday = cursor.getDay()
    if (weekday !== 0 && weekday !== 6) {
      days += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function toDateOnly(value: string): string {
  return value ? value.slice(0, 10) : ''
}

function statusColor(status: LeaveRequest['status']): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'Approved') return 'success'
  if (status === 'Pending') return 'warning'
  if (status === 'Rejected') return 'error'
  return 'default'
}

export function LeavePage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role ?? ''
  const isAdminOrHR = isHROrAdminRole(role)

  const [tab, setTab] = useState(0)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const [applyForm, setApplyForm] = useState<ApplyLeaveInput>({
    leaveTypeId: 0,
    startDate: '',
    endDate: '',
    reason: '',
  })

  const [queueStatusFilter, setQueueStatusFilter] = useState('Pending')
  const [queueDateFrom, setQueueDateFrom] = useState('')
  const [queueDateTo, setQueueDateTo] = useState('')

  const [lockedYear, setLockedYear] = useState<number>(new Date().getFullYear())
  const [lockDate, setLockDate] = useState('')
  const [lockReason, setLockReason] = useState('')

  const previewDays = useMemo(
    () => calculatePreviewWorkingDays(applyForm.startDate, applyForm.endDate),
    [applyForm.startDate, applyForm.endDate],
  )

  const leaveTypesQuery = useQuery({
    queryKey: ['leave', 'types'],
    queryFn: () => router.options.context.api.listLeaveTypes(accessToken, true),
    enabled: Boolean(accessToken),
  })

  const myBalanceQuery = useQuery({
    queryKey: ['leave', 'my-balance', lockedYear],
    queryFn: () => router.options.context.api.getMyLeaveBalance(accessToken, lockedYear),
    enabled: Boolean(accessToken),
  })

  const myRequestsQuery = useQuery({
    queryKey: ['leave', 'my-requests'],
    queryFn: () => router.options.context.api.listMyLeaveRequests(accessToken),
    enabled: Boolean(accessToken),
  })

  const queueQuery = useQuery({
    queryKey: ['leave', 'queue', queueStatusFilter, queueDateFrom, queueDateTo],
    queryFn: () =>
      router.options.context.api.listAllLeaveRequests(accessToken, {
        status: queueStatusFilter,
        dateFrom: queueDateFrom || undefined,
        dateTo: queueDateTo || undefined,
      }),
    enabled: Boolean(accessToken) && isAdminOrHR,
  })

  const lockedDatesQuery = useQuery({
    queryKey: ['leave', 'locked-dates', lockedYear],
    queryFn: () => router.options.context.api.listLockedDates(accessToken, lockedYear),
    enabled: Boolean(accessToken) && isAdminOrHR,
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      router.options.context.api.applyLeave(accessToken, {
        leaveTypeId: applyForm.leaveTypeId,
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        reason: applyForm.reason,
      }),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-requests'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-balance'] })
      setApplyForm({ leaveTypeId: 0, startDate: '', endDate: '', reason: '' })
      setSnackbar({ message: 'Leave request submitted', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to submit leave request', severity: 'error' })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => router.options.context.api.cancelLeave(accessToken, id),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-requests'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'queue'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-balance'] })
      setSnackbar({ message: 'Leave request cancelled', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to cancel request', severity: 'error' })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => router.options.context.api.approveLeave(accessToken, id),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'queue'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-requests'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-balance'] })
      setSnackbar({ message: 'Leave approved', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to approve leave', severity: 'error' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => router.options.context.api.rejectLeave(accessToken, id),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'queue'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'my-requests'] })
      setSnackbar({ message: 'Leave rejected', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to reject leave', severity: 'error' })
    },
  })

  const lockMutation = useMutation({
    mutationFn: () => router.options.context.api.lockDate(accessToken, lockDate, lockReason),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'locked-dates'] })
      setLockDate('')
      setLockReason('')
      setSnackbar({ message: 'Date locked', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to lock date', severity: 'error' })
    },
  })

  const unlockMutation = useMutation({
    mutationFn: (date: string) => router.options.context.api.unlockDate(accessToken, date),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['leave', 'locked-dates'] })
      setSnackbar({ message: 'Date unlocked', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to unlock date', severity: 'error' })
    },
  })

  const canSubmitApply =
    applyForm.leaveTypeId > 0 &&
    Boolean(applyForm.startDate) &&
    Boolean(applyForm.endDate) &&
    previewDays > 0 &&
    !applyMutation.isPending

  return (
    <AppShell title="Leave">
      <Stack spacing={3}>
        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Leave Balance Snapshot
            </Typography>
            {myBalanceQuery.isLoading ? <CircularProgress size={20} sx={{ mt: 1 }} /> : null}
            {myBalanceQuery.data ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                <Chip label={`Total: ${myBalanceQuery.data.totalDays}`} color="default" />
                <Chip label={`Reserved: ${myBalanceQuery.data.reservedDays}`} color="default" />
                <Chip label={`Approved: ${myBalanceQuery.data.approvedDays}`} color="success" />
                <Chip label={`Pending: ${myBalanceQuery.data.pendingDays}`} color="warning" />
                <Chip label={`Available: ${myBalanceQuery.data.availableDays}`} color="primary" />
              </Stack>
            ) : null}
          </CardContent>
        </Card>

        <Card elevation={1} sx={{ borderRadius: 3 }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, pt: 1 }}>
            <Tab label="Apply Leave" />
            <Tab label="My Requests" />
            {isAdminOrHR ? <Tab label="Admin Queue" /> : null}
            {isAdminOrHR ? <Tab label="Locked Dates" /> : null}
          </Tabs>

          <CardContent>
            {tab === 0 ? (
              <Stack spacing={2}>
                <Typography variant="h6">Apply for Leave</Typography>
                <TextField
                  select
                  label="Leave Type"
                  value={applyForm.leaveTypeId || ''}
                  onChange={(event) => setApplyForm((prev) => ({ ...prev, leaveTypeId: Number(event.target.value) }))}
                  fullWidth
                >
                  {leaveTypesQuery.data?.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={applyForm.startDate}
                    onChange={(event) => setApplyForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={applyForm.endDate}
                    onChange={(event) => setApplyForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="Reason"
                  value={applyForm.reason}
                  onChange={(event) => setApplyForm((prev) => ({ ...prev, reason: event.target.value }))}
                  multiline
                  minRows={3}
                  fullWidth
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Working days preview: <strong>{previewDays}</strong>
                  </Typography>
                  <Button variant="contained" onClick={() => applyMutation.mutate()} disabled={!canSubmitApply}>
                    {applyMutation.isPending ? 'Submitting...' : 'Submit Leave Request'}
                  </Button>
                </Box>
              </Stack>
            ) : null}

            {tab === 1 ? (
              <Stack spacing={2}>
                <Typography variant="h6">My Leave Requests</Typography>
                {myRequestsQuery.data && myRequestsQuery.data.length === 0 ? (
                  <Alert severity="info">No leave requests yet.</Alert>
                ) : null}

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(myRequestsQuery.data ?? []).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.leaveTypeName}</TableCell>
                        <TableCell>{toDateOnly(request.startDate)}</TableCell>
                        <TableCell>{toDateOnly(request.endDate)}</TableCell>
                        <TableCell>{request.workingDays}</TableCell>
                        <TableCell>
                          <Chip size="small" color={statusColor(request.status)} label={request.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            disabled={request.status !== 'Pending' || cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(request.id)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            ) : null}

            {isAdminOrHR && tab === 2 ? (
              <Stack spacing={2}>
                <Typography variant="h6">Pending Approval Queue</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    select
                    label="Status"
                    value={queueStatusFilter}
                    onChange={(event) => setQueueStatusFilter(event.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="From"
                    type="date"
                    value={queueDateFrom}
                    onChange={(event) => setQueueDateFrom(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="To"
                    type="date"
                    value={queueDateTo}
                    onChange={(event) => setQueueDateTo(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>

                {(queueQuery.data ?? []).length === 0 ? <Alert severity="info">No requests matched this filter.</Alert> : null}

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date Range</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(queueQuery.data ?? []).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.employeeName}</TableCell>
                        <TableCell>{request.leaveTypeName}</TableCell>
                        <TableCell>
                          {toDateOnly(request.startDate)} to {toDateOnly(request.endDate)}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" color={statusColor(request.status)} label={request.status} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => approveMutation.mutate(request.id)}
                              disabled={request.status !== 'Pending' || approveMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => rejectMutation.mutate(request.id)}
                              disabled={request.status !== 'Pending' || rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            ) : null}

            {isAdminOrHR && tab === 3 ? (
              <Stack spacing={2}>
                <Typography variant="h6">Locked Dates Planner</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    type="number"
                    label="Year"
                    value={lockedYear}
                    onChange={(event) => setLockedYear(Number(event.target.value) || new Date().getFullYear())}
                    sx={{ maxWidth: 160 }}
                  />
                  <TextField
                    label="Date"
                    type="date"
                    value={lockDate}
                    onChange={(event) => setLockDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Reason"
                    value={lockReason}
                    onChange={(event) => setLockReason(event.target.value)}
                    sx={{ minWidth: 220 }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => lockMutation.mutate()}
                    disabled={!lockDate || lockMutation.isPending}
                  >
                    {lockMutation.isPending ? 'Locking...' : 'Lock Date'}
                  </Button>
                </Stack>

                {(lockedDatesQuery.data ?? []).length === 0 ? <Alert severity="info">No locked dates for this year.</Alert> : null}

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(lockedDatesQuery.data ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{toDateOnly(item.date)}</TableCell>
                        <TableCell>{item.reason || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => unlockMutation.mutate(toDateOnly(item.date))}
                            disabled={unlockMutation.isPending}
                          >
                            Unlock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            ) : null}
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3500}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar?.severity ?? 'success'} onClose={() => setSnackbar(null)}>
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </AppShell>
  )
}
