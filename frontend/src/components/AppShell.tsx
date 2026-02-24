import { useEffect, useMemo, useState } from 'react'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
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
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { canAccessAnyReportRole, isAdminRole } from '../auth/roles'
import { useCompanyProfile } from '../company/useCompanyProfile'
import { presetOptions } from '../theme/palettePresets'
import { useThemeSettings } from '../theme/ThemeProvider'

const DRAWER_WIDTH_EXPANDED = 260
const DRAWER_WIDTH_COLLAPSED = 72
export const SHELL_DRAWER_COLLAPSED_STORAGE_KEY = 'hr.shell.drawerCollapsed'

export function readStoredDrawerCollapsed(storage: Pick<Storage, 'getItem'> = window.localStorage): boolean {
  const storedValue = storage.getItem(SHELL_DRAWER_COLLAPSED_STORAGE_KEY)
  if (storedValue === 'true' || storedValue === '1') {
    return true
  }
  if (storedValue === 'false' || storedValue === '0') {
    return false
  }
  return false
}

function persistDrawerCollapsed(collapsed: boolean, storage: Pick<Storage, 'setItem'> = window.localStorage) {
  storage.setItem(SHELL_DRAWER_COLLAPSED_STORAGE_KEY, collapsed ? 'true' : 'false')
}

export const appShellNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon, adminOnly: false },
  { to: '/employees', label: 'Employees', icon: GroupsOutlinedIcon, adminOnly: false },
  { to: '/departments', label: 'Departments', icon: ApartmentOutlinedIcon, adminOnly: false },
  { to: '/leave', label: 'Leave', icon: EventNoteOutlinedIcon, adminOnly: false },
  { to: '/attendance', label: 'Attendance', icon: TodayOutlinedIcon, adminOnly: false },
  { to: '/payroll', label: 'Payroll', icon: PaymentsOutlinedIcon, adminOnly: false },
  { to: '/reports', label: 'Reports', icon: AssessmentOutlinedIcon, adminOnly: false, requiresReportAccess: true },
  { to: '/users', label: 'Users', icon: PeopleOutlineOutlinedIcon, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: SettingsOutlinedIcon, adminOnly: true },
  { to: '/audit', label: 'Audit Logs', icon: FactCheckOutlinedIcon, adminOnly: true },
]

