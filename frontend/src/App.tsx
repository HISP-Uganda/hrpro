import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { authStore } from './auth/authStore'
import { WailsGateway } from './lib/wails'
import { createAppRouter } from './router'
import { AppThemeProvider } from './theme/ThemeProvider'

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
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppThemeProvider>
  )
}

export default App
