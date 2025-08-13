import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Title, Text, Group, SimpleGrid } from '@mantine/core'
import { IconUserPlus, IconUsers, IconUserCheck, IconChartBar, IconCar, IconTrendingUp } from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'

export function EnhancedHomePage() {
  const { t } = useTranslation()
  const { isAuthenticated, isConsultant, isManager } = useAuthStore()

  const quickActions = [
    {
      title: t('navigation.intake', 'Customer Intake'),
      description: 'Create new customer visit records',
      icon: IconUserPlus,
      path: '/intake',
      color: 'blue',
      requiresAuth: true
    },
    {
      title: 'Reception Queue',
      description: 'View and manage customer queue',
      icon: IconUsers,
      path: '/queue',
      color: 'green',
      requiresAuth: true
    },
    {
      title: 'My Dashboard',
      description: 'Consultant performance and tasks',
      icon: IconUserCheck,
      path: '/consultant',
      color: 'purple',
      requiresAuth: true,
      roleCheck: isConsultant
    },
    {
      title: 'Analytics',
      description: 'Sales analytics and insights',
      icon: IconChartBar,
      path: '/dashboard',
      color: 'orange',
      requiresAuth: true,
      roleCheck: isManager
    }
  ]

  const stats = [
    {
      title: 'Daily Visits',
      value: '24',
      icon: IconCar,
      color: 'blue'
    },
    {
      title: 'Conversion Rate',
      value: '23%',
      icon: IconTrendingUp,
      color: 'green'
    },
    {
      title: 'Active Consultants',
      value: '8',
      icon: IconUsers,
      color: 'purple'
    }
  ]

  const visibleActions = quickActions.filter(action => {
    if (!action.requiresAuth) return true
    if (!isAuthenticated()) return false
    if (action.roleCheck && !action.roleCheck()) return false
    return true
  })

  return (
    <Stack gap="xl" mt="md">
      {/* Welcome Section */}
      <div className="text-center">
        <Title order={1} mb="md" className="text-3xl font-bold text-gray-900">
          {t('welcome.title', 'مرحباً بكم في نظام طهبوب الذكي')}
        </Title>
        <Text size="lg" c="dimmed" maw={600} mx="auto">
          {t('welcome.description', 'نظام ذكي لإدارة المعارض وتتبع العملاء باستخدام الذكاء الاصطناعي')}
        </Text>
      </div>

      {/* Stats Cards */}
      {isAuthenticated() && (
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {stats.map((stat, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      {stat.title}
                    </Text>
                    <Text size="2xl" fw={700}>
                      {stat.value}
                    </Text>
                  </div>
                  <stat.icon size={24} className="text-blue-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Quick Actions */}
      <div>
        <Title order={2} mb="lg" ta="center">
          Quick Actions
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {visibleActions.map((action, index) => (
            <Link key={index} to={action.path} style={{ textDecoration: 'none' }}>
              <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <action.icon size={24} className={`text-${action.color}-500`} />
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      </div>

      {/* Features Section */}
      <div className="mt-16">
        <Title order={2} mb="lg" ta="center">
          Key Features
        </Title>
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Intelligent customer visit analysis using OpenAI GPT-4
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text size="sm" c="dimmed">
                Automatically analyze customer behavior, predict purchase probability, 
                and generate actionable insights to boost sales performance.
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Dashboard</CardTitle>
              <CardDescription>
                Live analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text size="sm" c="dimmed">
                Monitor sales performance, conversion rates, and consultant 
                productivity with real-time updates every 30 seconds.
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jordan Market Optimized</CardTitle>
              <CardDescription>
                Built specifically for the Jordanian automotive market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text size="sm" c="dimmed">
                Arabic-first interface, Jordan phone validation, JOD currency support, 
                and cultural considerations for maximum local relevance.
              </Text>
            </CardContent>
          </Card>
        </SimpleGrid>
      </div>
    </Stack>
  )
}