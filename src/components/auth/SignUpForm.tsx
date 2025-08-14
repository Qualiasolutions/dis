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
  Select,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle, IconUserPlus, IconCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'
import { useAuthStore, type UserRole } from '../../stores/authStore'

interface SignUpFormProps {
  onSuccess?: () => void
  onToggleLogin?: () => void
}

export function SignUpForm({ onSuccess, onToggleLogin }: SignUpFormProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const { signUp, loading } = useAuthStore()

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'consultant' as UserRole,
    },
    validate: {
      name: (value) => {
        if (!value) return 'Name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        return null
      },
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
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password'
        if (value !== values.password) return 'Passwords do not match'
        return null
      },
    },
  })

  const roleOptions = [
    { value: 'reception', label: 'Reception Staff' },
    { value: 'consultant', label: 'Sales Consultant' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Administrator' },
  ]

  const handleSubmit = async (values: typeof form.values) => {
    setError(null)
    
    const { error } = await signUp(values.email, values.password, {
      name: values.name,
      role: values.role,
    })
    
    if (error) {
      setError(error.message || 'Sign up failed')
    } else {
      notifications.show({
        title: 'Account Created!',
        message: 'Please check your email to verify your account',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      onSuccess?.()
    }
  }

  return (
    <Paper p="xl" shadow="md" radius="md" maw={400} mx="auto">
      <Stack>
        <div>
          <Title order={2} ta="center" mb="xs">
            Create Account
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Join the dealership team
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
              label="Full Name"
              placeholder="John Doe"
              required
              {...form.getInputProps('name')}
              disabled={loading}
            />

            <TextInput
              label="Email"
              placeholder="john@dealership.com"
              required
              {...form.getInputProps('email')}
              disabled={loading}
            />

            <Select
              label="Role"
              placeholder="Select your role"
              required
              data={roleOptions}
              {...form.getInputProps('role')}
              disabled={loading}
            />

            <PasswordInput
              label="Password"
              placeholder="At least 6 characters"
              required
              {...form.getInputProps('password')}
              disabled={loading}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps('confirmPassword')}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              leftSection={<IconUserPlus size={16} />}
              size="md"
            >
              Create Account
            </Button>
          </Stack>
        </form>

        {onToggleLogin && (
          <Group justify="center" mt="md">
            <Text size="sm" c="dimmed">
              Already have an account?{' '}
              <Anchor onClick={onToggleLogin} size="sm">
                Sign in
              </Anchor>
            </Text>
          </Group>
        )}
      </Stack>
    </Paper>
  )
}