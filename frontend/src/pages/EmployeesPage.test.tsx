import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { forwardRef, type ReactNode } from 'react'

import { AuthStore } from '../auth/authStore'
import { AppThemeProvider } from '../theme/ThemeProvider'
import { EmployeesPage } from './EmployeesPage'

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
      select({ location: { pathname: '/employees' } }),
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

function createMockRouter() {
  const auth = createAuthStore()
  const queryClient = new QueryClient()
  const api = {
    getCompanyProfile: vi.fn(async () => ({
      name: 'Acme',
      supportEmail: '',
      supportPhone: '',
      supportWebsite: '',
      copyrightHolder: '',
    })),
    logout: vi.fn(async () => {}),
    getSettings: vi.fn(async () => ({
      company: { name: 'Acme' },
      currency: { code: 'TZS', symbol: 'TZS', decimals: 0 },
      lunchDefaults: { plateCostAmount: 12000, staffContributionAmount: 4000 },
      payrollDisplay: { decimals: 2, roundingEnabled: false },
      phoneDefaults: { defaultCountryName: 'Uganda', defaultCountryISO2: 'UG', defaultCountryCallingCode: '+256' },
    })),
    listEmployees: vi.fn(async () => ({
      items: [{
        id: 1,
        firstName: 'Jane',
        lastName: 'Doe',
        position: 'Engineer',
        employmentStatus: 'Active',
        dateOfHire: '2026-02-21',
        baseSalaryAmount: 1000,
        contractFilePath: 'employees/1/contract/old.pdf',
      }],
      totalCount: 1,
      page: 1,
      pageSize: 10,
    })),
    listDepartments: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 200 })),
    createEmployee: vi.fn(async (_accessToken: string, payload: any) => ({
      id: 2,
      ...payload,
      createdAt: '2026-02-24T00:00:00Z',
      updatedAt: '2026-02-24T00:00:00Z',
    })),
    updateEmployee: vi.fn(async (_accessToken: string, _id: number, payload: any) => ({
      id: 1,
      ...payload,
      createdAt: '2026-02-24T00:00:00Z',
      updatedAt: '2026-02-24T00:00:00Z',
    })),
    deleteEmployee: vi.fn(async () => {}),
    uploadEmployeeContract: vi.fn(async () => ({
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      position: 'Engineer',
      employmentStatus: 'Active',
      dateOfHire: '2026-02-21',
      baseSalaryAmount: 1000,
      contractFilePath: 'employees/1/contract/new.pdf',
    })),
    removeEmployeeContract: vi.fn(async () => ({
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      position: 'Engineer',
      employmentStatus: 'Active',
      dateOfHire: '2026-02-21',
      baseSalaryAmount: 1000,
      contractFilePath: undefined,
    })),
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
        <EmployeesPage />
      </QueryClientProvider>
    </AppThemeProvider>,
  )
}

describe('EmployeesPage enhancements', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders Job Description field and sends value in create payload', async () => {
    const router = createMockRouter()
    renderPage(router)

    fireEvent.click(await screen.findByRole('button', { name: 'Add Employee' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(within(dialog).getByLabelText('Last Name'), { target: { value: 'Smith' } })
    fireEvent.change(within(dialog).getByLabelText('Position'), { target: { value: 'Analyst' } })
    fireEvent.change(within(dialog).getByLabelText('Date of Hire'), { target: { value: '2026-02-24' } })
    fireEvent.change(within(dialog).getByLabelText('Job Description'), { target: { value: '- Handles reports' } })
    fireEvent.change(within(dialog).getByLabelText('Contract URL'), { target: { value: 'https://example.com/contract' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(router.options.context.api.createEmployee).toHaveBeenCalledTimes(1)
    })
    const payload = router.options.context.api.createEmployee.mock.calls[0][1]
    expect(payload.jobDescription).toBe('- Handles reports')
    expect(payload.contractUrl).toBe('https://example.com/contract')
  })

  it('shows invalid phone field error and blocks save', async () => {
    const router = createMockRouter()
    renderPage(router)

    fireEvent.click(await screen.findByRole('button', { name: 'Add Employee' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(within(dialog).getByLabelText('Last Name'), { target: { value: 'Smith' } })
    fireEvent.change(within(dialog).getByLabelText('Position'), { target: { value: 'Analyst' } })
    fireEvent.change(within(dialog).getByLabelText('Date of Hire'), { target: { value: '2026-02-24' } })
    fireEvent.change(within(dialog).getByLabelText('Phone'), { target: { value: 'bad***' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a valid phone number')).toBeInTheDocument()
    expect(router.options.context.api.createEmployee).not.toHaveBeenCalled()
  })
})
