import { Box, Button, Typography } from '@mui/material'

export function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Typography variant="h4">Page Not Found</Typography>
      <Button component="a" href="/" variant="contained">
        Back to Home
      </Button>
    </Box>
  )
}
