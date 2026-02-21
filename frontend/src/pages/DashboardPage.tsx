import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { normalizeRole } from '../auth/roles'
import { AppShell } from '../components/AppShell'

type QuickAction = {
  label: string
  to: '/employees' | '/departments' | '/leave' | '/payroll' | '/users' | '/audit'
}

const roleActions: Record<string, QuickAction[]> = {
  admin: [
    { label: 'Manage Employees', to: '/employees' },
    { label: 'Review Leave', to: '/leave' },
    { label: 'Run Payroll', to: '/payroll' },
    { label: 'Manage Users', to: '/users' },
    { label: 'View Audit Logs', to: '/audit' },
  ],
  hr_officer: [
    { label: 'Manage Employees', to: '/employees' },
    { label: 'Review Leave', to: '/leave' },
    { label: 'View Payroll', to: '/payroll' },
  ],
  finance_officer: [
    { label: 'Run Payroll', to: '/payroll' },
    { label: 'Review Leave', to: '/leave' },
    { label: 'Employees', to: '/employees' },
  ],
  viewer: [
    { label: 'Employees', to: '/employees' },
    { label: 'Leave Summary', to: '/leave' },
    { label: 'Departments', to: '/departments' },
  ],
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="35%" height={44} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={220} />
              <Skeleton variant="rounded" height={220} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={170} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="70%" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Skeleton variant="rounded" height={260} />
    </Stack>
  )
}

export function DashboardPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = normalizeRole(session?.user.role)

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => router.options.context.api.getDashboardSummary(accessToken),
    enabled: Boolean(accessToken),
  })

  const canSeePayroll = role === 'admin' || role === 'hr_officer' || role === 'finance_officer'
  const canSeeActiveUsers = role === 'admin'
  const canSeeRecentActivity = role === 'admin'
  const actions = roleActions[role] ?? roleActions.viewer

  if (summaryQuery.isLoading) {
    return (
      <AppShell title="Dashboard">
        <DashboardSkeleton />
      </AppShell>
    )
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <AppShell title="Dashboard">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => summaryQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load dashboard summary.
        </Alert>
      </AppShell>
    )
  }

  const summary = summaryQuery.data
  const maxDepartmentCount = Math.max(...summary.employeesPerDepartment.map((item) => item.count), 1)

  return (
    <AppShell title="Dashboard">
      <Stack spacing={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>{summary.totalEmployees}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Pending Leave</Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>{summary.pendingLeaveRequests}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Payroll Status</Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {canSeePayroll ? summary.currentPayrollStatus ?? 'No Batch' : 'Restricted'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Active Users</Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {canSeeActiveUsers ? summary.activeUsers ?? 0 : 'Restricted'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Employees per Department</Typography>
                {summary.employeesPerDepartment.length === 0 ? (
                  <Alert severity="info">No department distribution available yet.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {summary.employeesPerDepartment.map((item) => (
                      <Box key={item.departmentName}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{item.departmentName}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.count}</Typography>
                        </Box>
                        <Box sx={{ height: 12, bgcolor: 'grey.200', borderRadius: 1 }}>
                          <Box
                            sx={{
                              height: 12,
                              borderRadius: 1,
                              bgcolor: 'primary.main',
                              width: `${(item.count / maxDepartmentCount) * 100}%`,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Leave Summary</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Approved This Month: {summary.approvedLeaveThisMonth}</Typography>
                  <Typography variant="body2" color="text.secondary">On Leave Today: {summary.employeesOnLeaveToday}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Employees: {summary.activeEmployees}</Typography>
                  <Typography variant="body2" color="text.secondary">Inactive Employees: {summary.inactiveEmployees}</Typography>
                  {canSeePayroll ? (
                    <Typography variant="body2" color="text.secondary">
                      Current Payroll Total: {summary.currentPayrollTotal != null ? summary.currentPayrollTotal.toLocaleString() : 'N/A'}
                    </Typography>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
                {!canSeeRecentActivity ? (
                  <Alert severity="info">Recent activity is available to Admin role.</Alert>
                ) : summary.recentAuditEvents.length === 0 ? (
                  <Alert severity="info">No recent audit events.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Actor</TableCell>
                        <TableCell>Entity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.recentAuditEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{event.action}</TableCell>
                          <TableCell>{event.actorUsername ?? '-'}</TableCell>
                          <TableCell>{event.entityType ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Quick Actions</Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  {actions.map((action) => (
                    <Button key={action.label} component={Link} to={action.to} variant="outlined" fullWidth>
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AppShell>
  )
}
