import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, GridActionsCellItem, GridColDef, GridPaginationModel, GridToolbar } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { AppShell } from '../components/AppShell'
import { isHROrAdminRole } from '../auth/roles'
import type { Department, UpsertDepartmentInput } from '../types/departments'

type FormState = {
  name: string
  description: string
}

const initialFormState: FormState = {
  name: '',
  description: '',
}

function toPayload(state: FormState): UpsertDepartmentInput {
  return {
    name: state.name,
    description: state.description || undefined,
  }
}

export function DepartmentsPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''
  const role = session?.user.role ?? ''
  const canWrite = isHROrAdminRole(role)

  const [searchInput, setSearchInput] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [formError, setFormError] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const listQuery = useQuery({
    queryKey: ['departments', searchInput, paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      router.options.context.api.listDepartments(accessToken, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        q: searchInput,
      }),
    enabled: Boolean(accessToken),
  })

  const createMutation = useMutation({
    mutationFn: (payload: UpsertDepartmentInput) => router.options.context.api.createDepartment(accessToken, payload),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['departments'] })
      setSnackbar({ message: 'Department created successfully', severity: 'success' })
      setIsFormOpen(false)
    },
    onError: () => {
      setSnackbar({ message: 'Failed to create department', severity: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpsertDepartmentInput }) =>
      router.options.context.api.updateDepartment(accessToken, id, payload),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['departments'] })
      setSnackbar({ message: 'Department updated successfully', severity: 'success' })
      setIsFormOpen(false)
    },
    onError: () => {
      setSnackbar({ message: 'Failed to update department', severity: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => router.options.context.api.deleteDepartment(accessToken, id),
    onSuccess: async () => {
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['departments'] })
      await router.options.context.queryClient.invalidateQueries({ queryKey: ['employees'] })
      setSnackbar({ message: 'Department deleted successfully', severity: 'success' })
      setDeleteTarget(null)
    },
    onError: (error: Error) => {
      const message = error.message.toLowerCase().includes('department has employees')
        ? 'Cannot delete this department because employees are assigned to it.'
        : 'Failed to delete department'
      setSnackbar({ message, severity: 'error' })
    },
  })

  const onAdd = () => {
    setEditing(null)
    setFormState(initialFormState)
    setFormError('')
    setIsFormOpen(true)
  }

  const onEdit = (department: Department) => {
    setEditing(department)
    setFormState({ name: department.name, description: department.description ?? '' })
    setFormError('')
    setIsFormOpen(true)
  }

  const onSave = async () => {
    if (!formState.name.trim()) {
      setFormError('Department name is required')
      return
    }

    const payload = toPayload(formState)
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload })
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const columns = useMemo<GridColDef<Department>[]>(
    () => [
      { field: 'name', headerName: 'Name', minWidth: 220, flex: 1 },
      {
        field: 'description',
        headerName: 'Description',
        minWidth: 260,
        flex: 1.2,
        valueGetter: (params) => params.row.description ?? '-',
      },
      { field: 'employeeCount', headerName: 'Employee Count', minWidth: 160, flex: 0.6 },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 120,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEdit(row)}
            disabled={!canWrite}
            showInMenu
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => setDeleteTarget(row)}
            disabled={!canWrite}
            showInMenu
          />,
        ],
      },
    ],
    [canWrite],
  )

  const rows = listQuery.data?.items ?? []
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <AppShell title="Departments">
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Department Directory</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} disabled={!canWrite}>
            Add Department
          </Button>
        </Box>

        <TextField
          label="Search departments"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          fullWidth
        />

        {listQuery.isError ? <Alert severity="error">Failed to load departments</Alert> : null}

        <Box sx={{ height: 560, bgcolor: 'background.paper', borderRadius: 2, p: 1, boxShadow: 1 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={listQuery.isLoading}
            rowCount={listQuery.data?.totalCount ?? 0}
            paginationMode="server"
            pageSizeOptions={[10, 20, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
            initialState={{
              columns: {
                columnVisibilityModel: {
                  description: true,
                },
              },
            }}
            slots={{ toolbar: GridToolbar }}
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

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Department Name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              error={Boolean(formError)}
              helperText={formError}
              fullWidth
            />
            <TextField
              label="Description"
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the department "{deleteTarget?.name}"?
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
