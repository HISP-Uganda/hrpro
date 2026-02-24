import { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { createBrowserHistory, type RouterHistory } from '@tanstack/history'

import type { AuthStore } from '../auth/authStore'
import { SetupDatabasePage } from '../pages/SetupDatabasePage'
import type { StartupStore } from '../startup/startupStore'
import type { AppGateway } from '../types/api'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { AttendancePage } from '../pages/AttendancePage'
import { AuditPage } from '../pages/AuditPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DepartmentsPage } from '../pages/DepartmentsPage'
import { EmployeesPage } from '../pages/EmployeesPage'
import { LeavePage } from '../pages/LeavePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PayrollBatchDetailPage } from '../pages/PayrollBatchDetailPage'
import { PayrollBatchesPage } from '../pages/PayrollBatchesPage'
import { ReportsPage } from '../pages/ReportsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { UsersPage } from '../pages/UsersPage'
import {
  redirectFromRoot,
  redirectIfAuthenticated,
  redirectIfDatabaseReady,
  requireAdmin,
  requireAuth,
  requireReportsAccess,
} from './guards'

export type RouterContext = {
  auth: AuthStore
  startup: StartupStore
  api: AppGateway
  queryClient: QueryClient
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => redirectFromRoot(context.auth, context.startup),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: ({ context }) => redirectIfAuthenticated(context.auth, context.startup),
})

const setupDBRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup-db',
  component: SetupDatabasePage,
  beforeLoad: ({ context }) => redirectIfDatabaseReady(context.auth, context.startup),
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees',
  component: EmployeesPage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/departments',
  component: DepartmentsPage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const leaveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leave',
  component: LeavePage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attendance',
  component: AttendancePage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const payrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll',
  component: PayrollBatchesPage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const payrollDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/$batchId',
  component: PayrollBatchDetailPage,
  beforeLoad: ({ context }) => requireAuth(context.auth, context.startup),
})

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
  beforeLoad: ({ context }) => requireReportsAccess(context.auth, context.startup),
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: ({ context }) => requireAdmin(context.auth, context.startup),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
  beforeLoad: ({ context }) => requireAdmin(context.auth, context.startup),
})

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: AuditPage,
  beforeLoad: ({ context }) => requireAdmin(context.auth, context.startup),
})

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  setupDBRoute,
  dashboardRoute,
  employeesRoute,
  departmentsRoute,
  leaveRoute,
  attendanceRoute,
  payrollRoute,
  payrollDetailRoute,
  reportsRoute,
  usersRoute,
  settingsRoute,
  auditRoute,
  accessDeniedRoute,
])

export const appRoutePaths = [
  '/',
  '/login',
  '/setup-db',
  '/dashboard',
  '/employees',
  '/departments',
  '/leave',
  '/attendance',
  '/payroll',
  '/payroll/$batchId',
  '/reports',
  '/users',
  '/settings',
  '/audit',
  '/access-denied',
] as const

export function createAppRouter(context: RouterContext, history?: RouterHistory) {
  return createRouter({
    routeTree,
    context,
    history: history ?? createBrowserHistory(),
    defaultPreload: 'intent',
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
