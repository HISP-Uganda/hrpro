import { describe, expect, it, beforeEach } from 'vitest'

import { readStoredDrawerCollapsed, SHELL_DRAWER_COLLAPSED_STORAGE_KEY } from './AppShell'

describe('AppShell drawer preference', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('initializes collapsed state from localStorage true value', () => {
    window.localStorage.setItem(SHELL_DRAWER_COLLAPSED_STORAGE_KEY, 'true')
    expect(readStoredDrawerCollapsed()).toBe(true)
  })

  it('initializes expanded state from localStorage false value', () => {
    window.localStorage.setItem(SHELL_DRAWER_COLLAPSED_STORAGE_KEY, 'false')
    expect(readStoredDrawerCollapsed()).toBe(false)
  })

  it('defaults to expanded when localStorage key is missing', () => {
    expect(readStoredDrawerCollapsed()).toBe(false)
  })
})
