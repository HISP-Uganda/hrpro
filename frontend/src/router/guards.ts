import { redirect } from '@tanstack/react-router'

import type { AuthStore } from '../auth/authStore'

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
