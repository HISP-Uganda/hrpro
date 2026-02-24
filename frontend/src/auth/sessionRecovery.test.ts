import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthStore } from './authStore'
import { consumeAuthNotice, mapRefreshFailureToNotice, recoverSessionOnStartup } from './sessionRecovery'
import type { AppGateway } from '../types/api'

describe('sessionRecovery', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('maps refresh reuse error to a clear security notice', () => {
    expect(mapRefreshFailureToNotice(new Error('auth.refresh_reused'))).toBe('Session security issue detected. Please sign in again.')
  })

  it('forces logout and sets notice when refresh token reuse is detected', async () => {
    const auth = new AuthStore()
    auth.setSession({
      accessToken: 'stale-access',
      refreshToken: 'stale-refresh',
      user: { id: 1, username: 'admin', role: 'Admin' },
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(['sample'], { ok: true })
    const navigateToLogin = vi.fn(async () => {})

    const api = {
      getMe: vi.fn(async () => {
        throw new Error('validate jwt: parse access token: token is malformed')
      }),
      refresh: vi.fn(async () => {
        throw new Error('auth.refresh_reused')
      }),
    } as unknown as AppGateway

    await recoverSessionOnStartup({
      auth,
      api,
      queryClient,
      navigateToLogin,
    })

    expect(auth.getSnapshot()).toBeNull()
    expect(queryClient.getQueryData(['sample'])).toBeUndefined()
    expect(navigateToLogin).toHaveBeenCalledOnce()
    expect(consumeAuthNotice()).toBe('Session security issue detected. Please sign in again.')
  })
})
