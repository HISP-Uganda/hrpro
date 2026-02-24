import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { forwardRef, type ReactNode } from 'react'

import { AuthStore } from '../auth/authStore'
import { AppThemeProvider } from '../theme/ThemeProvider'
import { AppShell } from './AppShell'

let mockRouter: any

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  const MockLink = forwardRef<HTMLAnchorElement, { children: ReactNode; href?: string }>((props, ref) => (
    <a ref={ref} href={props.href} {...props}>
      {props.children}
    </a>
  ))
  MockLink.displayName = 'MockLink'
  return {
    ...actual,
    Link: MockLink,
    useRouter: () => mockRouter,
    useNavigate: () => vi.fn(async () => {}),
    useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }) =>
      select({ location: { pathname: '/dashboard' } }),
  }
})

function createAuthStore(): AuthStore {
  const auth = new AuthStore()
  auth.setSession({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 1,
      username: 'admin',
      role: 'Admin',
    },
  })
  return auth
}

function createMockRouter(companyName: string, logoPath?: string, logoData?: number[]) {
  const auth = createAuthStore()
  const queryClient = new QueryClient()
  const api = {
    getSettings: vi.fn(async () => ({
      company: {
        name: companyName,
        logoPath,
      },
    })),
    getCompanyLogo: vi.fn(async () => ({
      filename: 'logo.png',
      mimeType: 'image/png',
      data: logoData ?? [],
    })),
    logout: vi.fn(async () => {}),
  }

  return {
    options: {
      context: {
        auth,
        api,
        queryClient,
      },
    },
  }
}

function renderShell(router: any) {
  const queryClient = router.options.context.queryClient as QueryClient
  mockRouter = router
  return render(
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell title="Dashboard">
          <div>Content</div>
        </AppShell>
      </QueryClientProvider>
    </AppThemeProvider>,
  )
}

describe('AppShell branding', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders "HR System" in app bar when company name is missing', async () => {
    const router = createMockRouter('   ')
    renderShell(router)

    await waitFor(() => {
      expect(screen.getByTestId('app-shell-brand-title')).toHaveTextContent('HR System')
    })
  })

  it('renders "{Company} HR System" in app bar when company name exists', async () => {
    const router = createMockRouter('Acme')
    renderShell(router)

    await waitFor(() => {
      expect(screen.getByTestId('app-shell-brand-title')).toHaveTextContent('Acme HR System')
    })
  })

  it('shows sidebar placeholder when logo is missing', async () => {
    const router = createMockRouter('Acme')
    renderShell(router)

    await waitFor(() => {
      expect(screen.getAllByTestId('app-shell-brand-placeholder').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
    })
  })

  it('updates app bar title after company profile query invalidation', async () => {
    const router = createMockRouter('Acme')
    const api = router.options.context.api as { getSettings: ReturnType<typeof vi.fn> }
    renderShell(router)

    await waitFor(() => {
      expect(screen.getByTestId('app-shell-brand-title')).toHaveTextContent('Acme HR System')
    })

    api.getSettings.mockResolvedValueOnce({
      company: {
        name: 'Globex',
      },
    })

    await act(async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['company-profile'] })
    })

    await waitFor(() => {
      expect(screen.getByTestId('app-shell-brand-title')).toHaveTextContent('Globex HR System')
    })
  })
})
