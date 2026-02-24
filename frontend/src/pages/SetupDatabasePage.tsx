import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import type { DatabaseConfigInput } from '../types/startup'

type SnackbarState = {
  severity: 'success' | 'error' | 'info'
  message: string
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return fallback
}

function maskPassword(password: string): string {
  if (!password) {
    return ''
  }
  return '*'.repeat(Math.max(password.length, 8))
}

function buildConnectionPreview(input: DatabaseConfigInput): string {
  const host = input.host.trim()
  const database = input.database.trim()
  const user = input.user.trim()
  const sslmode = input.sslmode.trim() || 'disable'
  return `postgres://${user}:${maskPassword(input.password)}@${host}:${input.port}/${database}?sslmode=${sslmode}`
}

export function SetupDatabasePage() {
  const router = useRouter()
  const navigate = useNavigate()
  const health = router.options.context.startup.getSnapshot()
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [input, setInput] = useState<DatabaseConfigInput>({
    host: '',
    port: 5432,
    database: '',
    user: '',
    password: '',
    sslmode: 'disable',
  })

  const connectionPreview = useMemo(() => buildConnectionPreview(input), [input])

  const testMutation = useMutation({
    mutationFn: async () => {
      await router.options.context.api.testDatabaseConnection(input)
    },
    onSuccess: () => {
      setSnackbar({ severity: 'success', message: 'Database connection test succeeded.' })
    },
    onError: (error) => {
      const message = toErrorMessage(error, 'Database connection test failed.')
      setSnackbar({ severity: 'error', message })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      await router.options.context.api.saveDatabaseConfig(input)
      await router.options.context.api.reloadConfigAndReconnect()
      const updatedHealth = await router.options.context.api.getStartupHealth()
      router.options.context.startup.setHealth(updatedHealth)

      if (!updatedHealth.dbOk) {
        throw new Error(updatedHealth.dbError || 'Database is still unavailable after reconnect.')
      }
      if (!updatedHealth.runtimeOk) {
        throw new Error(updatedHealth.runtimeError || 'Runtime security configuration is unavailable.')
      }
    },
    onSuccess: async () => {
      setSnackbar({ severity: 'success', message: 'Database config saved and connection established.' })
      await navigate({ to: '/login' })
    },
    onError: (error) => {
      const message = toErrorMessage(error, 'Failed to save database configuration.')
      setSnackbar({ severity: 'error', message })
    },
  })

  const isBusy = testMutation.isPending || saveMutation.isPending

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background: 'linear-gradient(145deg, #f4f7fb 0%, #e9f1fb 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 720, boxShadow: 8, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Database Setup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter PostgreSQL connection settings to continue to login.
          </Typography>

          <Stack spacing={1.25} sx={{ mb: 2 }}>
            <Alert severity={health.dbOk ? 'success' : 'warning'}>
              Database config status: {health.dbOk ? 'Configured' : health.dbError || 'Missing'}
            </Alert>
            <Alert severity={health.runtimeOk ? 'success' : 'warning'}>
              Runtime security status: {health.runtimeOk ? 'JWT secret ready (env/persisted/generated)' : health.runtimeError || 'Unavailable'}
            </Alert>
          </Stack>

          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Host"
                fullWidth
                value={input.host}
                onChange={(event) => setInput((previous) => ({ ...previous, host: event.target.value }))}
                disabled={isBusy}
                required
              />
              <TextField
                label="Port"
                fullWidth
                type="number"
                value={input.port}
                onChange={(event) =>
                  setInput((previous) => ({ ...previous, port: Number.parseInt(event.target.value, 10) || 0 }))
                }
                disabled={isBusy}
                required
              />
            </Stack>

            <TextField
              label="Database"
              fullWidth
              value={input.database}
              onChange={(event) => setInput((previous) => ({ ...previous, database: event.target.value }))}
              disabled={isBusy}
              required
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="User"
                fullWidth
                value={input.user}
                onChange={(event) => setInput((previous) => ({ ...previous, user: event.target.value }))}
                disabled={isBusy}
                required
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={input.password}
                onChange={(event) => setInput((previous) => ({ ...previous, password: event.target.value }))}
                disabled={isBusy}
                required
              />
            </Stack>

            <TextField
              label="SSL Mode"
              select
              fullWidth
              value={input.sslmode}
              onChange={(event) => setInput((previous) => ({ ...previous, sslmode: event.target.value }))}
              disabled={isBusy}
            >
              <MenuItem value="disable">disable</MenuItem>
              <MenuItem value="require">require</MenuItem>
              <MenuItem value="verify-ca">verify-ca</MenuItem>
              <MenuItem value="verify-full">verify-full</MenuItem>
            </TextField>

            <TextField
              label="Connection Preview"
              value={connectionPreview}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => testMutation.mutate()}
                disabled={isBusy}
              >
                {testMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => saveMutation.mutate()}
                disabled={isBusy}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.severity ?? 'info'}
          variant="filled"
          onClose={() => setSnackbar(null)}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
