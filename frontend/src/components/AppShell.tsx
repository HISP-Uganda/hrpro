import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { canAccessAnyReportRole, isAdminRole } from '../auth/roles'
import { presetOptions } from '../theme/palettePresets'
import { useThemeSettings } from '../theme/ThemeProvider'

const drawerWidth = 260

export const appShellNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon, adminOnly: false },
  { to: '/employees', label: 'Employees', icon: GroupsOutlinedIcon, adminOnly: false },
  { to: '/departments', label: 'Departments', icon: ApartmentOutlinedIcon, adminOnly: false },
  { to: '/leave', label: 'Leave', icon: EventNoteOutlinedIcon, adminOnly: false },
  { to: '/attendance', label: 'Attendance', icon: TodayOutlinedIcon, adminOnly: false },
  { to: '/payroll', label: 'Payroll', icon: PaymentsOutlinedIcon, adminOnly: false },
  { to: '/reports', label: 'Reports', icon: AssessmentOutlinedIcon, adminOnly: false, requiresReportAccess: true },
  { to: '/users', label: 'Users', icon: PeopleOutlineOutlinedIcon, adminOnly: true },
  { to: '/audit', label: 'Audit Logs', icon: FactCheckOutlinedIcon, adminOnly: true },
]

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { mode, preset, setMode, setPreset } = useThemeSettings()
  const location = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const session = router.options.context.auth.getSnapshot()
  const visibleItems = appShellNavItems.filter((item) => {
    if (item.adminOnly && !isAdminRole(session?.user.role)) {
      return false
    }
    if (item.requiresReportAccess && !canAccessAnyReportRole(session?.user.role)) {
      return false
    }
    return true
  })

  const onLogout = async () => {
    const refreshToken = session?.refreshToken
    if (refreshToken) {
      await router.options.context.api.logout(refreshToken)
    }

    router.options.context.auth.clear()
    await navigate({ to: '/login' })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="primary"
        elevation={1}
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" color="inherit" sx={{ fontWeight: 700 }}>
            HISP HR System
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="inherit">
              {session?.user.username ?? 'Unknown user'}
            </Typography>
            <Typography variant="body2" color="inherit">
              {session?.user.role ?? 'Unknown role'}
            </Typography>
            <IconButton
              color="inherit"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              aria-label="Open profile menu"
            >
              <AccountCircleOutlinedIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null)
                  setAppearanceOpen(true)
                }}
              >
                <ListItemIcon>
                  <PaletteOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Appearance
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  setMenuAnchor(null)
                  await onLogout()
                }}
              >
                <ListItemIcon>
                  <LogoutOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Navigation
          </Typography>
        </Toolbar>
        <List>
          {visibleItems.map((item) => {
            const Icon = item.icon
            const selected = location === item.to || location.startsWith(`${item.to}/`)
            return (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
                selected={selected}
                sx={{ mx: 1, borderRadius: 2, borderLeft: '3px solid transparent' }}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 4 }}>
        <Toolbar />
        <Typography variant="h4" sx={{ mb: 3 }}>
          {title}
        </Typography>
        {children}
      </Box>

      <Dialog open={appearanceOpen} onClose={() => setAppearanceOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Appearance</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Theme Mode
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, value: 'light' | 'dark' | 'system' | null) => {
                  if (value) {
                    setMode(value)
                  }
                }}
                size="small"
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
                <ToggleButton value="system">System</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Accent Preset
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {presetOptions.map((option) => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    color={preset === option.key ? 'primary' : 'default'}
                    variant={preset === option.key ? 'filled' : 'outlined'}
                    onClick={() => setPreset(option.key)}
                    sx={{
                      borderColor: option.primary,
                      '& .MuiChip-label': {
                        fontWeight: 700,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppearanceOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
import { useState } from 'react'
