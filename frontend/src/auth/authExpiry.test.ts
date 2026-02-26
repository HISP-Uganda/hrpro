import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { AuthStore } from './authStore'
import { createAuthExpiryMutationHandler, SESSION_EXPIRED_MESSAGE } from './authExpiry'

describe('auth expiry mutation handler', () => {
  it('handles AUTH_EXPIRED by forcing relogin flow', async () => {
    const auth = new AuthStore()
    auth.setSession({
      accessToken: 'expired',
      refreshToken: 'refresh',
      user: { id: 1, username: 'admin', role: 'Admin' },
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(['employees'], [{ id: 1 }])
    const navigateToLogin = vi.fn(async () => {})
    const setAuthNotice = vi.fn()

    const handle = createAuthExpiryMutationHandler({
      auth,
      queryClient,
      navigateToLogin,
      setAuthNotice,
    })

    const handled = await handle(new Error('AUTH_EXPIRED'))

    expect(handled).toBe(true)
    expect(setAuthNotice).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE)
    expect(auth.getSnapshot()).toBeNull()
    expect(queryClient.getQueryData(['employees'])).toBeUndefined()
    expect(navigateToLogin).toHaveBeenCalledOnce()
  })

  it('keeps normal validation error behavior and does not force logout', async () => {
    const auth = new AuthStore()
    auth.setSession({
      accessToken: 'active',
      refreshToken: 'refresh',
      user: { id: 1, username: 'admin', role: 'Admin' },
    })

    const queryClient = new QueryClient()
    queryClient.setQueryData(['employees'], [{ id: 1 }])
    const navigateToLogin = vi.fn(async () => {})
    const setAuthNotice = vi.fn()

    const handle = createAuthExpiryMutationHandler({
      auth,
      queryClient,
      navigateToLogin,
      setAuthNotice,
    })

    const handled = await handle(new Error('validation error [field=phone]: invalid'))

    expect(handled).toBe(false)
    expect(auth.getSnapshot()).not.toBeNull()
    expect(queryClient.getQueryData(['employees'])).toEqual([{ id: 1 }])
    expect(setAuthNotice).not.toHaveBeenCalled()
    expect(navigateToLogin).not.toHaveBeenCalled()
  })
})
