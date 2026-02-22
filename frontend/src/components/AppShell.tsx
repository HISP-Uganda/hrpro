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
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { canAccessAnyReportRole, isAdminRole } from '../auth/roles'

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
  const location = useRouterState({
    select: (state) => state.location.pathname,
  })

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
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            HISP HR System
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {session?.user.username ?? 'Unknown user'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session?.user.role ?? 'Unknown role'}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<LogoutOutlinedIcon />}
              onClick={onLogout}
            >
              Logout
            </Button>
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
            borderRight: '1px solid #e5ebf3',
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
                sx={{ mx: 1, borderRadius: 2 }}
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
    </Box>
  )
}
