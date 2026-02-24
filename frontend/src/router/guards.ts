import { redirect } from '@tanstack/react-router'

import type { AuthStore } from '../auth/authStore'
import { canAccessAnyReportRole, isAdminRole } from '../auth/roles'
import type { StartupStore } from '../startup/startupStore'

export function resolveRootRedirect(auth: AuthStore, startup: StartupStore): '/dashboard' | '/login' | '/setup-db' {
  if (!startup.getSnapshot().dbOk) {
    return '/setup-db'
  }
  return auth.isAuthenticated() ? '/dashboard' : '/login'
}

export function resolveDashboardRedirect(auth: AuthStore, startup: StartupStore): '/login' | '/setup-db' | null {
  if (!startup.getSnapshot().dbOk) {
    return '/setup-db'
  }
  return auth.isAuthenticated() ? null : '/login'
}

export function resolveLoginRedirect(auth: AuthStore, startup: StartupStore): '/dashboard' | '/setup-db' | null {
  if (!startup.getSnapshot().dbOk) {
    return '/setup-db'
  }
  return auth.isAuthenticated() ? '/dashboard' : null
}

export function resolveSetupDBRedirect(auth: AuthStore, startup: StartupStore): '/dashboard' | '/login' | null {
  if (!startup.getSnapshot().dbOk) {
    return null
  }
  return auth.isAuthenticated() ? '/dashboard' : '/login'
}

export function redirectFromRoot(auth: AuthStore, startup: StartupStore) {
  throw redirect({ to: resolveRootRedirect(auth, startup) })
}

export function redirectIfAuthenticated(auth: AuthStore, startup: StartupStore) {
  const target = resolveLoginRedirect(auth, startup)
  if (target) {
    throw redirect({ to: target })
  }
}

export function requireAuth(auth: AuthStore, startup: StartupStore) {
  const target = resolveDashboardRedirect(auth, startup)
  if (target) {
    throw redirect({ to: target })
  }
}

export function redirectIfDatabaseReady(auth: AuthStore, startup: StartupStore) {
  const target = resolveSetupDBRedirect(auth, startup)
  if (target) {
    throw redirect({ to: target })
  }
}

export function getPostLoginRedirectPath(): '/dashboard' {
  return '/dashboard'
}

export function resolveAdminRouteRedirect(auth: AuthStore, startup: StartupStore): '/login' | '/access-denied' | '/setup-db' | null {
  if (!startup.getSnapshot().dbOk) {
    return '/setup-db'
  }
  const session = auth.getSnapshot()
  if (!session) {
    return '/login'
  }

  return isAdminRole(session.user.role) ? null : '/access-denied'
}

export function requireAdmin(auth: AuthStore, startup: StartupStore) {
  const target = resolveAdminRouteRedirect(auth, startup)
  if (target) {
    throw redirect({ to: target })
  }
}

export function resolveReportsRouteRedirect(auth: AuthStore, startup: StartupStore): '/login' | '/access-denied' | '/setup-db' | null {
  if (!startup.getSnapshot().dbOk) {
    return '/setup-db'
  }
  const session = auth.getSnapshot()
  if (!session) {
    return '/login'
  }

  return canAccessAnyReportRole(session.user.role) ? null : '/access-denied'
}

export function requireReportsAccess(auth: AuthStore, startup: StartupStore) {
  const target = resolveReportsRouteRedirect(auth, startup)
  if (target) {
    throw redirect({ to: target })
  }
}
