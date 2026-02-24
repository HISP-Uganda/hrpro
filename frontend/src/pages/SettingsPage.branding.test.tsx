import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { forwardRef, type ReactNode } from 'react'

import { AuthStore } from '../auth/authStore'
import { AppThemeProvider } from '../theme/ThemeProvider'
import { SettingsPage } from './SettingsPage'

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
      select({ location: { pathname: '/settings' } }),
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

function createMockRouter(logoDataUrl: string | null) {
  const auth = createAuthStore()
  const queryClient = new QueryClient()
  const api = {
    getCompanyProfile: vi.fn(async () => ({
      name: 'Acme',
      logoDataUrl: logoDataUrl ?? '',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    getSettings: vi.fn(async () => ({
      company: {
        name: 'Acme',
        logoPath: logoDataUrl ? 'branding/logo.png' : '',
        supportEmail: '',
        supportPhone: '',
        supportWebsite: '',
        copyrightHolder: '',
      },
      currency: { code: 'TZS', symbol: 'TZS', decimals: 0 },
      lunchDefaults: { plateCostAmount: 12000, staffContributionAmount: 4000 },
      payrollDisplay: { decimals: 2, roundingEnabled: false },
      phoneDefaults: { defaultCountryName: 'Uganda', defaultCountryISO2: 'UG', defaultCountryCallingCode: '+256' },
    })),
    saveCompanyProfile: vi.fn(async () => ({
      name: 'Acme',
      logoDataUrl: logoDataUrl ?? '',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    updateSettings: vi.fn(async () => ({
      company: { name: 'Acme', logoPath: logoDataUrl ? 'branding/logo.png' : '' },
      currency: { code: 'TZS', symbol: 'TZS', decimals: 0 },
      lunchDefaults: { plateCostAmount: 12000, staffContributionAmount: 4000 },
      payrollDisplay: { decimals: 2, roundingEnabled: false },
      phoneDefaults: { defaultCountryName: 'Uganda', defaultCountryISO2: 'UG', defaultCountryCallingCode: '+256' },
    })),
    uploadCompanyLogo: vi.fn(async () => ({
      name: 'Acme',
      logoDataUrl: 'data:image/png;base64,AAAA',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    importCompanyLogoFromURL: vi.fn(async () => ({
      name: 'Acme',
      logoDataUrl: 'data:image/png;base64,AAAA',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    removeCompanyLogo: vi.fn(async () => ({
      name: 'Acme',
      logoDataUrl: '',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
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

function renderPage(router: any) {
  const queryClient = router.options.context.queryClient as QueryClient
  mockRouter = router
  return render(
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    </AppThemeProvider>,
  )
}

describe('SettingsPage branding controls', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('hides remove button when no logo exists', async () => {
    const router = createMockRouter(null)
    renderPage(router)

    await waitFor(() => {
      expect(screen.queryByTestId('remove-logo-button')).not.toBeInTheDocument()
    })
  })

  it('shows remove button when logo exists', async () => {
    const router = createMockRouter('data:image/png;base64,AAAA')
    renderPage(router)

    await waitFor(() => {
      expect(screen.getByTestId('remove-logo-button')).toBeInTheDocument()
    })
  })

  it('validates URL import input and shows backend error when import fails', async () => {
    const router = createMockRouter(null)
    const api = router.options.context.api as { importCompanyLogoFromURL: ReturnType<typeof vi.fn> }
    renderPage(router)

    await waitFor(() => {
      expect(screen.getByLabelText('Import Logo from URL')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Import URL' }))
    expect(screen.getByText('Logo URL is required')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Import Logo from URL'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Import URL' }))
    expect(screen.getByText('Enter a valid URL')).toBeInTheDocument()

    api.importCompanyLogoFromURL.mockRejectedValueOnce(new Error('validation error: unsupported image type'))
    fireEvent.change(screen.getByLabelText('Import Logo from URL'), { target: { value: 'https://example.com/not-image.txt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Import URL' }))

    await waitFor(() => {
      expect(screen.getByText('validation error: unsupported image type')).toBeInTheDocument()
    })
  })
})
