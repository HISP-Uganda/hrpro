import { Alert } from '@mui/material'

import { AppShell } from '../components/AppShell'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <AppShell title={title}>
      <Alert severity="info">{title} module is a placeholder in this milestone.</Alert>
    </AppShell>
  )
}
