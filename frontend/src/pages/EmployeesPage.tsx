import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { GridActionsCellItem, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import LinkIcon from '@mui/icons-material/Link'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { AppShell } from '../components/AppShell'
import { AppDataGrid, AppDataGridToolbar } from '../components/AppDataGrid'
import { isHROrAdminRole } from '../auth/roles'
import { defaultAppSettings } from '../lib/settings'
import type { Department } from '../types/departments'
import type { Employee, UpsertEmployeeInput } from '../types/employees'

type FormState = {
  firstName: string
  lastName: string
  otherName: string
  gender: string
  dateOfBirth: string
  phone: string
  email: string
  nationalId: string
  address: string
  jobDescription: string
  contractUrl: string
  departmentId: string
  position: string
  employmentStatus: string
  dateOfHire: string
  baseSalaryAmount: string
}

type DialogMode = 'create' | 'edit' | 'view'

const maxContractBytes = 10 * 1024 * 1024

const initialFormState: FormState = {
  firstName: '',
  lastName: '',
  otherName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  nationalId: '',
  address: '',
  jobDescription: '',
  contractUrl: '',
  departmentId: '',
  position: '',
  employmentStatus: 'Active',
  dateOfHire: '',
  baseSalaryAmount: '0',
}

function toPayload(state: FormState): UpsertEmployeeInput {
  const normalizedGender = state.gender === 'Male' || state.gender === 'Female' ? state.gender : undefined
  return {
    firstName: state.firstName,
    lastName: state.lastName,
    otherName: state.otherName || undefined,
    gender: normalizedGender,
    dateOfBirth: state.dateOfBirth || undefined,
    phone: state.phone || undefined,
    email: state.email || undefined,
    nationalId: state.nationalId || undefined,
    address: state.address || undefined,
    jobDescription: state.jobDescription || undefined,
    contractUrl: state.contractUrl || undefined,
    departmentId: state.departmentId ? Number(state.departmentId) : undefined,
    position: state.position,
    employmentStatus: state.employmentStatus,
    dateOfHire: state.dateOfHire,
    baseSalaryAmount: Number(state.baseSalaryAmount),
  }
}

function employeeToFormState(employee: Employee): FormState {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    otherName: employee.otherName ?? '',
    gender: employee.gender ?? '',
    dateOfBirth: employee.dateOfBirth?.slice(0, 10) ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    nationalId: employee.nationalId ?? '',
    address: employee.address ?? '',
    jobDescription: employee.jobDescription ?? '',
    contractUrl: employee.contractUrl ?? '',
    departmentId: employee.departmentId?.toString() ?? '',
    position: employee.position,
    employmentStatus: employee.employmentStatus,
    dateOfHire: employee.dateOfHire.slice(0, 10),
    baseSalaryAmount: employee.baseSalaryAmount.toString(),
  }
}

function validateForm(state: FormState) {
  const errors: Record<string, string> = {}

  if (!state.firstName.trim()) errors.firstName = 'First name is required'
  if (!state.lastName.trim()) errors.lastName = 'Last name is required'
  if (!state.position.trim()) errors.position = 'Position is required'
  if (!state.employmentStatus.trim()) errors.employmentStatus = 'Status is required'
  if (!state.dateOfHire.trim()) errors.dateOfHire = 'Date of hire is required'

  const salary = Number(state.baseSalaryAmount)
  if (Number.isNaN(salary) || salary < 0) {
    errors.baseSalaryAmount = 'Base salary must be a non-negative number'
  }

  if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!state.gender.trim()) {
    errors.gender = 'Gender is required'
  } else if (state.gender !== 'Male' && state.gender !== 'Female') {
    errors.gender = 'Select Male or Female'
  }

  if (state.phone) {
    const trimmed = state.phone.trim()
    if (!/^\+?[0-9 ]+$/.test(trimmed)) {
      errors.phone = 'Use digits and an optional leading +'
    }
  }

  return errors
}

function parseValidationFieldError(message: string): { field: string; detail: string } | null {
  const match = /validation error \[field=([A-Za-z0-9_]+)\]:\s*(.+)$/i.exec(message.trim())
  if (!match) {
    return null
  }
  return { field: match[1], detail: match[2] }
}

