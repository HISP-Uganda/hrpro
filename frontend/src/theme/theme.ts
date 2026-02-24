import { alpha, createTheme } from '@mui/material/styles'

import { palettePresets, type ThemePreset } from './palettePresets'

export type ResolvedThemeMode = 'light' | 'dark'

export function createAppTheme(mode: ResolvedThemeMode, preset: ThemePreset) {
  const accent = palettePresets[preset]
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: accent.primary,
      },
      secondary: {
        main: accent.secondary,
      },
      background: isDark
        ? {
            default: '#0b1220',
            paper: '#111827',
          }
        : {
            default: '#f4f7fb',
            paper: '#ffffff',
          },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Nunito", "Segoe UI", sans-serif',
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
      },
      button: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
              borderLeft: `3px solid ${theme.palette.primary.main}`,
            },
            '&.Mui-selected:hover': {
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2),
            },
          }),
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.main,
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
    },
  })
}
