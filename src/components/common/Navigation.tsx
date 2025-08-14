import { Group, Button } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconHome, IconUserPlus, IconUsers, IconChartBar, IconUserCheck, IconUser } from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'

export function Navigation() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, hasPermission } = useAuthStore()

  const navItems = [
    { 
      path: '/', 
      label: t('navigation.home'), 
      icon: IconHome,
      requiresAuth: false 
    },
    { 
      path: '/intake', 
      label: t('navigation.intake'), 
      icon: IconUserPlus,
      requiresAuth: true,
      roles: ['reception', 'consultant', 'manager', 'admin'] as const
    },
    { 
      path: '/queue', 
      label: 'Queue', 
      icon: IconUsers,
      requiresAuth: true,
      roles: ['reception', 'consultant', 'manager', 'admin'] as const
    },
    { 
      path: '/consultant', 
      label: 'My Dashboard', 
      icon: IconUserCheck,
      requiresAuth: true,
      roles: ['consultant', 'manager', 'admin'] as const
    },
    { 
      path: '/dashboard', 
      label: 'Analytics', 
      icon: IconChartBar,
      requiresAuth: true,
      roles: ['manager', 'admin'] as const
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: IconUser,
      requiresAuth: true,
      roles: ['reception', 'consultant', 'manager', 'admin'] as const
    },
  ]

  const visibleItems = navItems.filter(item => {
    if (!item.requiresAuth) return true
    if (!isAuthenticated()) return false
    if (item.roles && !hasPermission(item.roles)) return false
    return true
  })

  return (
    <Group gap="xs">
      {visibleItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          variant={location.pathname === item.path ? 'filled' : 'subtle'}
          size="sm"
          leftSection={<item.icon size={16} />}
        >
          {item.label}
        </Button>
      ))}
    </Group>
  )
}