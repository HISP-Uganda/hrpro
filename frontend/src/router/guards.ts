import { redirect } from '@tanstack/react-router'

import type { AuthStore } from '../auth/authStore'
import { canAccessAnyReportRole, isAdminRole } from '../auth/roles'

export function resolveRootRedirect(auth: AuthStore): '/dashboard' | '/login' {
  return auth.isAuthenticated() ? '/dashboard' : '/login'
}

export function resolveDashboardRedirect(auth: AuthStore): '/login' | null {
  return auth.isAuthenticated() ? null : '/login'
}

export function resolveLoginRedirect(auth: AuthStore): '/dashboard' | null {
  return auth.isAuthenticated() ? '/dashboard' : null
}

export function redirectFromRoot(auth: AuthStore) {
  throw redirect({ to: resolveRootRedirect(auth) })
}

export function redirectIfAuthenticated(auth: AuthStore) {
  const target = resolveLoginRedirect(auth)
  if (target) {
    throw redirect({ to: target })
  }
}

export function requireAuth(auth: AuthStore) {
  const target = resolveDashboardRedirect(auth)
  if (target) {
    throw redirect({ to: target })
  }
}

export function getPostLoginRedirectPath(): '/dashboard' {
  return '/dashboard'
}

export function resolveAdminRouteRedirect(auth: AuthStore): '/login' | '/access-denied' | null {
  const session = auth.getSnapshot()
  if (!session) {
    return '/login'
  }

  return isAdminRole(session.user.role) ? null : '/access-denied'
}

export function requireAdmin(auth: AuthStore) {
  const target = resolveAdminRouteRedirect(auth)
  if (target) {
    throw redirect({ to: target })
  }
}

export function resolveReportsRouteRedirect(auth: AuthStore): '/login' | '/access-denied' | null {
  const session = auth.getSnapshot()
  if (!session) {
    return '/login'
  }

  return canAccessAnyReportRole(session.user.role) ? null : '/access-denied'
}

export function requireReportsAccess(auth: AuthStore) {
  const target = resolveReportsRouteRedirect(auth)
  if (target) {
    throw redirect({ to: target })
  }
}
