import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Container, Stack, Title, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { useAuthStore } from '../../stores/authStore'

export function AuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSignUp, setIsSignUp] = useState(false)
  const { isAuthenticated } = useAuthStore()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const from = (location.state as any)?.from || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleAuthSuccess = () => {
    const from = (location.state as any)?.from || '/'
    navigate(from, { replace: true })
  }

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={1} mb="xs">
            {t('auth.welcome')}
          </Title>
          <Text size="lg" c="dimmed">
            Dealership Intelligence System
          </Text>
        </div>

        {isSignUp ? (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onToggleLogin={() => setIsSignUp(false)}
          />
        ) : (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onToggleSignUp={() => setIsSignUp(true)}
          />
        )}
      </Stack>
    </Container>
  )
}