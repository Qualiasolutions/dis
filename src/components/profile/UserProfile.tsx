import React from 'react'
import { Stack, Title, Text, Paper, Group, Badge, Button, Divider } from '@mantine/core'
import { IconUser, IconMail, IconPhone, IconEdit } from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import { useTranslation } from 'react-i18next'

export function UserProfile() {
  const { t } = useTranslation()
  const { user, userRole } = useAuthStore()

  if (!user) {
    return (
      <Stack align="center" mt="xl">
        <Title order={2}>{t('profile.notLoggedIn', 'Please log in to view your profile')}</Title>
      </Stack>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red'
      case 'manager': return 'blue'
      case 'consultant': return 'green'
      case 'reception': return 'orange'
      default: return 'gray'
    }
  }

  return (
    <Stack gap="lg" maw={600} mx="auto" mt="md">
      <Title order={1}>
        {t('profile.title', 'User Profile')}
      </Title>

      <Paper withBorder p="xl" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <IconUser size={24} />
              <div>
                <Text size="lg" fw={500}>{user.name || user.email}</Text>
                <Text size="sm" c="dimmed">{user.email}</Text>
              </div>
            </Group>
            <Badge 
              color={getRoleBadgeColor(userRole)} 
              variant="light" 
              size="lg"
            >
              {userRole}
            </Badge>
          </Group>

          <Divider />

          <Stack gap="sm">
            <Group>
              <IconMail size={20} />
              <div>
                <Text size="sm" c="dimmed">Email</Text>
                <Text>{user.email}</Text>
              </div>
            </Group>

            {user.phone && (
              <Group>
                <IconPhone size={20} />
                <div>
                  <Text size="sm" c="dimmed">Phone</Text>
                  <Text>{user.phone}</Text>
                </div>
              </Group>
            )}

            <Group>
              <IconUser size={20} />
              <div>
                <Text size="sm" c="dimmed">Account Created</Text>
                <Text>{new Date(user.created_at).toLocaleDateString()}</Text>
              </div>
            </Group>
          </Stack>

          <Divider />

          <Group justify="flex-end">
            <Button 
              variant="outline" 
              leftSection={<IconEdit size={16} />}
              disabled
            >
              {t('profile.editProfile', 'Edit Profile')}
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={3} mb="md">
          {t('profile.permissions', 'Permissions & Access')}
        </Title>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text>Customer Intake</Text>
            <Badge color="green" variant="light">
              {t('profile.allowed', 'Allowed')}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text>Reception Queue</Text>
            <Badge color="green" variant="light">
              {t('profile.allowed', 'Allowed')}
            </Badge>
          </Group>
          {(userRole === 'consultant' || userRole === 'manager' || userRole === 'admin') && (
            <Group justify="space-between">
              <Text>Consultant Dashboard</Text>
              <Badge color="green" variant="light">
                {t('profile.allowed', 'Allowed')}
              </Badge>
            </Group>
          )}
          {(userRole === 'manager' || userRole === 'admin') && (
            <Group justify="space-between">
              <Text>Analytics Dashboard</Text>
              <Badge color="green" variant="light">
                {t('profile.allowed', 'Allowed')}
              </Badge>
            </Group>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}