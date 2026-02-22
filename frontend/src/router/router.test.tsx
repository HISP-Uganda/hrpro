import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory } from '@tanstack/history'
import { RouterProvider } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import { AuthStore } from '../auth/authStore'
import { appShellNavItems } from '../components/AppShell'
import { NotFoundPage } from '../pages/NotFoundPage'
import type { AppGateway } from '../types/api'
import {
  getPostLoginRedirectPath,
  resolveReportsRouteRedirect,
  resolveAdminRouteRedirect,
  resolveDashboardRedirect,
  resolveRootRedirect,
} from './guards'
import { appRoutePaths, createAppRouter, rootRoute } from './index'

function createAuth(isAuthenticated: boolean, role = 'Admin'): AuthStore {
  const auth = new AuthStore()
  auth.clear()

  if (isAuthenticated) {
    auth.setSession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        username: 'admin',
        role,
      },
    })
  }

  return auth
}

function createMockApi(): AppGateway {
  return {
    getDashboardSummary: vi.fn(async () => ({
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      pendingLeaveRequests: 0,
      approvedLeaveThisMonth: 0,
      employeesOnLeaveToday: 0,
      employeesPerDepartment: [],
      recentAuditEvents: [],
    })),
    listUsers: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 10 })),
    listDepartments: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 100 })),
    listEmployees: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 100 })),
    listLeaveTypes: vi.fn(async () => []),
    listEmployeeReport: vi.fn(async () => ({ rows: [], pager: { page: 1, pageSize: 10, totalCount: 0 } })),
    exportEmployeeReportCSV: vi.fn(async () => ({ filename: 'employee-list-2026-02-21.csv', data: 'a,b' })),
    listLeaveRequestsReport: vi.fn(async () => ({ rows: [], pager: { page: 1, pageSize: 10, totalCount: 0 } })),
    exportLeaveRequestsReportCSV: vi.fn(async () => ({ filename: 'leave-requests-2026-02-01_to_2026-02-21.csv', data: 'a,b' })),
    listAttendanceSummaryReport: vi.fn(async () => ({ rows: [], pager: { page: 1, pageSize: 10, totalCount: 0 } })),
    exportAttendanceSummaryReportCSV: vi.fn(async () => ({ filename: 'attendance-summary-2026-02-01_to_2026-02-21.csv', data: 'a,b' })),
    listPayrollBatchesReport: vi.fn(async () => ({ rows: [], pager: { page: 1, pageSize: 10, totalCount: 0 } })),
    exportPayrollBatchesReportCSV: vi.fn(async () => ({ filename: 'payroll-batches-2026-02-21.csv', data: 'a,b' })),
    listAuditLogReport: vi.fn(async () => ({ rows: [], pager: { page: 1, pageSize: 10, totalCount: 0 } })),
    exportAuditLogReportCSV: vi.fn(async () => ({ filename: 'audit-log-2026-02-01_to_2026-02-21.csv', data: 'a,b' })),
    listAttendanceByDate: vi.fn(async () => []),
    getLunchSummary: vi.fn(async () => ({
      attendanceDate: '2026-02-21',
      staffPresentCount: 0,
      staffFieldCount: 0,
      visitorsCount: 0,
      totalPlates: 0,
      plateCostAmount: 12000,
      totalCostAmount: 0,
      staffContributionAmount: 4000,
      staffContributionTotal: 0,
      organizationBalance: 0,
      canEditVisitors: false,
    })),
  } as unknown as AppGateway
}

function renderWithQueryClient(element: JSX.Element, queryClient: QueryClient) {
  return render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>)
}

describe('Router navigation logic', () => {
  it('"/" redirects to login when unauthenticated', () => {
    expect(resolveRootRedirect(createAuth(false))).toBe('/login')
  })

  it('"/" redirects to dashboard when authenticated', () => {
    expect(resolveRootRedirect(createAuth(true))).toBe('/dashboard')
  })

  it('"/dashboard" requires authentication', () => {
    expect(resolveDashboardRedirect(createAuth(false))).toBe('/login')
    expect(resolveDashboardRedirect(createAuth(true))).toBeNull()
  })

  it('admin-only route guard redirects non-admin to access denied', () => {
    expect(resolveAdminRouteRedirect(createAuth(false))).toBe('/login')
    expect(resolveAdminRouteRedirect(createAuth(true, 'Viewer'))).toBe('/access-denied')
    expect(resolveAdminRouteRedirect(createAuth(true, 'admin'))).toBeNull()
  })

  it('reports route guard redirects users without report permissions', () => {
    expect(resolveReportsRouteRedirect(createAuth(false))).toBe('/login')
    expect(resolveReportsRouteRedirect(createAuth(true, 'Staff'))).toBe('/access-denied')
    expect(resolveReportsRouteRedirect(createAuth(true, 'viewer'))).toBeNull()
  })

  it('login success redirects to dashboard', () => {
    expect(getPostLoginRedirectPath()).toBe('/dashboard')
  })

  it('configures and renders notFoundComponent', () => {
    expect(rootRoute.options.notFoundComponent).toBeDefined()

    render(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('includes core module routes with sidebar navigation items', () => {
    expect(appRoutePaths).toContain('/employees')
    expect(appRoutePaths).toContain('/departments')
    expect(appRoutePaths).toContain('/leave')
    expect(appRoutePaths).toContain('/attendance')
    expect(appRoutePaths).toContain('/payroll')
    expect(appRoutePaths).toContain('/payroll/$batchId')
    expect(appRoutePaths).toContain('/reports')
    expect(appRoutePaths).toContain('/users')
    expect(appRoutePaths).toContain('/audit')
    expect(appShellNavItems.map((item) => item.to)).toContain('/employees')
    expect(appShellNavItems.map((item) => item.to)).toContain('/departments')
    expect(appShellNavItems.map((item) => item.to)).toContain('/leave')
    expect(appShellNavItems.map((item) => item.to)).toContain('/attendance')
    expect(appShellNavItems.map((item) => item.to)).toContain('/payroll')
    expect(appShellNavItems.map((item) => item.to)).toContain('/reports')
    expect(appShellNavItems.map((item) => item.to)).toContain('/users')
    expect(appShellNavItems.map((item) => item.to)).toContain('/audit')
  })

  it('"/reports" renders for admin', async () => {
    const history = createMemoryHistory({ initialEntries: ['/reports'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'admin'),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: 'Reports' })).toBeInTheDocument()
  })

  it('"/users" renders for admin', async () => {
    const history = createMemoryHistory({ initialEntries: ['/users'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'admin'),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument()
  })

  it('"/audit" renders for admin', async () => {
    const history = createMemoryHistory({ initialEntries: ['/audit'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'admin'),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument()
  })

  it('"/dashboard" renders for authenticated users', async () => {
    const history = createMemoryHistory({ initialEntries: ['/dashboard'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'viewer'),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('"/attendance" renders for authenticated users', async () => {
    const history = createMemoryHistory({ initialEntries: ['/attendance'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'viewer'),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: 'Attendance' })).toBeInTheDocument()
  })

})
