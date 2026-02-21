import { Box, Button, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'

export function AccessDeniedPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h4">Access Denied</Typography>
      <Typography variant="body1" color="text.secondary">
        You do not have permission to access this page.
      </Typography>
      <Button variant="contained" component={Link} to="/dashboard">
        Go to Dashboard
      </Button>
    </Box>
  )
}
