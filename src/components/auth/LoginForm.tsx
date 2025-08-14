import { useState } from 'react'
import {
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Group,
  Text,
  Anchor,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconLogin, IconUser } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../../stores/authStore'

interface LoginFormProps {
  onSuccess?: () => void
  onToggleSignUp?: () => void
}

export function LoginForm({ onSuccess, onToggleSignUp }: LoginFormProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const { signIn, loading } = useAuthStore()

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required'
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format'
        return null
      },
      password: (value) => {
        if (!value) return 'Password is required'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return null
      },
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setError(null)
    
    const { error } = await signIn(values.email, values.password)
    
    if (error) {
      setError(error.message || 'Login failed')
    } else {
      notifications.show({
        title: 'Welcome!',
        message: 'Successfully logged in',
        color: 'green',
        icon: <IconUser size={16} />,
      })
      onSuccess?.()
    }
  }

  return (
    <Paper p="xl" shadow="md" radius="md" maw={400} mx="auto">
      <Stack>
        <div>
          <Title order={2} ta="center" mb="xs">
            {t('auth.login')}
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            {t('auth.login_description')}
          </Text>
        </div>

        {error && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            color="red" 
            variant="light"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="consultant@dealership.com"
              required
              {...form.getInputProps('email')}
              disabled={loading}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              leftSection={<IconLogin size={16} />}
              size="md"
            >
              {t('auth.sign_in')}
            </Button>
          </Stack>
        </form>

        {onToggleSignUp && (
          <Group justify="center" mt="md">
            <Text size="sm" c="dimmed">
              Don't have an account?{' '}
              <Anchor onClick={onToggleSignUp} size="sm">
                Sign up
              </Anchor>
            </Text>
          </Group>
        )}
      </Stack>
    </Paper>
  )
}