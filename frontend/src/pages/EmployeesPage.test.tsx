import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { forwardRef, type ReactNode } from 'react'

import { AuthStore } from '../auth/authStore'
import { AppThemeProvider } from '../theme/ThemeProvider'
import type { AppGateway } from '../types/api'
import type { Employee } from '../types/employees'
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

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    gender: 'Female',
    position: 'Engineer',
    employmentStatus: 'Active',
    dateOfHire: '2026-02-21',
    baseSalaryAmount: 1000,
    contractFilePath: 'employees/1/contract/old.pdf',
    createdAt: '2026-02-24T00:00:00Z',
    updatedAt: '2026-02-24T00:00:00Z',
    ...overrides,
  }
}

function createMockRouter() {
  const auth = createAuthStore()
  const queryClient = new QueryClient()
  const listEmployeesMock: AppGateway['listEmployees'] = async (_accessToken, _query) => ({
    items: [makeEmployee()],
    totalCount: 1,
    page: 1,
    pageSize: 10,
  })
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
    listEmployees: vi.fn(listEmployeesMock),
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
    uploadEmployeeContract: vi.fn(async () => makeEmployee({ contractFilePath: 'employees/1/contract/new.pdf' })),
    removeEmployeeContract: vi.fn(async () => makeEmployee({ contractFilePath: null })),
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
    fireEvent.mouseDown(within(dialog).getByLabelText('Gender'))
    fireEvent.click(await screen.findByRole('option', { name: 'Male' }))
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
    expect(payload.gender).toBe('Male')
  })

  it('shows invalid phone field error and blocks save', async () => {
    const router = createMockRouter()
    renderPage(router)

    fireEvent.click(await screen.findByRole('button', { name: 'Add Employee' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(within(dialog).getByLabelText('Last Name'), { target: { value: 'Smith' } })
    fireEvent.mouseDown(within(dialog).getByLabelText('Gender'))
    fireEvent.click(await screen.findByRole('option', { name: 'Female' }))
    fireEvent.change(within(dialog).getByLabelText('Position'), { target: { value: 'Analyst' } })
    fireEvent.change(within(dialog).getByLabelText('Date of Hire'), { target: { value: '2026-02-24' } })
    fireEvent.change(within(dialog).getByLabelText('Phone'), { target: { value: 'bad***' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Use digits and an optional leading +')).toBeInTheDocument()
    expect(router.options.context.api.createEmployee).not.toHaveBeenCalled()
  })

  it('requires selecting gender before submit', async () => {
    const router = createMockRouter()
    renderPage(router)

    fireEvent.click(await screen.findByRole('button', { name: 'Add Employee' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(within(dialog).getByLabelText('Last Name'), { target: { value: 'Smith' } })
    fireEvent.change(within(dialog).getByLabelText('Position'), { target: { value: 'Analyst' } })
    fireEvent.change(within(dialog).getByLabelText('Date of Hire'), { target: { value: '2026-02-24' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Gender is required')).toBeInTheDocument()
    expect(router.options.context.api.createEmployee).not.toHaveBeenCalled()
  })

  it('renders gender as dropdown and preselects saved gender in edit', async () => {
    const router = createMockRouter()
    router.options.context.api.listEmployees = vi.fn(async (_accessToken: string, _query: any) => ({
      items: [makeEmployee({ gender: 'Female', contractFilePath: null })],
      totalCount: 1,
      page: 1,
      pageSize: 10,
    }))
    renderPage(router)

    const rowCell = await screen.findByText('Jane Doe')
    fireEvent.doubleClick(rowCell)
    const viewDialog = await screen.findByRole('dialog')
    fireEvent.click(within(viewDialog).getByRole('button', { name: 'Edit' }))
    const editDialog = await screen.findByRole('dialog')
    expect(within(editDialog).getByLabelText('Gender')).toHaveTextContent('Female')
  })

  it('surfaces backend phone validation under phone field', async () => {
    const router = createMockRouter()
    router.options.context.api.createEmployee = vi.fn(async (_accessToken: string, _payload: any) => {
      throw new Error('validation error [field=phone]: is invalid')
    })
    renderPage(router)

    fireEvent.click(await screen.findByRole('button', { name: 'Add Employee' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(within(dialog).getByLabelText('Last Name'), { target: { value: 'Smith' } })
    fireEvent.mouseDown(within(dialog).getByLabelText('Gender'))
    fireEvent.click(await screen.findByRole('option', { name: 'Male' }))
    fireEvent.change(within(dialog).getByLabelText('Position'), { target: { value: 'Analyst' } })
    fireEvent.change(within(dialog).getByLabelText('Date of Hire'), { target: { value: '2026-02-24' } })
    fireEvent.change(within(dialog).getByLabelText('Phone'), { target: { value: '+999' } })

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a valid phone number for the configured default country')).toBeInTheDocument()
  })
})
