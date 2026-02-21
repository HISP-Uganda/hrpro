import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
} from '@mui/x-data-grid'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { isAdminRole } from '../auth/roles'
import { AppShell } from '../components/AppShell'
import type { CreateUserInput, ManagedUser, UpdateUserInput, UserRole } from '../types/users'

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'finance_officer', label: 'Finance Officer' },
  { value: 'viewer', label: 'Viewer' },
]

type SnackbarState = { message: string; severity: 'success' | 'error' } | null

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function formatRole(value: string): string {
  const normalized = value.replace(/\s+/g, '_').toLowerCase()
  const found = roleOptions.find((item) => item.value === normalized)
  return found ? found.label : value
}

export function UsersPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const canManage = isAdminRole(session?.user.role)
  const currentUserId = session?.user.id ?? 0

  const [search, setSearch] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    updatedAt: false,
  })
  const [snackbar, setSnackbar] = useState<SnackbarState>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createState, setCreateState] = useState<CreateUserInput>({ username: '', password: '', role: 'viewer' })
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null)
  const [editState, setEditState] = useState<UpdateUserInput>({ username: '', role: 'viewer' })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [passwordTarget, setPasswordTarget] = useState<ManagedUser | null>(null)
  const [passwordState, setPasswordState] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const [statusTarget, setStatusTarget] = useState<ManagedUser | null>(null)

  const listQuery = useQuery({
    queryKey: ['users', search, paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      router.options.context.api.listUsers(accessToken, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        q: search || undefined,
      }),
    enabled: Boolean(accessToken) && canManage,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserInput) => router.options.context.api.createUser(accessToken, payload),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreateOpen(false)
      setCreateState({ username: '', password: '', role: 'viewer' })
      setCreateErrors({})
      setSnackbar({ message: 'User created successfully', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to create user', severity: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserInput }) =>
      router.options.context.api.updateUser(accessToken, id, payload),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditTarget(null)
      setSnackbar({ message: 'User updated successfully', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to update user', severity: 'error' })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      router.options.context.api.resetUserPassword(accessToken, id, password),
    onSuccess: () => {
      setPasswordTarget(null)
      setPasswordState({ newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
      setSnackbar({ message: 'Password reset successfully', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to reset password', severity: 'error' })
    },
  })

  const setStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => router.options.context.api.setUserActive(accessToken, id, active),
    onSuccess: async (_, variables) => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['users'] })
      setStatusTarget(null)
      setSnackbar({ message: variables.active ? 'User activated' : 'User deactivated', severity: 'success' })
    },
    onError: (error: Error) => {
      setSnackbar({ message: error.message || 'Failed to update user status', severity: 'error' })
    },
  })

  const columns = useMemo<GridColDef<ManagedUser>[]>(
    () => [
      { field: 'username', headerName: 'Username', minWidth: 180, flex: 1 },
      {
        field: 'role',
        headerName: 'Role',
        minWidth: 180,
        flex: 0.7,
        valueFormatter: (params) => formatRole(String(params.value ?? '')),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        minWidth: 130,
        flex: 0.5,
        renderCell: (params) => (
          <Chip
            size="small"
            color={params.row.isActive ? 'success' : 'default'}
            label={params.row.isActive ? 'Active' : 'Inactive'}
          />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created At',
        minWidth: 170,
        flex: 0.9,
        valueFormatter: (params) => formatDateTime(String(params.value ?? '')),
      },
      {
        field: 'updatedAt',
        headerName: 'Updated At',
        minWidth: 170,
        flex: 0.9,
        valueFormatter: (params) => formatDateTime(String(params.value ?? '')),
      },
      {
        field: 'lastLoginAt',
        headerName: 'Last Login',
        minWidth: 170,
        flex: 0.9,
        valueFormatter: (params) => formatDateTime(String(params.value ?? '')),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 140,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => {
              setEditTarget(row)
              setEditState({ username: row.username, role: (row.role.replace(/\s+/g, '_').toLowerCase() as UserRole) || 'viewer' })
              setEditErrors({})
            }}
            disabled={!canManage}
            showInMenu
          />,
          <GridActionsCellItem
            key="reset-password"
            icon={<LockResetIcon />}
            label="Reset Password"
            onClick={() => {
              setPasswordTarget(row)
              setPasswordState({ newPassword: '', confirmPassword: '' })
              setPasswordErrors({})
            }}
            disabled={!canManage}
            showInMenu
          />,
          <GridActionsCellItem
            key="toggle-status"
            icon={row.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
            label={row.isActive ? 'Deactivate' : 'Activate'}
            onClick={() => setStatusTarget(row)}
            disabled={!canManage || (row.id === currentUserId && row.isActive)}
            showInMenu
          />,
        ],
      },
    ],
    [canManage, currentUserId],
  )

  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!createState.username.trim()) errors.username = 'Username is required'
    if (createState.password.length < 8) errors.password = 'Password must be at least 8 characters'
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEdit = (): boolean => {
    const errors: Record<string, string> = {}
    if (!editState.username.trim()) errors.username = 'Username is required'
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {}
    if (passwordState.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters'
    if (passwordState.confirmPassword !== passwordState.newPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  return (
    <AppShell title="Users">
      <Stack spacing={2.5}>
        {!canManage ? <Alert severity="error">Only admins can manage users.</Alert> : null}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            User Management
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} disabled={!canManage}>
            Create User
          </Button>
        </Box>

        <TextField
          label="Search users by username"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPaginationModel((prev) => ({ ...prev, page: 0 }))
          }}
          fullWidth
        />

        {listQuery.isError ? <Alert severity="error">Failed to load users</Alert> : null}

        <Box sx={{ height: 580, width: '100%', bgcolor: 'background.paper', borderRadius: 2, p: 1, boxShadow: 1 }}>
          <DataGrid<ManagedUser>
            rows={listQuery.data?.items ?? []}
            columns={columns}
            loading={listQuery.isLoading}
            rowCount={listQuery.data?.totalCount ?? 0}
            disableRowSelectionOnClick
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            slots={{ toolbar: GridToolbar }}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
            sx={{
              border: 0,
              '& .MuiDataGrid-columnHeaders': {
                position: 'sticky',
                top: 0,
                zIndex: 2,
                backgroundColor: 'background.paper',
              },
            }}
          />
        </Box>
      </Stack>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={createState.username}
              onChange={(event) => setCreateState((prev) => ({ ...prev, username: event.target.value }))}
              error={Boolean(createErrors.username)}
              helperText={createErrors.username}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={createState.password}
              onChange={(event) => setCreateState((prev) => ({ ...prev, password: event.target.value }))}
              error={Boolean(createErrors.password)}
              helperText={createErrors.password}
              fullWidth
            />
            <TextField
              select
              label="Role"
              value={createState.role}
              onChange={(event) => setCreateState((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              fullWidth
            >
              {roleOptions.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!validateCreate()) return
              createMutation.mutate(createState)
            }}
            disabled={createMutation.isPending || !canManage}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={editState.username}
              onChange={(event) => setEditState((prev) => ({ ...prev, username: event.target.value }))}
              error={Boolean(editErrors.username)}
              helperText={editErrors.username}
              fullWidth
            />
            <TextField
              select
              label="Role"
              value={editState.role}
              onChange={(event) => setEditState((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              fullWidth
            >
              {roleOptions.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!editTarget || !validateEdit()) return
              updateMutation.mutate({ id: editTarget.id, payload: editState })
            }}
            disabled={updateMutation.isPending || !canManage}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(passwordTarget)} onClose={() => setPasswordTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="New Password"
              type="password"
              value={passwordState.newPassword}
              onChange={(event) => setPasswordState((prev) => ({ ...prev, newPassword: event.target.value }))}
              error={Boolean(passwordErrors.newPassword)}
              helperText={passwordErrors.newPassword}
              fullWidth
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={passwordState.confirmPassword}
              onChange={(event) => setPasswordState((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              error={Boolean(passwordErrors.confirmPassword)}
              helperText={passwordErrors.confirmPassword}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordTarget(null)} disabled={resetPasswordMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!passwordTarget || !validatePassword()) return
              resetPasswordMutation.mutate({ id: passwordTarget.id, password: passwordState.newPassword })
            }}
            disabled={resetPasswordMutation.isPending || !canManage}
          >
            {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(statusTarget)} onClose={() => setStatusTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{statusTarget?.isActive ? 'Deactivate User' : 'Activate User'}</DialogTitle>
        <DialogContent>
          {statusTarget ? (
            <Typography>
              {statusTarget.isActive
                ? `Deactivate user "${statusTarget.username}"?`
                : `Activate user "${statusTarget.username}"?`}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusTarget(null)} disabled={setStatusMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={statusTarget?.isActive ? 'error' : 'primary'}
            onClick={() => {
              if (!statusTarget) return
              setStatusMutation.mutate({ id: statusTarget.id, active: !statusTarget.isActive })
            }}
            disabled={setStatusMutation.isPending || !canManage}
          >
            {setStatusMutation.isPending ? 'Saving...' : statusTarget?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </AppShell>
  )
}
