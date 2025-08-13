import {
  Menu,
  Avatar,
  Group,
  Text,
  Badge,
  Divider,
  ActionIcon,
  Button,
} from '@mantine/core'
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconLogin,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../../stores/authStore'

export function UserMenu() {
  const { t } = useTranslation()
  const { user, signOut, isAuthenticated, getUserRole } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await signOut()
      notifications.show({
        title: 'Signed Out',
        message: 'You have been successfully signed out',
        color: 'blue',
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to sign out',
        color: 'red',
      })
    }
  }

  if (!isAuthenticated()) {
    return (
      <Button
        component={Link}
        to="/auth"
        variant="subtle"
        leftSection={<IconLogin size={16} />}
        size="sm"
      >
        Sign In
      </Button>
    )
  }

  const userName = user?.consultant_profile?.name || user?.email?.split('@')[0] || 'User'
  const userRole = getUserRole()

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Group style={{ cursor: 'pointer' }}>
          <Avatar size="sm" radius="xl" color="blue">
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <Text size="sm" fw={500}>
              {userName}
            </Text>
            {userRole && (
              <Badge size="xs" variant="light" color="blue">
                {userRole}
              </Badge>
            )}
          </div>
          <ActionIcon variant="subtle" size="sm">
            <IconChevronDown size={14} />
          </ActionIcon>
        </Group>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconUser size={14} />}
          component={Link}
          to="/profile"
        >
          Profile
        </Menu.Item>
        
        <Menu.Item
          leftSection={<IconSettings size={14} />}
          component={Link}
          to="/settings"
        >
          Settings
        </Menu.Item>

        <Divider />

        <Menu.Item
          leftSection={<IconLogout size={14} />}
          color="red"
          onClick={handleSignOut}
        >
          Sign Out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}