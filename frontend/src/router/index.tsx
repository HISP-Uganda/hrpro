import { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { createBrowserHistory, type RouterHistory } from '@tanstack/history'

import type { AuthStore } from '../auth/authStore'
import type { AppGateway } from '../types/api'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DepartmentsPage } from '../pages/DepartmentsPage'
import { EmployeesPage } from '../pages/EmployeesPage'
import { LeavePage } from '../pages/LeavePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PayrollBatchDetailPage } from '../pages/PayrollBatchDetailPage'
import { PayrollBatchesPage } from '../pages/PayrollBatchesPage'
import { UsersPage } from '../pages/UsersPage'
import { redirectFromRoot, redirectIfAuthenticated, requireAdmin, requireAuth } from './guards'

export type RouterContext = {
  auth: AuthStore
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
  beforeLoad: ({ context }) => redirectFromRoot(context.auth),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: ({ context }) => redirectIfAuthenticated(context.auth),
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees',
  component: EmployeesPage,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/departments',
  component: DepartmentsPage,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const leaveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leave',
  component: LeavePage,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const payrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll',
  component: PayrollBatchesPage,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const payrollDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll/$batchId',
  component: PayrollBatchDetailPage,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: ({ context }) => requireAdmin(context.auth),
})

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  employeesRoute,
  departmentsRoute,
  leaveRoute,
  payrollRoute,
  payrollDetailRoute,
  usersRoute,
  accessDeniedRoute,
])

export const appRoutePaths = [
  '/',
  '/login',
  '/dashboard',
  '/employees',
  '/departments',
  '/leave',
  '/payroll',
  '/payroll/$batchId',
  '/users',
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
