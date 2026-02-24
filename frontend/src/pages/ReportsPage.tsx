import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import {
  canAccessAttendanceReportRole,
  canAccessAuditReportRole,
  canAccessEmployeeReportRole,
  canAccessLeaveReportRole,
  canAccessPayrollReportRole,
} from '../auth/roles'
import { AppDataGrid, AppDataGridToolbar } from '../components/AppDataGrid'
import { AppShell } from '../components/AppShell'
import { saveExportWithDialog } from '../lib/exportSave'
import type { Department } from '../types/departments'
import type { Employee } from '../types/employees'
import type { LeaveType } from '../types/leave'
import type {
  AttendanceSummaryReportFilter,
  AttendanceSummaryReportRow,
  AuditLogReportFilter,
  AuditLogReportRow,
  EmployeeReportFilter,
  EmployeeReportRow,
  LeaveRequestsReportFilter,
  LeaveRequestsReportRow,
  PayrollBatchesReportFilter,
  PayrollBatchesReportRow,
} from '../types/reports'
import type { ManagedUser } from '../types/users'

function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function isAccessDeniedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  return /forbidden|access denied/i.test(error.message)
}

type ReportTab = 'employees' | 'leave' | 'attendance' | 'payroll' | 'audit'

export function ReportsPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role

  const canEmployees = canAccessEmployeeReportRole(role)
  const canLeave = canAccessLeaveReportRole(role)
  const canAttendance = canAccessAttendanceReportRole(role)
  const canPayroll = canAccessPayrollReportRole(role)
  const canAudit = canAccessAuditReportRole(role)

  const tabs = useMemo(
    () => [
      canEmployees ? ({ key: 'employees', label: 'Employees' } as const) : null,
      canLeave ? ({ key: 'leave', label: 'Leave' } as const) : null,
      canAttendance ? ({ key: 'attendance', label: 'Attendance' } as const) : null,
      canPayroll ? ({ key: 'payroll', label: 'Payroll' } as const) : null,
      canAudit ? ({ key: 'audit', label: 'Audit' } as const) : null,
    ].filter(Boolean) as Array<{ key: ReportTab; label: string }>,
    [canAttendance, canAudit, canEmployees, canLeave, canPayroll],
  )

  const [activeTab, setActiveTab] = useState<ReportTab>(tabs[0]?.key ?? 'employees')

  useEffect(() => {
    if (!tabs.find((tab) => tab.key === activeTab) && tabs[0]) {
      setActiveTab(tabs[0].key)
    }
  }, [activeTab, tabs])

  const [employeeFilters, setEmployeeFilters] = useState<EmployeeReportFilter>({})
  const [leaveFilters, setLeaveFilters] = useState<LeaveRequestsReportFilter>({
    dateFrom: daysAgoISO(30),
    dateTo: todayISO(),
  })
  const [attendanceFilters, setAttendanceFilters] = useState<AttendanceSummaryReportFilter>({
    dateFrom: daysAgoISO(30),
    dateTo: todayISO(),
  })
  const [payrollFilters, setPayrollFilters] = useState<PayrollBatchesReportFilter>({})
  const [auditFilters, setAuditFilters] = useState<AuditLogReportFilter>({
    dateFrom: daysAgoISO(30),
    dateTo: todayISO(),
  })

  const [employeePager, setEmployeePager] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [leavePager, setLeavePager] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [attendancePager, setAttendancePager] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [payrollPager, setPayrollPager] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [auditPager, setAuditPager] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })

  const [snackbar, setSnackbar] = useState<{ severity: 'success' | 'error' | 'info'; message: string } | null>(null)

  const saveExport = async (result: { filename: string; data: string; mimeType: string }) => {
    const saveResult = await saveExportWithDialog(router.options.context.api, result)
    if (saveResult.cancelled) {
      setSnackbar({ severity: 'info', message: 'Save cancelled' })
      return
    }
    setSnackbar({ severity: 'success', message: `Saved: ${saveResult.savedPath || result.filename}` })
  }

  const departmentsQuery = useQuery({
    queryKey: ['reports', 'departments'],
    queryFn: () => router.options.context.api.listDepartments(accessToken, { page: 1, pageSize: 100 }),
    enabled: Boolean(accessToken),
  })

  const employeesQuery = useQuery({
    queryKey: ['reports', 'employees-options'],
    queryFn: () => router.options.context.api.listEmployees(accessToken, { page: 1, pageSize: 100 }),
    enabled: Boolean(accessToken),
  })

  const leaveTypesQuery = useQuery({
    queryKey: ['reports', 'leave-types'],
    queryFn: () => router.options.context.api.listLeaveTypes(accessToken, true),
    enabled: Boolean(accessToken) && canLeave,
  })

  const usersQuery = useQuery({
    queryKey: ['reports', 'users-options'],
    queryFn: () => router.options.context.api.listUsers(accessToken, { page: 1, pageSize: 100 }),
    enabled: Boolean(accessToken) && canAudit,
  })

  const employeeReportQuery = useQuery({
    queryKey: ['reports', 'employee', employeeFilters, employeePager.page, employeePager.pageSize],
    queryFn: () =>
      router.options.context.api.listEmployeeReport(accessToken, employeeFilters, {
        page: employeePager.page + 1,
        pageSize: employeePager.pageSize,
      }),
    enabled: Boolean(accessToken) && canEmployees && activeTab === 'employees',
  })

  const leaveReportQuery = useQuery({
    queryKey: ['reports', 'leave', leaveFilters, leavePager.page, leavePager.pageSize],
    queryFn: () =>
      router.options.context.api.listLeaveRequestsReport(accessToken, leaveFilters, {
        page: leavePager.page + 1,
        pageSize: leavePager.pageSize,
      }),
    enabled: Boolean(accessToken) && canLeave && activeTab === 'leave',
  })

  const attendanceReportQuery = useQuery({
    queryKey: ['reports', 'attendance', attendanceFilters, attendancePager.page, attendancePager.pageSize],
    queryFn: () =>
      router.options.context.api.listAttendanceSummaryReport(accessToken, attendanceFilters, {
        page: attendancePager.page + 1,
        pageSize: attendancePager.pageSize,
      }),
    enabled: Boolean(accessToken) && canAttendance && activeTab === 'attendance',
  })

  const payrollReportQuery = useQuery({
    queryKey: ['reports', 'payroll', payrollFilters, payrollPager.page, payrollPager.pageSize],
    queryFn: () =>
      router.options.context.api.listPayrollBatchesReport(accessToken, payrollFilters, {
        page: payrollPager.page + 1,
        pageSize: payrollPager.pageSize,
      }),
    enabled: Boolean(accessToken) && canPayroll && activeTab === 'payroll',
  })

  const auditReportQuery = useQuery({
    queryKey: ['reports', 'audit', auditFilters, auditPager.page, auditPager.pageSize],
    queryFn: () =>
      router.options.context.api.listAuditLogReport(accessToken, auditFilters, {
        page: auditPager.page + 1,
        pageSize: auditPager.pageSize,
      }),
    enabled: Boolean(accessToken) && canAudit && activeTab === 'audit',
  })

  const exportEmployeeMutation = useMutation({
    mutationFn: () => router.options.context.api.exportEmployeeReportCSV(accessToken, employeeFilters),
    onSuccess: (result) => saveExport(result),
    onError: (error: Error) => setSnackbar({ severity: 'error', message: error.message || 'Export failed' }),
  })

  const exportLeaveMutation = useMutation({
    mutationFn: () => router.options.context.api.exportLeaveRequestsReportCSV(accessToken, leaveFilters),
    onSuccess: (result) => saveExport(result),
    onError: (error: Error) => setSnackbar({ severity: 'error', message: error.message || 'Export failed' }),
  })

  const exportAttendanceMutation = useMutation({
    mutationFn: () => router.options.context.api.exportAttendanceSummaryReportCSV(accessToken, attendanceFilters),
    onSuccess: (result) => saveExport(result),
    onError: (error: Error) => setSnackbar({ severity: 'error', message: error.message || 'Export failed' }),
  })

  const exportPayrollMutation = useMutation({
    mutationFn: () => router.options.context.api.exportPayrollBatchesReportCSV(accessToken, payrollFilters),
    onSuccess: (result) => saveExport(result),
    onError: (error: Error) => setSnackbar({ severity: 'error', message: error.message || 'Export failed' }),
  })

  const exportAuditMutation = useMutation({
    mutationFn: () => router.options.context.api.exportAuditLogReportCSV(accessToken, auditFilters),
    onSuccess: (result) => saveExport(result),
    onError: (error: Error) => setSnackbar({ severity: 'error', message: error.message || 'Export failed' }),
  })

  useEffect(() => {
    const errorsToCheck = [
      employeeReportQuery.error,
      leaveReportQuery.error,
      attendanceReportQuery.error,
      payrollReportQuery.error,
      auditReportQuery.error,
      exportEmployeeMutation.error,
      exportLeaveMutation.error,
      exportAttendanceMutation.error,
      exportPayrollMutation.error,
      exportAuditMutation.error,
    ]

    if (errorsToCheck.some((error) => isAccessDeniedError(error))) {
      void navigate({ to: '/access-denied' })
    }
  }, [
    attendanceReportQuery.error,
    auditReportQuery.error,
    employeeReportQuery.error,
    exportAttendanceMutation.error,
    exportAuditMutation.error,
    exportEmployeeMutation.error,
    exportLeaveMutation.error,
    exportPayrollMutation.error,
    leaveReportQuery.error,
    navigate,
    payrollReportQuery.error,
  ])

  const departments: Department[] = departmentsQuery.data?.items ?? []
  const employees: Employee[] = employeesQuery.data?.items ?? []
  const leaveTypes: LeaveType[] = leaveTypesQuery.data ?? []
  const users: ManagedUser[] = usersQuery.data?.items ?? []

  const employeeColumns = useMemo<GridColDef<EmployeeReportRow>[]>(
    () => [
      { field: 'employeeName', headerName: 'Employee', minWidth: 220, flex: 1.1 },
      { field: 'departmentName', headerName: 'Department', minWidth: 160, flex: 0.8 },
      { field: 'position', headerName: 'Position', minWidth: 160, flex: 0.8 },
      { field: 'status', headerName: 'Status', minWidth: 120, flex: 0.6 },
      { field: 'dateOfHire', headerName: 'Date of Hire', minWidth: 140, flex: 0.6, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'phone', headerName: 'Phone', minWidth: 140, flex: 0.7 },
      { field: 'email', headerName: 'Email', minWidth: 220, flex: 1 },
      {
        field: 'baseSalaryAmount',
        headerName: 'Base Salary',
        minWidth: 140,
        flex: 0.7,
        valueFormatter: (params) => (params.value === null || params.value === undefined ? '-' : Number(params.value).toFixed(2)),
      },
    ],
    [],
  )

  const leaveColumns = useMemo<GridColDef<LeaveRequestsReportRow>[]>(
    () => [
      { field: 'employeeName', headerName: 'Employee', minWidth: 220, flex: 1.1 },
      { field: 'departmentName', headerName: 'Department', minWidth: 160, flex: 0.8 },
      { field: 'leaveType', headerName: 'Leave Type', minWidth: 150, flex: 0.8 },
      { field: 'startDate', headerName: 'Start', minWidth: 120, flex: 0.6, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'endDate', headerName: 'End', minWidth: 120, flex: 0.6, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'workingDays', headerName: 'Days', minWidth: 90, flex: 0.4 },
      { field: 'status', headerName: 'Status', minWidth: 120, flex: 0.6 },
      { field: 'approvedBy', headerName: 'Approved By', minWidth: 160, flex: 0.7, valueGetter: (params) => params.row.approvedBy ?? '-' },
      { field: 'approvedAt', headerName: 'Approved At', minWidth: 130, flex: 0.6, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
    ],
    [],
  )

  const attendanceColumns = useMemo<GridColDef<AttendanceSummaryReportRow>[]>(
    () => [
      { field: 'employeeName', headerName: 'Employee', minWidth: 220, flex: 1.1 },
      { field: 'departmentName', headerName: 'Department', minWidth: 160, flex: 0.8 },
      { field: 'presentCount', headerName: 'Present', minWidth: 100, flex: 0.4 },
      { field: 'lateCount', headerName: 'Late', minWidth: 90, flex: 0.4 },
      { field: 'fieldCount', headerName: 'Field', minWidth: 90, flex: 0.4 },
      { field: 'absentCount', headerName: 'Absent', minWidth: 90, flex: 0.4 },
      { field: 'leaveCount', headerName: 'Leave', minWidth: 90, flex: 0.4 },
      { field: 'unmarkedCount', headerName: 'Unmarked', minWidth: 110, flex: 0.5 },
    ],
    [],
  )

  const payrollColumns = useMemo<GridColDef<PayrollBatchesReportRow>[]>(
    () => [
      { field: 'month', headerName: 'Month', minWidth: 120, flex: 0.6 },
      { field: 'status', headerName: 'Status', minWidth: 120, flex: 0.6 },
      { field: 'createdAt', headerName: 'Created', minWidth: 130, flex: 0.7, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'approvedAt', headerName: 'Approved', minWidth: 130, flex: 0.7, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'lockedAt', headerName: 'Locked', minWidth: 130, flex: 0.7, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'entriesCount', headerName: 'Entries', minWidth: 100, flex: 0.5 },
      {
        field: 'totalNetPay',
        headerName: 'Total Net Pay',
        minWidth: 140,
        flex: 0.8,
        valueFormatter: (params) => Number(params.value ?? 0).toFixed(2),
      },
    ],
    [],
  )

  const auditColumns = useMemo<GridColDef<AuditLogReportRow>[]>(
    () => [
      { field: 'createdAt', headerName: 'Timestamp', minWidth: 160, flex: 0.8, valueFormatter: (params) => formatDate(String(params.value ?? '')) },
      { field: 'actorUsername', headerName: 'Actor', minWidth: 140, flex: 0.7 },
      { field: 'action', headerName: 'Action', minWidth: 220, flex: 1.1 },
      { field: 'entityType', headerName: 'Entity Type', minWidth: 140, flex: 0.7 },
      { field: 'entityId', headerName: 'Entity ID', minWidth: 100, flex: 0.5, valueGetter: (params) => params.row.entityId ?? '-' },
      { field: 'metadataJson', headerName: 'Metadata', minWidth: 260, flex: 1.2 },
    ],
    [],
  )

  return (
    <AppShell title="Reports">
      <Stack spacing={2.5}>
        <Typography variant="body2" color="text.secondary">
          Unmarked count in attendance summary uses calendar days in range (weekends included).
        </Typography>

        <Paper sx={{ p: 1.2 }}>
          <Tabs value={activeTab} onChange={(_, value: ReportTab) => setActiveTab(value)} variant="scrollable" allowScrollButtonsMobile>
            {tabs.map((tab) => (
              <Tab key={tab.key} value={tab.key} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        {activeTab === 'employees' ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                label="Search"
                value={employeeFilters.q ?? ''}
                onChange={(event) => {
                  setEmployeeFilters((prev) => ({ ...prev, q: event.target.value || undefined }))
                  setEmployeePager((prev) => ({ ...prev, page: 0 }))
                }}
                fullWidth
              />
              <TextField
                select
                label="Department"
                value={employeeFilters.departmentId ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setEmployeeFilters((prev) => ({ ...prev, departmentId: value ? Number(value) : undefined }))
                  setEmployeePager((prev) => ({ ...prev, page: 0 }))
                }}
                sx={{ width: { xs: '100%', md: 240 } }}
              >
                <MenuItem value="">All</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={employeeFilters.employmentStatus ?? ''}
                onChange={(event) => {
                  setEmployeeFilters((prev) => ({ ...prev, employmentStatus: event.target.value || undefined }))
                  setEmployeePager((prev) => ({ ...prev, page: 0 }))
                }}
                sx={{ width: { xs: '100%', md: 220 } }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.2}>
              <Button variant="contained" onClick={() => employeeReportQuery.refetch()}>Run Report</Button>
              <Button variant="outlined" disabled={exportEmployeeMutation.isPending} onClick={() => exportEmployeeMutation.mutate()}>
                {exportEmployeeMutation.isPending ? 'Exporting...' : 'Export CSV'}
              </Button>
            </Stack>
            {employeeReportQuery.isError ? <Alert severity="error">Failed to load employee report.</Alert> : null}
            <Box sx={{ height: 560, width: '100%' }}>
              {employeeReportQuery.isLoading ? (
                <Stack spacing={1.2}>
                  <Skeleton variant="rounded" height={52} />
                  <Skeleton variant="rounded" height={420} />
                </Stack>
              ) : (
                <AppDataGrid
                  rows={employeeReportQuery.data?.rows ?? []}
                  getRowId={(row) => `${row.employeeName}-${row.email}-${row.position}`}
                  columns={employeeColumns}
                  rowCount={employeeReportQuery.data?.pager.totalCount ?? 0}
                  paginationMode="server"
                  paginationModel={employeePager}
                  onPaginationModelChange={setEmployeePager}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  slots={{ toolbar: AppDataGridToolbar }}
                />
              )}
            </Box>
          </Stack>
        ) : null}

        {activeTab === 'leave' ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField label="Date From" type="date" value={leaveFilters.dateFrom} onChange={(event) => setLeaveFilters((prev) => ({ ...prev, dateFrom: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Date To" type="date" value={leaveFilters.dateTo} onChange={(event) => setLeaveFilters((prev) => ({ ...prev, dateTo: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField select label="Department" value={leaveFilters.departmentId ?? ''} onChange={(event) => setLeaveFilters((prev) => ({ ...prev, departmentId: event.target.value ? Number(event.target.value) : undefined }))} sx={{ width: { xs: '100%', md: 220 } }}>
                <MenuItem value="">All</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Employee" value={leaveFilters.employeeId ?? ''} onChange={(event) => setLeaveFilters((prev) => ({ ...prev, employeeId: event.target.value ? Number(event.target.value) : undefined }))} sx={{ width: { xs: '100%', md: 240 } }}>
                <MenuItem value="">All</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>{`${employee.firstName} ${employee.lastName}`}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Leave Type" value={leaveFilters.leaveTypeId ?? ''} onChange={(event) => setLeaveFilters((prev) => ({ ...prev, leaveTypeId: event.target.value ? Number(event.target.value) : undefined }))} sx={{ width: { xs: '100%', md: 220 } }}>
                <MenuItem value="">All</MenuItem>
                {leaveTypes.map((leaveType) => (
                  <MenuItem key={leaveType.id} value={leaveType.id}>{leaveType.name}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Status" value={leaveFilters.status ?? ''} onChange={(event) => setLeaveFilters((prev) => ({ ...prev, status: event.target.value || undefined }))} sx={{ width: { xs: '100%', md: 180 } }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.2}>
              <Button variant="contained" onClick={() => leaveReportQuery.refetch()}>Run Report</Button>
              <Button variant="outlined" disabled={exportLeaveMutation.isPending} onClick={() => exportLeaveMutation.mutate()}>{exportLeaveMutation.isPending ? 'Exporting...' : 'Export CSV'}</Button>
            </Stack>
            {leaveReportQuery.isError ? <Alert severity="error">Failed to load leave report.</Alert> : null}
            <Box sx={{ height: 560, width: '100%' }}>
              {leaveReportQuery.isLoading ? (
                <Stack spacing={1.2}>
                  <Skeleton variant="rounded" height={52} />
                  <Skeleton variant="rounded" height={420} />
                </Stack>
              ) : (
                <AppDataGrid
                  rows={leaveReportQuery.data?.rows ?? []}
                  getRowId={(row) => `${row.employeeName}-${row.startDate}-${row.leaveType}-${row.status}`}
                  columns={leaveColumns}
                  rowCount={leaveReportQuery.data?.pager.totalCount ?? 0}
                  paginationMode="server"
                  paginationModel={leavePager}
                  onPaginationModelChange={setLeavePager}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  slots={{ toolbar: AppDataGridToolbar }}
                />
              )}
            </Box>
          </Stack>
        ) : null}

        {activeTab === 'attendance' ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField label="Date From" type="date" value={attendanceFilters.dateFrom} onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, dateFrom: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Date To" type="date" value={attendanceFilters.dateTo} onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, dateTo: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField select label="Department" value={attendanceFilters.departmentId ?? ''} onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, departmentId: event.target.value ? Number(event.target.value) : undefined }))} sx={{ width: { xs: '100%', md: 220 } }}>
                <MenuItem value="">All</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Employee" value={attendanceFilters.employeeId ?? ''} onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, employeeId: event.target.value ? Number(event.target.value) : undefined }))} sx={{ width: { xs: '100%', md: 240 } }}>
                <MenuItem value="">All</MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>{`${employee.firstName} ${employee.lastName}`}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.2}>
              <Button variant="contained" onClick={() => attendanceReportQuery.refetch()}>Run Report</Button>
              <Button variant="outlined" disabled={exportAttendanceMutation.isPending} onClick={() => exportAttendanceMutation.mutate()}>{exportAttendanceMutation.isPending ? 'Exporting...' : 'Export CSV'}</Button>
            </Stack>
            {attendanceReportQuery.isError ? <Alert severity="error">Failed to load attendance report.</Alert> : null}
            <Box sx={{ height: 560, width: '100%' }}>
              {attendanceReportQuery.isLoading ? (
                <Stack spacing={1.2}>
                  <Skeleton variant="rounded" height={52} />
                  <Skeleton variant="rounded" height={420} />
                </Stack>
              ) : (
                <AppDataGrid
                  rows={attendanceReportQuery.data?.rows ?? []}
                  getRowId={(row) => row.employeeId}
                  columns={attendanceColumns}
                  rowCount={attendanceReportQuery.data?.pager.totalCount ?? 0}
                  paginationMode="server"
                  paginationModel={attendancePager}
                  onPaginationModelChange={setAttendancePager}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  slots={{ toolbar: AppDataGridToolbar }}
                />
              )}
            </Box>
          </Stack>
        ) : null}

        {activeTab === 'payroll' ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField label="Month From" type="month" value={payrollFilters.monthFrom ?? ''} onChange={(event) => setPayrollFilters((prev) => ({ ...prev, monthFrom: event.target.value || undefined }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Month To" type="month" value={payrollFilters.monthTo ?? ''} onChange={(event) => setPayrollFilters((prev) => ({ ...prev, monthTo: event.target.value || undefined }))} InputLabelProps={{ shrink: true }} />
              <TextField select label="Status" value={payrollFilters.status ?? ''} onChange={(event) => setPayrollFilters((prev) => ({ ...prev, status: event.target.value || undefined }))} sx={{ width: { xs: '100%', md: 220 } }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Locked">Locked</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1.2}>
              <Button variant="contained" onClick={() => payrollReportQuery.refetch()}>Run Report</Button>
              <Button variant="outlined" disabled={exportPayrollMutation.isPending} onClick={() => exportPayrollMutation.mutate()}>{exportPayrollMutation.isPending ? 'Exporting...' : 'Export CSV'}</Button>
            </Stack>
            {payrollReportQuery.isError ? <Alert severity="error">Failed to load payroll report.</Alert> : null}
            <Box sx={{ height: 560, width: '100%' }}>
              {payrollReportQuery.isLoading ? (
                <Stack spacing={1.2}>
                  <Skeleton variant="rounded" height={52} />
                  <Skeleton variant="rounded" height={420} />
                </Stack>
              ) : (
                <AppDataGrid
                  rows={payrollReportQuery.data?.rows ?? []}
                  getRowId={(row) => `${row.month}-${row.status}`}
                  columns={payrollColumns}
                  rowCount={payrollReportQuery.data?.pager.totalCount ?? 0}
                  paginationMode="server"
                  paginationModel={payrollPager}
                  onPaginationModelChange={setPayrollPager}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  slots={{ toolbar: AppDataGridToolbar }}
                />
              )}
            </Box>
          </Stack>
        ) : null}

        {activeTab === 'audit' ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField label="Date From" type="date" value={auditFilters.dateFrom} onChange={(event) => setAuditFilters((prev) => ({ ...prev, dateFrom: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Date To" type="date" value={auditFilters.dateTo} onChange={(event) => setAuditFilters((prev) => ({ ...prev, dateTo: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField select label="Actor" value={auditFilters.actorUserId ?? ''} onChange={(event) => setAuditFilters((prev) => ({ ...prev, actorUserId: event.target.value ? Number(event.target.value) : undefined }))} sx={{ width: { xs: '100%', md: 240 } }}>
                <MenuItem value="">All</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
                ))}
              </TextField>
              <TextField label="Action" value={auditFilters.action ?? ''} onChange={(event) => setAuditFilters((prev) => ({ ...prev, action: event.target.value || undefined }))} sx={{ width: { xs: '100%', md: 220 } }} />
              <TextField label="Entity Type" value={auditFilters.entityType ?? ''} onChange={(event) => setAuditFilters((prev) => ({ ...prev, entityType: event.target.value || undefined }))} sx={{ width: { xs: '100%', md: 220 } }} />
            </Stack>
            <Stack direction="row" spacing={1.2}>
              <Button variant="contained" onClick={() => auditReportQuery.refetch()}>Run Report</Button>
              <Button variant="outlined" disabled={exportAuditMutation.isPending} onClick={() => exportAuditMutation.mutate()}>{exportAuditMutation.isPending ? 'Exporting...' : 'Export CSV'}</Button>
            </Stack>
            {auditReportQuery.isError ? <Alert severity="error">Failed to load audit report.</Alert> : null}
            <Box sx={{ height: 560, width: '100%' }}>
              {auditReportQuery.isLoading ? (
                <Stack spacing={1.2}>
                  <Skeleton variant="rounded" height={52} />
                  <Skeleton variant="rounded" height={420} />
                </Stack>
              ) : (
                <AppDataGrid
                  rows={auditReportQuery.data?.rows ?? []}
                  getRowId={(row) => `${row.createdAt}-${row.action}-${row.entityId ?? 0}`}
                  columns={auditColumns}
                  rowCount={auditReportQuery.data?.pager.totalCount ?? 0}
                  paginationMode="server"
                  paginationModel={auditPager}
                  onPaginationModelChange={setAuditPager}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  slots={{ toolbar: AppDataGridToolbar }}
                />
              )}
            </Box>
          </Stack>
        ) : null}
      </Stack>

      <Snackbar open={Boolean(snackbar)} autoHideDuration={3000} onClose={() => setSnackbar(null)}>
        {snackbar ? <Alert severity={snackbar.severity}>{snackbar.message}</Alert> : <span />}
      </Snackbar>
    </AppShell>
  )
}