const APP_VERSION = 'v0.0.0'
const APP_BUILD = 'desktop'

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const { mode, preset, setMode, setPreset } = useThemeSettings()
  const location = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => readStoredDrawerCollapsed())
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const session = router.options.context.auth.getSnapshot()
  const companyProfileQuery = useCompanyProfile()
  const companyName = companyProfileQuery.data?.companyName ?? ''
  const companyDisplayName = companyName || 'HR System'
  const appBarBrandTitle = companyName ? `${companyName} HR System` : 'HR System'
  const companyLogoDataUrl = companyProfileQuery.data?.logoDataUrl ?? null
  const supportEmail = companyProfileQuery.data?.supportEmail ?? ''
  const supportPhone = companyProfileQuery.data?.supportPhone ?? ''
  const supportWebsite = companyProfileQuery.data?.supportWebsite ?? ''
  const configuredCopyrightHolder = companyProfileQuery.data?.copyrightHolder ?? ''
  const copyrightHolder = configuredCopyrightHolder || companyDisplayName || 'HR System'
  const currentYear = new Date().getFullYear()
  const supportParts = [supportEmail, supportPhone, supportWebsite].filter((part) => part.trim() !== '')
  const supportLabel = supportParts.length > 0 ? `Support: ${supportParts.join(' | ')}` : ''
  const visibleItems = appShellNavItems.filter((item) => {
    if (item.adminOnly && !isAdminRole(session?.user.role)) {
      return false
    }
    if (item.requiresReportAccess && !canAccessAnyReportRole(session?.user.role)) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (!isDesktop) {
      setMobileDrawerOpen(false)
    }
  }, [isDesktop])

  const desktopDrawerWidth = desktopCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED

  const drawerTransition = useMemo(
    () =>
      theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.standard,
      }),
    [theme],
  )

  const toggleNavigation = () => {
    if (isDesktop) {
      setDesktopCollapsed((previous) => {
        const next = !previous
        persistDrawerCollapsed(next)
        return next
      })
      return
    }
    setMobileDrawerOpen((previous) => !previous)
  }

  const closeMobileDrawer = () => setMobileDrawerOpen(false)

  const onLogout = async () => {
    const refreshToken = session?.refreshToken
    try {
      if (refreshToken) {
        await router.options.context.api.logout(refreshToken)
      }
    } finally {
      router.options.context.auth.clear()
      router.options.context.queryClient.clear()
    }
    await navigate({ to: '/login' })
  }

  const navigationList = (isMiniDesktop: boolean, closeOnClick: boolean) => (
    <List sx={{ px: isMiniDesktop ? 0.5 : 1 }}>
      {visibleItems.map((item) => {
        const Icon = item.icon
        const selected = location === item.to || location.startsWith(`${item.to}/`)
        const navItem = (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={selected}
            onClick={() => {
              if (closeOnClick) {
                closeMobileDrawer()
              }
            }}
            sx={{
              minHeight: 46,
              px: isMiniDesktop ? 1 : 2,
              borderRadius: 2,
              justifyContent: isMiniDesktop ? 'center' : 'initial',
              borderLeft: '3px solid transparent',
              '&.Mui-selected': {
                borderLeftColor: 'primary.main',
                bgcolor: 'action.selected',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: isMiniDesktop ? 0 : 40,
                justifyContent: 'center',
                mr: isMiniDesktop ? 0 : 1,
              }}
            >
              <Icon />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                opacity: isMiniDesktop ? 0 : 1,
                maxWidth: isMiniDesktop ? 0 : 220,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: theme.transitions.create(['opacity', 'max-width'], {
                  duration: theme.transitions.duration.shorter,
                }),
              }}
            />
          </ListItemButton>
        )

        if (!isMiniDesktop) {
          return navItem
        }

        return (
          <Tooltip key={item.to} title={item.label} placement="right">
            {navItem}
          </Tooltip>
        )
      })}
    </List>
  )

  const brandHeader = (isMiniDesktop: boolean) => (
    <Toolbar
      sx={{
        px: isMiniDesktop ? 1 : 2,
        py: 1,
        justifyContent: isMiniDesktop ? 'center' : 'flex-start',
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: companyLogoDataUrl ? 'transparent' : 'primary.main',
            color: 'primary.contrastText',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {companyLogoDataUrl ? (
            <Box component="img" src={companyLogoDataUrl} alt="Company logo" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Typography
              data-testid="app-shell-brand-placeholder"
              variant="subtitle2"
              sx={{ fontWeight: 700, textTransform: 'uppercase' }}
            >
              {companyDisplayName.slice(0, 1)}
            </Typography>
          )}
        </Box>
        {!isMiniDesktop ? (
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {companyDisplayName}
          </Typography>
        ) : null}
      </Stack>
    </Toolbar>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden' }}>
      <AppBar
        position="fixed"
        color="primary"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: {
            md: `calc(100% - ${desktopDrawerWidth}px)`,
          },
          ml: {
            md: `${desktopDrawerWidth}px`,
          },
          transition: drawerTransition,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton color="inherit" edge="start" onClick={toggleNavigation} aria-label="Open navigation menu">
              <MenuOutlinedIcon />
            </IconButton>
            <Typography data-testid="app-shell-brand-title" variant="h6" color="inherit" sx={{ fontWeight: 700 }}>
              {appBarBrandTitle}
            </Typography>
          </Stack>
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
          display: { xs: 'none', md: 'block' },
          width: desktopDrawerWidth,
          flexShrink: 0,
          transition: drawerTransition,
          '& .MuiDrawer-paper': {
            width: desktopDrawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: drawerTransition,
          },
        }}
      >
        {brandHeader(desktopCollapsed)}
        {navigationList(desktopCollapsed, false)}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={closeMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH_EXPANDED,
            boxSizing: 'border-box',
          },
        }}
      >
        {brandHeader(false)}
        {navigationList(false, true)}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Typography variant="h4" sx={{ mb: 3 }}>
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
        <Stack
          data-testid="app-shell-footer"
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={1}
          sx={{
            mt: 4,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography data-testid="app-shell-footer-left" variant="body2" color="text.secondary">
            {`© ${currentYear} ${copyrightHolder}`}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
            {supportLabel ? (
              <Typography data-testid="app-shell-footer-support" variant="body2" color="text.secondary">
                {supportLabel}
              </Typography>
            ) : null}
            <Typography data-testid="app-shell-footer-build" variant="body2" color="text.secondary">
              {`${APP_VERSION} (${APP_BUILD})`}
            </Typography>
          </Stack>
        </Stack>
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
