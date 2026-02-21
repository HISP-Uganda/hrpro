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
    listUsers: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 10 })),
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

  it('"/users" redirects non-admin to access denied', () => {
    expect(resolveAdminRouteRedirect(createAuth(false))).toBe('/login')
    expect(resolveAdminRouteRedirect(createAuth(true, 'Viewer'))).toBe('/access-denied')
    expect(resolveAdminRouteRedirect(createAuth(true, 'admin'))).toBeNull()
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
    expect(appRoutePaths).toContain('/payroll')
    expect(appRoutePaths).toContain('/payroll/$batchId')
    expect(appRoutePaths).toContain('/users')
    expect(appShellNavItems.map((item) => item.to)).toContain('/employees')
    expect(appShellNavItems.map((item) => item.to)).toContain('/departments')
    expect(appShellNavItems.map((item) => item.to)).toContain('/leave')
    expect(appShellNavItems.map((item) => item.to)).toContain('/payroll')
    expect(appShellNavItems.map((item) => item.to)).toContain('/users')
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

})
