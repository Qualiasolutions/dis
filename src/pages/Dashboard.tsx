import React, { useState } from 'react'
import {
  AppShell,
  Container,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Tabs,
  Box,
  ActionIcon,
  Tooltip,
  Alert,
  Button
} from '@mantine/core'
import {
  IconDashboard,
  IconBrain,
  IconChartLine,
  IconUsers,
  IconRefresh,
  IconAlertTriangle,
  IconTrendingUp
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { ModernNavigation } from '../components/common/ModernNavigation'
import { LanguageToggle } from '../components/common/LanguageToggle'
import { PWAUpdater } from '../components/common/PWAUpdater'
import { useQueueStore } from '../stores/queueStore'
import { VisitTrendsChart, ConversionFunnelChart, ConsultantPerformanceChart, VehicleInterestChart } from '../components/charts'
import { PriorityDashboard, AIPerformanceMetrics } from '../components/ai'
import { useVisits } from '../hooks/useVisits'
import { useConsultants } from '../hooks/useConsultants'

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [activeTab, setActiveTab] = useState('overview')
  
  const { visits, isLoading: visitsLoading, error: visitsError, refetch: refetchVisits } = useVisits()
  const { consultants, isLoading: consultantsLoading } = useConsultants()
  const { queue } = useQueueStore()

  // Calculate summary metrics
  const totalVisits = visits?.length || 0
  const activeVisits = visits?.filter(v => ['new', 'contacted', 'scheduled', 'test_drive', 'negotiating'].includes(v.status)).length || 0
  const completedVisits = visits?.filter(v => v.status === 'completed').length || 0
  const conversionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0
  
  const todayVisits = visits?.filter(v => {
    const today = new Date().toISOString().split('T')[0]
    return v.created_at.startsWith(today)
  }).length || 0

  const highPriorityCount = visits?.filter(v => (v.ai_priority_ranking || 0) >= 7).length || 0
  const aiAnalyzedCount = visits?.filter(v => v.ai_analysis && typeof v.ai_analysis === 'object').length || 0

  const handleRefresh = () => {
    refetchVisits()
  }

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 250, breakpoint: 'md' }}
      padding="md"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="xl">
              <Text fw={700} size="xl" c="blue">
                {t('app.name')}
              </Text>
              <Badge variant="light" color="blue">
                {t('dashboard.title')}
              </Badge>
            </Group>
            
            <Group gap="md">
              <Tooltip label={t('common.refresh')}>
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={handleRefresh}
                  loading={visitsLoading}
                >
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <LanguageToggle />
              <PWAUpdater />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar>
        <ModernNavigation />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between">
              <Box>
                <Text fw={700} size="xl">{t('dashboard.title')}</Text>
                <Text c="dimmed">{t('dashboard.subtitle')}</Text>
              </Box>
              <Group gap="xs">
                <Badge variant="light" color="blue">
                  {t('common.today')}: {todayVisits} {t('dashboard.visits')}
                </Badge>
                <Badge variant="light" color="orange">
                  {t('ai.analyzed')}: {aiAnalyzedCount}/{totalVisits}
                </Badge>
              </Group>
            </Group>

            {/* Error Alert */}
            {visitsError && (
              <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                {t('dashboard.error')} {visitsError.message}
              </Alert>
            )}

            {/* Summary Cards */}
            <Grid>
              <Grid.Col span={3}>
                <Card withBorder>
                  <Group justify="space-between">
                    <Box>
                      <Text size="xs" c="dimmed">{t('dashboard.totalVisits')}</Text>
                      <Text fw={700} size="xl">{totalVisits.toLocaleString()}</Text>
                      <Text size="xs" c="green">
                        {t('common.today')}: +{todayVisits}
                      </Text>
                    </Box>
                    <IconUsers size={32} color="blue" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={3}>
                <Card withBorder>
                  <Group justify="space-between">
                    <Box>
                      <Text size="xs" c="dimmed">{t('dashboard.activeVisits')}</Text>
                      <Text fw={700} size="xl" c="blue">{activeVisits}</Text>
                      <Text size="xs" c="dimmed">
                        {t('dashboard.inProgress')}
                      </Text>
                    </Box>
                    <IconTrendingUp size={32} color="orange" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={3}>
                <Card withBorder>
                  <Group justify="space-between">
                    <Box>
                      <Text size="xs" c="dimmed">{t('dashboard.conversionRate')}</Text>
                      <Text fw={700} size="xl" c="green">{conversionRate.toFixed(1)}%</Text>
                      <Text size="xs" c="dimmed">
                        {completedVisits} {t('dashboard.completed')}
                      </Text>
                    </Box>
                    <IconChartLine size={32} color="green" />
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={3}>
                <Card withBorder>
                  <Group justify="space-between">
                    <Box>
                      <Text size="xs" c="dimmed">{t('ai.highPriority')}</Text>
                      <Text fw={700} size="xl" c="red">{highPriorityCount}</Text>
                      <Text size="xs" c="dimmed">
                        {t('ai.needsAttention')}
                      </Text>
                    </Box>
                    <IconBrain size={32} color="red" />
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Tabs for Different Views */}
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="overview" leftSection={<IconDashboard size={16} />}>
                  {t('dashboard.overview')}
                </Tabs.Tab>
                <Tabs.Tab value="ai-insights" leftSection={<IconBrain size={16} />}>
                  {t('ai.insights')}
                </Tabs.Tab>
                <Tabs.Tab value="analytics" leftSection={<IconChartLine size={16} />}>
                  {t('dashboard.analytics')}
                </Tabs.Tab>
              </Tabs.List>

              {/* Overview Tab */}
              <Tabs.Panel value="overview">
                <Grid mt="md">
                  <Grid.Col span={8}>
                    <Stack gap="md">
                      {/* Visit Trends */}
                      <Card withBorder>
                        <Text fw={500} mb="md">{t('charts.visitTrends')}</Text>
                        <VisitTrendsChart />
                      </Card>

                      {/* Conversion Funnel */}
                      <Card withBorder>
                        <Text fw={500} mb="md">{t('charts.conversionFunnel')}</Text>
                        <ConversionFunnelChart />
                      </Card>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Stack gap="md">
                      {/* Vehicle Interest */}
                      <Card withBorder>
                        <Text fw={500} mb="md">{t('charts.vehicleInterest')}</Text>
                        <VehicleInterestChart dataType="type" />
                      </Card>

                      {/* Quick Stats */}
                      <Card withBorder>
                        <Text fw={500} mb="md">{t('dashboard.quickStats')}</Text>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm">{t('dashboard.avgResponseTime')}</Text>
                            <Text fw={500}>~15 {t('common.minutes')}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm">{t('dashboard.activeConsultants')}</Text>
                            <Text fw={500}>
                              {consultants?.filter(c => c.active).length || 0}
                            </Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm">{t('dashboard.avgSatisfaction')}</Text>
                            <Text fw={500} c="green">4.2/5</Text>
                          </Group>
                        </Stack>
                      </Card>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              {/* AI Insights Tab */}
              <Tabs.Panel value="ai-insights">
                <Grid mt="md">
                  <Grid.Col span={12}>
                    <PriorityDashboard />
                  </Grid.Col>
                  
                  <Grid.Col span={12}>
                    <AIPerformanceMetrics />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              {/* Analytics Tab */}
              <Tabs.Panel value="analytics">
                <Grid mt="md">
                  <Grid.Col span={6}>
                    <Card withBorder>
                      <Text fw={500} mb="md">{t('charts.consultantPerformance')}</Text>
                      <ConsultantPerformanceChart />
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Card withBorder>
                      <Text fw={500} mb="md">{t('charts.vehicleInterest')}</Text>
                      <VehicleInterestChart dataType="brand" />
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Card withBorder>
                      <Text fw={500} mb="md">{t('dashboard.detailedAnalytics')}</Text>
                      <Alert color="blue" icon={<IconChartLine size={16} />}>
                        {t('dashboard.analyticsComingSoon')}
                      </Alert>
                    </Card>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}