# Theme System

Date: 2026-02-24

## Overview

Implemented a centralized MUI theme system with:

- Theme mode: `light` | `dark` | `system`
- Accent presets (5 options)
- Local persistence via `localStorage`
- App-level provider and Appearance settings UI in the AppBar user menu

This milestone is frontend-only and introduces no schema or backend API changes.

## Theme Structure

Files:

- `frontend/src/theme/palettePresets.ts`
- `frontend/src/theme/theme.ts`
- `frontend/src/theme/ThemeProvider.tsx`

Integration points:

- `frontend/src/App.tsx` wraps app with `AppThemeProvider`
- `frontend/src/components/AppShell.tsx` hosts Appearance dialog

## Local Storage Keys

- `hr.theme.mode`
- `hr.theme.preset`

Mode handling:

- `system` resolves from `prefers-color-scheme` and updates automatically when OS preference changes.

## Presets

Current presets:

- `blue`
- `teal`
- `purple`
- `green`
- `orange`

Each preset defines `primary` and `secondary` colors and is applied globally through MUI theme tokens.

## UI Behavior

- AppBar follows active accent (primary palette).
- Drawer selected item uses accent highlight and left border.
- Buttons, chips, links, and other palette-aware components automatically reflect the selected preset.
- `AppDataGrid` sticky/bold header behavior remains intact in both light/dark modes.

## How To Extend Presets

1. Add a new entry in `frontend/src/theme/palettePresets.ts` with:
   - `key`
   - `label`
   - `primary`
   - `secondary`
2. Add the new preset to `presetOptions`.
3. No additional wiring is needed; the Appearance dialog and theme factory consume `presetOptions` and `palettePresets`.

## Verification

Executed checks:

- `npm test`
- `npm run build`
- `go test ./...`

Manual checks to run in desktop app:

- Open profile menu -> Appearance.
- Toggle `Light`, `Dark`, `System` and verify instant UI update.
- In `System`, switch OS appearance and confirm app follows.
- Change accent preset and verify AppBar, drawer selection, and primary UI accents update.
- Scroll long DataGrid pages in both themes and verify bold + sticky headers remain correct.
