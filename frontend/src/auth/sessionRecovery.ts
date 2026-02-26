import type { QueryClient } from '@tanstack/react-query'

import type { AppGateway } from '../types/api'
import type { User } from '../types/auth'
import type { AuthStore } from './authStore'

const AUTH_NOTICE_KEY = 'hrpro.auth.notice'
const DEFAULT_SIGN_IN_NOTICE = 'Session expired. Please log in again.'
const REFRESH_REUSE_NOTICE = 'Session security issue detected. Please sign in again.'

export function parseAuthErrorCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim()
  }
  if (typeof error === 'string') {
    return error.trim()
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const value = (error as { message?: unknown }).message
    if (typeof value === 'string') {
      return value.trim()
    }
  }
  return ''
}

export function mapRefreshFailureToNotice(error: unknown): string {
  const code = parseAuthErrorCode(error)
  if (code === 'auth.refresh_reused') {
    return REFRESH_REUSE_NOTICE
  }
  return DEFAULT_SIGN_IN_NOTICE
}

export function consumeAuthNotice(): string {
  const value = localStorage.getItem(AUTH_NOTICE_KEY)
  if (!value) {
    return ''
  }
  localStorage.removeItem(AUTH_NOTICE_KEY)
  return value
}

export function setAuthNotice(message: string): void {
  localStorage.setItem(AUTH_NOTICE_KEY, message)
}

function syncSessionUser(auth: AuthStore, user: User): void {
  const session = auth.getSnapshot()
  if (!session) {
    return
  }
  if (session.user.id === user.id && session.user.role === user.role && session.user.username === user.username) {
    return
  }
  auth.setSession({
    ...session,
    user,
  })
}

export type RecoverSessionDeps = {
  auth: AuthStore
  api: AppGateway
  queryClient: QueryClient
  navigateToLogin: () => Promise<void>
}

export async function recoverSessionOnStartup(deps: RecoverSessionDeps): Promise<void> {
  const session = deps.auth.getSnapshot()
  if (!session) {
    return
  }

  try {
    const user = await deps.api.getMe(session.accessToken)
    syncSessionUser(deps.auth, user)
    return
  } catch {
    // Continue to refresh flow.
  }

  try {
    const refreshed = await deps.api.refresh(session.refreshToken)
    deps.auth.setSession(refreshed)
    return
  } catch (error) {
    setAuthNotice(mapRefreshFailureToNotice(error))
  }

  deps.auth.clear()
  deps.queryClient.clear()
  await deps.navigateToLogin()
}
