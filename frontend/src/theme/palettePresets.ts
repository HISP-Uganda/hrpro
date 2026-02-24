export type ThemePreset = 'blue' | 'teal' | 'purple' | 'green' | 'orange'

export type PalettePreset = {
  key: ThemePreset
  label: string
  primary: string
  secondary: string
}

export const palettePresets: Record<ThemePreset, PalettePreset> = {
  blue: {
    key: 'blue',
    label: 'Blue',
    primary: '#0f4c81',
    secondary: '#1565c0',
  },
  teal: {
    key: 'teal',
    label: 'Teal',
    primary: '#0f766e',
    secondary: '#0ea5a5',
  },
  purple: {
    key: 'purple',
    label: 'Purple',
    primary: '#6d28d9',
    secondary: '#a855f7',
  },
  green: {
    key: 'green',
    label: 'Green',
    primary: '#166534',
    secondary: '#22c55e',
  },
  orange: {
    key: 'orange',
    label: 'Orange',
    primary: '#9a3412',
    secondary: '#f97316',
  },
}

export const presetOptions: PalettePreset[] = [
  palettePresets.blue,
  palettePresets.teal,
  palettePresets.purple,
  palettePresets.green,
  palettePresets.orange,
]
