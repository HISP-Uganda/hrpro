import { Card, CardContent, Grid, Typography } from '@mui/material'

import { AppShell } from '../components/AppShell'

const cards = [
  { label: 'Employees', value: '128' },
  { label: 'Departments', value: '12' },
  { label: 'Pending Leave', value: '9' },
  { label: 'Payroll Batches', value: '1 Draft' },
]

export function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" color="primary">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </AppShell>
  )
}
