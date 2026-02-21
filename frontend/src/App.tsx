import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { CssBaseline, ThemeProvider } from '@mui/material'

import { authStore } from './auth/authStore'
import { WailsGateway } from './lib/wails'
import { createAppRouter } from './router'
import { appTheme } from './theme'

const appApi = new WailsGateway()

function App() {
  const queryClient = useMemo(() => new QueryClient(), [])
  const router = useMemo(
    () =>
      createAppRouter({
        auth: authStore,
        api: appApi,
        queryClient,
      }),
    [queryClient],
  )

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
