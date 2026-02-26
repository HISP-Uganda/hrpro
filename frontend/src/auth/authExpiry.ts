import type { QueryClient } from '@tanstack/react-query'

import type { AuthStore } from './authStore'
import { parseAuthErrorCode } from './sessionRecovery'

export const SESSION_EXPIRED_MESSAGE = 'Session expired. Please log in again.'

const AUTH_ERROR_CODES = new Set([
  'AUTH_EXPIRED',
  'AUTH_UNAUTHORIZED',
  'AUTH.UNAUTHORIZED',
  'AUTH.EXPIRED',
  'auth.access_token_expired',
  'auth.access_token_invalid',
  'auth.access_token_missing',
])

export function isAuthExpiryError(error: unknown): boolean {
  const code = parseAuthErrorCode(error)
  if (AUTH_ERROR_CODES.has(code)) {
    return true
  }

  const lowered = code.toLowerCase()
  if (!lowered) {
    return false
  }

  return (
    lowered.includes('token is expired') ||
    lowered.includes('token has expired') ||
    lowered.includes('token is malformed') ||
    lowered.includes('invalid token') ||
    lowered.includes('unauthorized') ||
    lowered.includes('access token is required') ||
    lowered.includes('jwt')
  )
}

type AuthExpiryHandlerDeps = {
  auth: AuthStore
  queryClient: QueryClient
  navigateToLogin: () => Promise<void>
  setAuthNotice: (message: string) => void
}

export function createAuthExpiryMutationHandler(deps: AuthExpiryHandlerDeps) {
  let handling = false

  return async (error: unknown): Promise<boolean> => {
    if (!isAuthExpiryError(error)) {
      return false
    }
    if (handling || !deps.auth.isAuthenticated()) {
      return false
    }

    handling = true
    try {
      deps.setAuthNotice(SESSION_EXPIRED_MESSAGE)
      deps.auth.clear()
      deps.queryClient.clear()
      await deps.navigateToLogin()
      return true
    } finally {
      handling = false
    }
  }
}
