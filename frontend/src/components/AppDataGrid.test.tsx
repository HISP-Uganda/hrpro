import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppDataGrid } from './AppDataGrid'

describe('AppDataGrid', () => {
  it('renders column header titles with the DataGrid header title class', async () => {
    const { findByText } = render(
      <div style={{ height: 320, width: 600 }}>
        <AppDataGrid rows={[{ id: 1, name: 'Alice' }]} columns={[{ field: 'name', headerName: 'Name', flex: 1 }]} />
      </div>,
    )

    const headerTitle = await findByText('Name')
    expect(headerTitle.className).toContain('MuiDataGrid-columnHeaderTitle')
  })
})
