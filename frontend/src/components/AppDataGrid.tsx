import { Box } from '@mui/material'
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  type DataGridProps,
  type GridValidRowModel,
} from '@mui/x-data-grid'
import type { SxProps, Theme } from '@mui/material/styles'

export function AppDataGrid<R extends GridValidRowModel>(props: DataGridProps<R>) {
  const baseSx: SxProps<Theme> = {
    border: 0,
    '& .MuiDataGrid-columnHeaders': {
      position: 'sticky',
      top: 0,
      zIndex: 2,
      backgroundColor: 'background.paper',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700,
    },
    '& .MuiDataGrid-cell': {
      alignItems: 'center',
    },
    '& .MuiDataGrid-virtualScroller': {
      scrollBehavior: 'smooth',
    },
  }

  return (
    <DataGrid<R>
      {...props}
      rowHeight={props.rowHeight ?? 48}
      columnHeaderHeight={props.columnHeaderHeight ?? 52}
      density={props.density ?? 'standard'}
      sx={[baseSx, props.sx] as SxProps<Theme>}
    />
  )
}

export function AppDataGridToolbar() {
  return (
    <GridToolbarContainer sx={{ gap: 1, p: 0.5 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  )
}
