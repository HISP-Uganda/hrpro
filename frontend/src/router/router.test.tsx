import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthStore } from '../auth/authStore'
import { appShellNavItems } from '../components/AppShell'
import { NotFoundPage } from '../pages/NotFoundPage'
import {
  getPostLoginRedirectPath,
  resolveDashboardRedirect,
  resolveRootRedirect,
} from './guards'
import { appRoutePaths, rootRoute } from './index'

function createAuth(isAuthenticated: boolean): AuthStore {
  const auth = new AuthStore()
  auth.clear()

  if (isAuthenticated) {
    auth.setSession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        username: 'admin',
        role: 'Admin',
      },
    })
  }

  return auth
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

  it('login success redirects to dashboard', () => {
    expect(getPostLoginRedirectPath()).toBe('/dashboard')
  })

  it('configures and renders notFoundComponent', () => {
    expect(rootRoute.options.notFoundComponent).toBeDefined()

    render(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('includes /employees route and sidebar navigation item', () => {
    expect(appRoutePaths).toContain('/employees')
    expect(appShellNavItems.map((item) => item.to)).toContain('/employees')
  })
})
