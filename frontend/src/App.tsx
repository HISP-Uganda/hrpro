import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { createAuthExpiryMutationHandler } from './auth/authExpiry'
import { authStore } from './auth/authStore'
import { recoverSessionOnStartup, setAuthNotice } from './auth/sessionRecovery'
import { WailsGateway } from './lib/wails'
import { createAppRouter } from './router'
import { StartupStore } from './startup/startupStore'
import { AppThemeProvider } from './theme/ThemeProvider'

const appApi = new WailsGateway()

function App() {
  const queryClient = useMemo(() => new QueryClient(), [])
  const startup = useMemo(() => new StartupStore(), [])
  const [startupReady, setStartupReady] = useState(false)
  const [startupLoadError, setStartupLoadError] = useState('')

  useEffect(() => {
    let active = true

    const loadStartupHealth = async () => {
      try {
        const health = await appApi.getStartupHealth()
        if (!active) {
          return
        }
        startup.setHealth(health)
        setStartupLoadError('')
        setStartupReady(true)
      } catch (error) {
        if (!active) {
          return
        }
        setStartupLoadError(error instanceof Error ? error.message : 'Failed to load startup health.')
      }
    }

    void loadStartupHealth()

    return () => {
      active = false
    }
  }, [startup])

  const reloadStartupHealth = async () => {
    setStartupReady(false)
    try {
      const health = await appApi.getStartupHealth()
      startup.setHealth(health)
      setStartupLoadError('')
      setStartupReady(true)
    } catch (error) {
      setStartupLoadError(error instanceof Error ? error.message : 'Failed to load startup health.')
    }
  }

  const router = useMemo(
    () =>
      createAppRouter({
        auth: authStore,
        startup,
        api: appApi,
        queryClient,
      }),
    [queryClient, startup],
  )

  const handleAuthExpiryMutationError = useMemo(
    () =>
      createAuthExpiryMutationHandler({
        auth: authStore,
        queryClient,
        navigateToLogin: async () => {
          await router.navigate({ to: '/login' })
        },
        setAuthNotice,
      }),
    [queryClient, router],
  )

  useEffect(() => {
    queryClient.getMutationCache().config.onError = (error) => {
      void handleAuthExpiryMutationError(error)
    }
    return () => {
      queryClient.getMutationCache().config.onError = undefined
    }
  }, [handleAuthExpiryMutationError, queryClient])

  useEffect(() => {
    if (!startupReady || !startup.getSnapshot().dbOk) {
      return
    }
    void recoverSessionOnStartup({
      auth: authStore,
      api: appApi,
      queryClient,
      navigateToLogin: async () => {
        await router.navigate({ to: '/login' })
      },
    })
  }, [queryClient, router, startup, startupReady])

  if (!startupReady) {
    return (
      <AppThemeProvider>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Stack spacing={2} alignItems="center" sx={{ maxWidth: 540 }}>
            <CircularProgress size={32} />
            <Typography variant="body1">Checking database startup health...</Typography>
            {startupLoadError ? (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => void reloadStartupHealth()}>
                    Retry
                  </Button>
                }
              >
                {startupLoadError}
              </Alert>
            ) : null}
          </Stack>
        </Box>
      </AppThemeProvider>
    )
  }

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppThemeProvider>
  )
}

export default App