function contractNameFromPath(path?: string): string {
  if (!path) {
    return ''
  }
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

export function EmployeesPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role ?? ''
  const canWrite = isHROrAdminRole(role)

  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null)

  const listQuery = useQuery({
    queryKey: ['employees', searchInput, status, departmentFilter, paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      router.options.context.api.listEmployees(accessToken, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        q: searchInput,
        status: status || undefined,
        departmentId: departmentFilter ? Number(departmentFilter) : undefined,
      }),
    enabled: Boolean(accessToken),
  })

  const settingsQuery = useQuery({
    queryKey: ['settings', 'app'],
    queryFn: () => router.options.context.api.getSettings(accessToken),
    enabled: Boolean(accessToken),
  })

  const phoneHint = settingsQuery.data?.phoneDefaults?.defaultCountryCallingCode || defaultAppSettings.phoneDefaults.defaultCountryCallingCode

  const departmentsQuery = useQuery({
    queryKey: ['departments', 'options'],
    queryFn: () =>
      router.options.context.api.listDepartments(accessToken, {
        page: 1,
        pageSize: 200,
      }),
    enabled: Boolean(accessToken),
  })

  const createMutation = useMutation({
    mutationFn: (payload: UpsertEmployeeInput) => router.options.context.api.createEmployee(accessToken, payload),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSnackbar({ message: 'Employee created successfully', severity: 'success' })
      setIsFormOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpsertEmployeeInput }) =>
      router.options.context.api.updateEmployee(accessToken, id, payload),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSnackbar({ message: 'Employee updated successfully', severity: 'success' })
      setIsFormOpen(false)
    },
  })

  const uploadContractMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const bytes = Array.from(new Uint8Array(await file.arrayBuffer()))
      return router.options.context.api.uploadEmployeeContract(
        accessToken,
        id,
        file.name,
        file.type || 'application/octet-stream',
        bytes,
      )
    },
    onSuccess: async (employee) => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSelectedEmployee(employee)
      setFormState(employeeToFormState(employee))
      setContractFile(null)
      setSnackbar({ message: 'Contract uploaded successfully', severity: 'success' })
    },
  })

  const removeContractMutation = useMutation({
    mutationFn: (id: number) => router.options.context.api.removeEmployeeContract(accessToken, id),
    onSuccess: async (employee) => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSelectedEmployee(employee)
      setFormState(employeeToFormState(employee))
      setContractFile(null)
      setSnackbar({ message: 'Contract removed', severity: 'success' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => router.options.context.api.deleteEmployee(accessToken, id),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSnackbar({ message: 'Employee deleted successfully', severity: 'success' })
      setDeleteTarget(null)
    },
    onError: () => {
      setSnackbar({ message: 'Failed to delete employee', severity: 'error' })
    },
  })

  const onAddEmployee = () => {
    setDialogMode('create')
    setSelectedEmployee(null)
    setFormState(initialFormState)
    setFormErrors({})
    setContractFile(null)
    setIsFormOpen(true)
  }

  const onViewEmployee = (employee: Employee) => {
    setDialogMode('view')
    setSelectedEmployee(employee)
    setFormState(employeeToFormState(employee))
    setFormErrors({})
    setContractFile(null)
    setIsFormOpen(true)
  }

  const onEditEmployee = (employee: Employee) => {
    setDialogMode('edit')
    setSelectedEmployee(employee)
    setFormState(employeeToFormState(employee))
    setFormErrors({})
    setContractFile(null)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    const errors = validateForm(formState)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    const payload = toPayload(formState)
    try {
      if (dialogMode === 'create') {
        await createMutation.mutateAsync(payload)
        return
      }
      if (dialogMode === 'edit' && selectedEmployee) {
        await updateMutation.mutateAsync({ id: selectedEmployee.id, payload })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save employee'
      const fieldError = parseValidationFieldError(message)
      if (fieldError?.field === 'phone') {
        setFormErrors((prev) => ({ ...prev, phone: 'Enter a valid phone number for the configured default country' }))
        return
      }
      if (fieldError?.field === 'gender') {
        setFormErrors((prev) => ({ ...prev, gender: fieldError.detail }))
        return
      }
      setSnackbar({ message, severity: 'error' })
    }
  }

  const handleContractUpload = async () => {
    if (!selectedEmployee || !contractFile) {
      return
    }
    if (contractFile.size > maxContractBytes) {
      setSnackbar({ severity: 'error', message: 'Contract file exceeds 10MB' })
      return
    }

    const extension = contractFile.name.toLowerCase()
    if (!extension.endsWith('.pdf') && !extension.endsWith('.doc') && !extension.endsWith('.docx')) {
      setSnackbar({ severity: 'error', message: 'Only PDF, DOC, or DOCX files are allowed' })
      return
    }

    try {
      await uploadContractMutation.mutateAsync({ id: selectedEmployee.id, file: contractFile })
    } catch (error) {
      setSnackbar({ severity: 'error', message: error instanceof Error ? error.message : 'Failed to upload contract' })
    }
  }

  const columns = useMemo<GridColDef<Employee>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        minWidth: 200,
        flex: 1,
        valueGetter: (params) => `${params.row.firstName} ${params.row.lastName}`,
      },
      {
        field: 'gender',
        headerName: 'Gender',
        minWidth: 120,
        flex: 0.5,
        valueGetter: (params) => params.row.gender ?? '-',
      },
      {
        field: 'phone',
        headerName: 'Phone',
        minWidth: 140,
        flex: 0.8,
        valueGetter: (params) => params.row.phone ?? '-',
      },
      {
        field: 'jobDescription',
        headerName: 'Job Description',
        minWidth: 220,
        flex: 1.2,
        valueGetter: (params) => params.row.jobDescription ?? '-',
      },
      {
        field: 'position',
        headerName: 'Position',
        minWidth: 160,
        flex: 0.9,
      },
      {
        field: 'department',
        headerName: 'Department',
        minWidth: 140,
        flex: 0.8,
        valueGetter: (params) => params.row.departmentName ?? '-',
      },
      {
        field: 'employmentStatus',
        headerName: 'Status',
        minWidth: 140,
        flex: 0.8,
      },
      {
        field: 'dateOfHire',
        headerName: 'Date of Hire',
        minWidth: 150,
        flex: 0.8,
        valueGetter: (params) => params.row.dateOfHire.slice(0, 10),
      },
      {
        field: 'baseSalaryAmount',
        headerName: 'Base Salary',
        minWidth: 150,
        flex: 0.8,
        valueGetter: (params) => params.row.baseSalaryAmount.toLocaleString(),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 140,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon />}
            label="View"
            onClick={() => onViewEmployee(row)}
          />,
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEditEmployee(row)}
            disabled={!canWrite}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => setDeleteTarget(row)}
            disabled={!canWrite}
          />,
        ],
      },
    ],
    [canWrite],
  )

  const rows = listQuery.data?.items ?? []
  const isSaving = createMutation.isPending || updateMutation.isPending
  const activeContractPath = selectedEmployee?.contractFilePath ?? ''

  return (
    <AppShell title="Employees">
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Employee Directory</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAddEmployee} disabled={!canWrite}>
            Add Employee
          </Button>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Search by name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            fullWidth
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="On Leave">On Leave</MenuItem>
              <MenuItem value="Terminated">Terminated</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="department-filter-label">Department</InputLabel>
            <Select
              labelId="department-filter-label"
              label="Department"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(departmentsQuery.data?.items ?? []).map((department: Department) => (
                <MenuItem key={department.id} value={department.id.toString()}>
                  {department.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {listQuery.isError ? <Alert severity="error">Failed to load employees</Alert> : null}

        <Box sx={{ height: 560, bgcolor: 'background.paper', borderRadius: 2, p: 1, boxShadow: 1 }}>
          <AppDataGrid
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            rowCount={listQuery.data?.totalCount ?? 0}
            paginationMode="server"
            pageSizeOptions={[10, 20, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            onRowDoubleClick={(params) => onViewEmployee(params.row as Employee)}
            disableRowSelectionOnClick
            initialState={{
              columns: {
                columnVisibilityModel: {
                  gender: false,
                  phone: true,
                  jobDescription: false,
                },
              },
            }}
            slots={{ toolbar: AppDataGridToolbar }}
          />
        </Box>
      </Stack>

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Add Employee' : dialogMode === 'edit' ? 'Edit Employee' : 'View Employee'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First Name"
                value={formState.firstName}
                onChange={(event) => setFormState((prev) => ({ ...prev, firstName: event.target.value }))}
                error={Boolean(formErrors.firstName)}
                helperText={formErrors.firstName}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="Last Name"
                value={formState.lastName}
                onChange={(event) => setFormState((prev) => ({ ...prev, lastName: event.target.value }))}
                error={Boolean(formErrors.lastName)}
                helperText={formErrors.lastName}
                fullWidth
                disabled={dialogMode === 'view'}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Other Name"
                value={formState.otherName}
                onChange={(event) => setFormState((prev) => ({ ...prev, otherName: event.target.value }))}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              <FormControl fullWidth disabled={dialogMode === 'view'} error={Boolean(formErrors.gender)}>
                <InputLabel id="employee-gender-label">Gender</InputLabel>
                <Select
                  labelId="employee-gender-label"
                  label="Gender"
                  value={formState.gender}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, gender: event.target.value }))
                    setFormErrors((prev) => ({ ...prev, gender: '' }))
                  }}
                >
                  <MenuItem value="">
                    <em>Select gender</em>
                  </MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
                {formErrors.gender ? (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {formErrors.gender}
                  </Typography>
                ) : null}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Phone"
                value={formState.phone}
                onChange={(event) => {
                  setFormState((prev) => ({ ...prev, phone: event.target.value }))
                  setFormErrors((prev) => ({ ...prev, phone: '' }))
                }}
                error={Boolean(formErrors.phone)}
                helperText={formErrors.phone || `Use national format or ${phoneHint}...`}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="Email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                error={Boolean(formErrors.email)}
                helperText={formErrors.email}
                fullWidth
                disabled={dialogMode === 'view'}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth disabled={dialogMode === 'view'}>
                <InputLabel id="employee-department-label">Department</InputLabel>
                <Select
                  labelId="employee-department-label"
                  label="Department"
                  value={formState.departmentId}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, departmentId: event.target.value }))
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {(departmentsQuery.data?.items ?? []).map((department: Department) => (
                    <MenuItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Position"
                value={formState.position}
                onChange={(event) => setFormState((prev) => ({ ...prev, position: event.target.value }))}
                error={Boolean(formErrors.position)}
                helperText={formErrors.position}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="Employment Status"
                value={formState.employmentStatus}
                onChange={(event) => setFormState((prev) => ({ ...prev, employmentStatus: event.target.value }))}
                error={Boolean(formErrors.employmentStatus)}
                helperText={formErrors.employmentStatus}
                fullWidth
                disabled={dialogMode === 'view'}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Date of Hire"
                type="date"
                value={formState.dateOfHire}
                onChange={(event) => setFormState((prev) => ({ ...prev, dateOfHire: event.target.value }))}
                error={Boolean(formErrors.dateOfHire)}
                helperText={formErrors.dateOfHire}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="Date of Birth"
                type="date"
                value={formState.dateOfBirth}
                onChange={(event) => setFormState((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={dialogMode === 'view'}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Base Salary"
                type="number"
                value={formState.baseSalaryAmount}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, baseSalaryAmount: event.target.value }))
                }
                error={Boolean(formErrors.baseSalaryAmount)}
                helperText={formErrors.baseSalaryAmount}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="National ID"
                value={formState.nationalId}
                onChange={(event) => setFormState((prev) => ({ ...prev, nationalId: event.target.value }))}
                fullWidth
                disabled={dialogMode === 'view'}
              />
            </Stack>

            <TextField
              label="Address"
              value={formState.address}
              onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
              multiline
              minRows={2}
              disabled={dialogMode === 'view'}
            />

            <TextField
              label="Job Description"
              value={formState.jobDescription}
              onChange={(event) => setFormState((prev) => ({ ...prev, jobDescription: event.target.value }))}
              multiline
              minRows={3}
              disabled={dialogMode === 'view'}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                label="Contract URL"
                value={formState.contractUrl}
                onChange={(event) => setFormState((prev) => ({ ...prev, contractUrl: event.target.value }))}
                fullWidth
                disabled={dialogMode === 'view'}
              />
              {formState.contractUrl.trim() ? (
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={() => window.open(formState.contractUrl.trim(), '_blank', 'noopener,noreferrer')}
                >
                  Open URL
                </Button>
              ) : null}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Contract File</Typography>
              {!selectedEmployee ? (
                <Typography variant="body2" color="text.secondary">
                  Save the employee first, then upload a contract file.
                </Typography>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={dialogMode === 'view' || uploadContractMutation.isPending}
                  >
                    Select Contract
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => setContractFile(event.target.files?.[0] ?? null)}
                    />
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleContractUpload}
                    disabled={dialogMode === 'view' || !contractFile || uploadContractMutation.isPending}
                  >
                    {uploadContractMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {contractFile ? `Selected: ${contractFile.name}` : activeContractPath ? `Current: ${contractNameFromPath(activeContractPath)}` : 'No contract uploaded'}
                  </Typography>
                  {activeContractPath && dialogMode !== 'view' ? (
                    <Button
                      color="error"
                      variant="text"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => selectedEmployee && removeContractMutation.mutate(selectedEmployee.id)}
                      disabled={removeContractMutation.isPending}
                    >
                      {removeContractMutation.isPending ? 'Removing...' : 'Remove'}
                    </Button>
                  ) : null}
                </Stack>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Close</Button>
          {dialogMode === 'view' && canWrite ? (
            <Button variant="outlined" onClick={() => setDialogMode('edit')}>
              Edit
            </Button>
          ) : null}
          {dialogMode !== 'view' ? (
            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Employee</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {deleteTarget?.firstName} {deleteTarget?.lastName}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar?.severity ?? 'success'} onClose={() => setSnackbar(null)}>
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </AppShell>
  )
}
