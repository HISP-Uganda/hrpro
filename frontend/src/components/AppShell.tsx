import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined'
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

const drawerWidth = 260

export const appShellNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { to: '/employees', label: 'Employees', icon: GroupsOutlinedIcon },
  { to: '/departments', label: 'Departments', icon: ApartmentOutlinedIcon },
  { to: '/leave', label: 'Leave', icon: EventNoteOutlinedIcon },
  { to: '/payroll', label: 'Payroll', icon: PaymentsOutlinedIcon },
  { to: '/users', label: 'Users', icon: PeopleOutlineOutlinedIcon },
]

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useRouterState({
    select: (state) => state.location.pathname,
  })

  const session = router.options.context.auth.getSnapshot()

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
          {appShellNavItems.map((item) => {
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
