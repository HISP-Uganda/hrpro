import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory } from '@tanstack/history'
import { RouterProvider } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'

import { AuthStore } from '../auth/authStore'
import { appShellNavItems } from '../components/AppShell'
import { NotFoundPage } from '../pages/NotFoundPage'
import { StartupStore } from '../startup/startupStore'
import { AppThemeProvider } from '../theme/ThemeProvider'
import type { AppGateway } from '../types/api'
import {
  getPostLoginRedirectPath,
  resolveLoginRedirect,
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
    getStartupHealth: vi.fn(async () => ({ dbOk: true, runtimeOk: true })),
    testDatabaseConnection: vi.fn(async () => {}),
    saveDatabaseConfig: vi.fn(async () => {}),
    reloadConfigAndReconnect: vi.fn(async () => {}),
    refresh: vi.fn(async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 1, username: 'admin', role: 'Admin' },
    })),
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
    getSettings: vi.fn(async () => ({
      company: { name: 'HISP HR System' },
      currency: { code: 'TZS', symbol: 'TZS', decimals: 0 },
      lunchDefaults: { plateCostAmount: 12000, staffContributionAmount: 4000 },
      payrollDisplay: { decimals: 2, roundingEnabled: false },
      phoneDefaults: { defaultCountryName: 'Uganda', defaultCountryISO2: 'UG', defaultCountryCallingCode: '+256' },
    })),
    getCompanyProfile: vi.fn(async () => ({
      name: 'HISP HR System',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    saveCompanyProfile: vi.fn(async () => ({
      name: 'HISP HR System',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    updateSettings: vi.fn(async () => ({
      company: { name: 'HISP HR System' },
      currency: { code: 'TZS', symbol: 'TZS', decimals: 0 },
      lunchDefaults: { plateCostAmount: 12000, staffContributionAmount: 4000 },
      payrollDisplay: { decimals: 2, roundingEnabled: false },
      phoneDefaults: { defaultCountryName: 'Uganda', defaultCountryISO2: 'UG', defaultCountryCallingCode: '+256' },
    })),
    uploadCompanyLogo: vi.fn(async () => ({
      name: 'HISP HR System',
      logoDataUrl: '',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    importCompanyLogoFromURL: vi.fn(async () => ({
      name: 'HISP HR System',
      logoDataUrl: '',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    removeCompanyLogo: vi.fn(async () => ({
      name: 'HISP HR System',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    getCompanyLogo: vi.fn(async () => ({ filename: 'logo.png', mimeType: 'image/png', data: [] })),
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
  return render(
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
    </AppThemeProvider>,
  )
}

function createStartup(dbOk: boolean): StartupStore {
  const startup = new StartupStore()
  startup.setHealth({
    dbOk,
    runtimeOk: true,
    dbError: dbOk ? '' : 'Database connection is not configured',
  })
  return startup
}

describe('Router navigation logic', () => {
  it('"/" redirects to login when unauthenticated', () => {
    expect(resolveRootRedirect(createAuth(false), createStartup(true))).toBe('/login')
  })

  it('"/" redirects to dashboard when authenticated', () => {
    expect(resolveRootRedirect(createAuth(true), createStartup(true))).toBe('/dashboard')
  })

  it('"/" redirects to setup-db when database is not configured', () => {
    expect(resolveRootRedirect(createAuth(false), createStartup(false))).toBe('/setup-db')
  })

  it('smoke: dbOk false routes root to setup-db', () => {
    expect(resolveRootRedirect(createAuth(false), createStartup(false))).toBe('/setup-db')
  })

  it('smoke: dbOk true routes root to login', () => {
    expect(resolveRootRedirect(createAuth(false), createStartup(true))).toBe('/login')
  })

  it('"/dashboard" requires authentication', () => {
    expect(resolveDashboardRedirect(createAuth(false), createStartup(true))).toBe('/login')
    expect(resolveDashboardRedirect(createAuth(true), createStartup(true))).toBeNull()
  })

  it('"/login" requires database setup first when db health is false', () => {
    expect(resolveLoginRedirect(createAuth(false), createStartup(false))).toBe('/setup-db')
    expect(resolveLoginRedirect(createAuth(false), createStartup(true))).toBeNull()
  })

  it('"/login" remains allowed when db is configured even if runtime flag is false', () => {
    const startup = new StartupStore()
    startup.setHealth({
      dbOk: true,
      runtimeOk: false,
      runtimeError: 'temporary runtime state',
    })
    expect(resolveLoginRedirect(createAuth(false), startup)).toBeNull()
  })

  it('admin-only route guard redirects non-admin to access denied', () => {
    expect(resolveAdminRouteRedirect(createAuth(false), createStartup(true))).toBe('/login')
    expect(resolveAdminRouteRedirect(createAuth(true, 'Viewer'), createStartup(true))).toBe('/access-denied')
    expect(resolveAdminRouteRedirect(createAuth(true, 'admin'), createStartup(true))).toBeNull()
  })

  it('reports route guard redirects users without report permissions', () => {
    expect(resolveReportsRouteRedirect(createAuth(false), createStartup(true))).toBe('/login')
    expect(resolveReportsRouteRedirect(createAuth(true, 'Staff'), createStartup(true))).toBe('/access-denied')
    expect(resolveReportsRouteRedirect(createAuth(true, 'viewer'), createStartup(true))).toBeNull()
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
    expect(appRoutePaths).toContain('/settings')
    expect(appRoutePaths).toContain('/audit')
    expect(appShellNavItems.map((item) => item.to)).toContain('/employees')
    expect(appShellNavItems.map((item) => item.to)).toContain('/departments')
    expect(appShellNavItems.map((item) => item.to)).toContain('/leave')
    expect(appShellNavItems.map((item) => item.to)).toContain('/attendance')
    expect(appShellNavItems.map((item) => item.to)).toContain('/payroll')
    expect(appShellNavItems.map((item) => item.to)).toContain('/reports')
    expect(appShellNavItems.map((item) => item.to)).toContain('/users')
    expect(appShellNavItems.map((item) => item.to)).toContain('/settings')
    expect(appShellNavItems.map((item) => item.to)).toContain('/audit')
  })

  it('"/reports" renders for admin', async () => {
    const history = createMemoryHistory({ initialEntries: ['/reports'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'admin'),
        startup: createStartup(true),
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
        startup: createStartup(true),
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

  it('"/settings" renders for admin', async () => {
    const history = createMemoryHistory({ initialEntries: ['/settings'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'admin'),
        startup: createStartup(true),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('"/audit" renders for admin', async () => {
    const history = createMemoryHistory({ initialEntries: ['/audit'] })
    const router = createAppRouter(
      {
        auth: createAuth(true, 'admin'),
        startup: createStartup(true),
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
        startup: createStartup(true),
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
        startup: createStartup(true),
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

  it('unknown route renders notFoundComponent without TanStack notFound warnings', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const history = createMemoryHistory({ initialEntries: ['/unknown-route'] })
    const router = createAppRouter(
      {
        auth: createAuth(false),
        startup: createStartup(true),
        api: createMockApi(),
        queryClient: new QueryClient(),
      },
      history,
    )
    const queryClient = router.options.context.queryClient

    await router.load()
    renderWithQueryClient(<RouterProvider router={router} />, queryClient)
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    const warnMessages = warnSpy.mock.calls.map((call) => call.map(String).join(' '))
    const errorMessages = errorSpy.mock.calls.map((call) => call.map(String).join(' '))
    expect(warnMessages.some((message) => message.includes('notFoundComponent'))).toBe(false)
    expect(errorMessages.some((message) => message.includes('notFoundComponent'))).toBe(false)
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

})
