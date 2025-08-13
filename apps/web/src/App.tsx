import { Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { AppShell, Container, Title, Text, Stack, Button, Group } from '@mantine/core'
import { IconUserPlus, IconUsers, IconUserCheck } from '@tabler/icons-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'

import { useLanguageStore } from './stores/languageStore'
import { useAuthStore } from './stores/authStore'
import { LanguageToggle } from './components/common/LanguageToggle'
import { Navigation } from './components/common/Navigation'
import { UserMenu } from './components/auth/UserMenu'
import { AuthPage } from './components/auth/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { CustomerIntakeForm } from './components/forms/CustomerIntakeForm'
import { PWAUpdater } from './components/common/PWAUpdater'
import { ConnectionStatus } from './components/common/ConnectionStatus'
import { ReceptionQueue } from './components/queue/ReceptionQueue'
import { ConsultantDashboard } from './components/consultant/ConsultantDashboard'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
import { UserProfile } from './components/profile/UserProfile'
import { EnhancedHomePage } from './components/layout/EnhancedHomePage'
import { Footer } from './components/common/Footer'

function App() {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useLanguageStore()
  const { initialize } = useAuthStore()

  // Initialize auth on app start
  useEffect(() => {
    initialize()
  }, [initialize])

  // Update HTML dir attribute when language changes
  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', language)
    i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        header={{ height: 80 }}
        padding="md"
      >
        <AppShell.Header>
          <Container size="xl" h="100%" px="md">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              height: '100%',
              minHeight: '80px'
            }}>
              <Title order={2} c="blue.7">
                {language === 'ar' ? 'نظام طهبوب الذكي' : 'Tahboub DIS'}
              </Title>
              
              <Navigation />
              
              <Group>
                <LanguageToggle />
                <UserMenu />
              </Group>
            </div>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container size="xl">
            <Routes>
              <Route path="/" element={<EnhancedHomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route 
                path="/intake" 
                element={
                  <ProtectedRoute requiredRole={['reception', 'consultant', 'manager', 'admin']}>
                    <CustomerIntakeForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/queue" 
                element={
                  <ProtectedRoute requiredRole={['reception', 'consultant', 'manager', 'admin']}>
                    <ReceptionQueue />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/consultant" 
                element={
                  <ProtectedRoute requiredRole={['consultant', 'manager', 'admin']}>
                    <ConsultantDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requiredRole={['manager', 'admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute requiredRole={['reception', 'consultant', 'manager', 'admin']}>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <Footer />
          </Container>
        </AppShell.Main>
      </AppShell>
      <PWAUpdater />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

// Simple home page component
function HomePage() {
  const { t } = useTranslation()
  const { isAuthenticated, isConsultant } = useAuthStore()
  
  return (
    <Stack align="center" mt="xl" gap="xl">
      <div>
        <Title order={1} ta="center" mb="md">
          {t('welcome.title')}
        </Title>
        <Text size="lg" ta="center" c="dimmed" maw={600}>
          {t('welcome.description')}
        </Text>
      </div>
      
      <Group gap="lg">
        <Button
          component={Link}
          to="/intake"
          size="lg"
          leftSection={<IconUserPlus size={20} />}
        >
          {t('navigation.intake')}
        </Button>
        
        <Button
          component={Link}
          to="/queue"
          size="lg"
          variant="outline"
          leftSection={<IconUsers size={20} />}
        >
          Reception Queue
        </Button>
        
        {isAuthenticated() && isConsultant() && (
          <Button
            component={Link}
            to="/consultant"
            size="lg"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            leftSection={<IconUserCheck size={20} />}
          >
            My Dashboard
          </Button>
        )}
      </Group>
    </Stack>
  )
}

export default App