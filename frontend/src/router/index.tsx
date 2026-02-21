import { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { createBrowserHistory, type RouterHistory } from '@tanstack/history'

import type { AuthStore } from '../auth/authStore'
import type { AuthGateway } from '../types/auth'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { redirectFromRoot, redirectIfAuthenticated, requireAuth } from './guards'

export type RouterContext = {
  auth: AuthStore
  api: AuthGateway
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
  component: () => <PlaceholderPage title="Employees" />,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const departmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/departments',
  component: () => <PlaceholderPage title="Departments" />,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const leaveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leave',
  component: () => <PlaceholderPage title="Leave" />,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const payrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll',
  component: () => <PlaceholderPage title="Payroll" />,
  beforeLoad: ({ context }) => requireAuth(context.auth),
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => <PlaceholderPage title="Users" />,
  beforeLoad: ({ context }) => requireAuth(context.auth),
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
  usersRoute,
  accessDeniedRoute,
])

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
