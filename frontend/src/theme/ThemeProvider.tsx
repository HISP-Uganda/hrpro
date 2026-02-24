import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider as MuiThemeProvider, useMediaQuery } from '@mui/material'

import { palettePresets, type ThemePreset } from './palettePresets'
import { createAppTheme, type ResolvedThemeMode } from './theme'

export type ThemeModeSetting = 'light' | 'dark' | 'system'

const STORAGE_MODE_KEY = 'hr.theme.mode'
const STORAGE_PRESET_KEY = 'hr.theme.preset'

type ThemeSettingsContextValue = {
  mode: ThemeModeSetting
  preset: ThemePreset
  effectiveMode: ResolvedThemeMode
  setMode: (mode: ThemeModeSetting) => void
  setPreset: (preset: ThemePreset) => void
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | undefined>(undefined)

function readInitialMode(): ThemeModeSetting {
  const value = window.localStorage.getItem(STORAGE_MODE_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value
  }
  return 'system'
}

function readInitialPreset(): ThemePreset {
  const value = window.localStorage.getItem(STORAGE_PRESET_KEY)
  if (value && value in palettePresets) {
    return value as ThemePreset
  }
  return 'blue'
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeModeSetting>(() => readInitialMode())
  const [preset, setPreset] = useState<ThemePreset>(() => readInitialPreset())
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })
  const effectiveMode: ResolvedThemeMode = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode

  useEffect(() => {
    window.localStorage.setItem(STORAGE_MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_PRESET_KEY, preset)
  }, [preset])

  const muiTheme = useMemo(() => createAppTheme(effectiveMode, preset), [effectiveMode, preset])

  const contextValue = useMemo<ThemeSettingsContextValue>(
    () => ({
      mode,
      preset,
      effectiveMode,
      setMode,
      setPreset,
    }),
    [effectiveMode, mode, preset],
  )

  return (
    <ThemeSettingsContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeSettingsContext.Provider>
  )
}

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext)
  if (!context) {
    throw new Error('useThemeSettings must be used within AppThemeProvider')
  }
  return context
}

export const themeStorageKeys = {
  mode: STORAGE_MODE_KEY,
  preset: STORAGE_PRESET_KEY,
}
