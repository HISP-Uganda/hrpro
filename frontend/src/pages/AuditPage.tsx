import { useMemo, useState } from 'react'
import { Alert, Box, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef, GridPaginationModel, GridToolbar } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { AppShell } from '../components/AppShell'
import type { AuditLog } from '../types/audit'

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleString()
}

function formatNullableNumber(value: number | null): string {
  return value === null ? '-' : String(value)
}

export function AuditPage() {
  const router = useRouter()
  const session = router.options.context.auth.getSnapshot()
  const accessToken = session?.accessToken ?? ''

  const [searchInput, setSearchInput] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 })

  const listQuery = useQuery({
    queryKey: ['audit-logs', searchInput, paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      router.options.context.api.listAuditLogs(accessToken, {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        q: searchInput || undefined,
      }),
    enabled: Boolean(accessToken),
  })

  const columns = useMemo<GridColDef<AuditLog>[]>(
    () => [
      { field: 'id', headerName: 'ID', minWidth: 90, flex: 0.4 },
      {
        field: 'createdAt',
        headerName: 'Timestamp',
        minWidth: 180,
        flex: 0.9,
        valueFormatter: (params) => formatDateTime(String(params.value ?? '')),
      },
      {
        field: 'actorUserId',
        headerName: 'Actor',
        minWidth: 110,
        flex: 0.5,
        valueFormatter: (params) => formatNullableNumber((params.value as number | null) ?? null),
      },
      { field: 'action', headerName: 'Action', minWidth: 220, flex: 1.1 },
      {
        field: 'entityType',
        headerName: 'Entity Type',
        minWidth: 140,
        flex: 0.7,
        valueGetter: (params) => params.row.entityType ?? '-',
      },
      {
        field: 'entityId',
        headerName: 'Entity ID',
        minWidth: 120,
        flex: 0.5,
        valueFormatter: (params) => formatNullableNumber((params.value as number | null) ?? null),
      },
      {
        field: 'metadata',
        headerName: 'Metadata',
        minWidth: 280,
        flex: 1.4,
        valueGetter: (params) => params.row.metadata || '{}',
      },
    ],
    [],
  )

  return (
    <AppShell title="Audit Logs">
      <Stack spacing={2}>
        <Typography variant="h6">System Audit Trail</Typography>
        <TextField
          label="Search by action or entity type"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          fullWidth
        />
        {listQuery.isError ? <Alert severity="error">Failed to load audit logs.</Alert> : null}
        <Box sx={{ height: 620, bgcolor: 'background.paper', borderRadius: 2, p: 1, boxShadow: 1 }}>
          <DataGrid
            rows={listQuery.data?.items ?? []}
            columns={columns}
            loading={listQuery.isLoading}
            rowCount={listQuery.data?.totalCount ?? 0}
            paginationMode="server"
            pageSizeOptions={[10, 20, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
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
    </AppShell>
  )
}
