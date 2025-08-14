import { useEffect, useState, useMemo } from 'react'
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Tabs,
  Select,
  Button,
  Alert,
  ActionIcon,
  Badge,
  SimpleGrid,
  Paper,
  Divider,
} from '@mantine/core'
import {
  IconChartBar,
  IconUsers,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconRefresh,
  IconDownload,
  IconFilter,
  IconAlertCircle,
  IconClock,
  IconCheck,
  IconX,
  IconEye,
  IconTarget,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useQueueStore } from '../../stores/queueStore'
import { useConsultantsStore } from '../../stores/consultantsStore'
import { DealershipMetrics } from './DealershipMetrics'
import { ConsultantPerformance } from './ConsultantPerformance'
import { SalesAnalytics } from './SalesAnalytics'
import { CustomerInsights } from './CustomerInsights'
import { VisitTrendsChart } from '../charts/VisitTrendsChart'
import { ConversionFunnelChart } from '../charts/ConversionFunnelChart'
import { ConsultantPerformanceChart } from '../charts/ConsultantPerformanceChart'
import { VehicleInterestChart } from '../charts/VehicleInterestChart'

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year'
type ViewMode = 'overview' | 'consultants' | 'sales' | 'customers' | 'charts'

const timeRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

export function AnalyticsDashboard() {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const { user, hasPermission, isManager } = useAuthStore()
  const { 
    visits, 
    loading: visitsLoading, 
    error: visitsError,
    fetchVisits, 
    subscribeToVisits 
  } = useQueueStore()
  const {
    consultants,
    loading: consultantsLoading,
    error: consultantsError,
    fetchConsultants
  } = useConsultantsStore()

  useEffect(() => {
    // Initial data fetch
    setLoading(true)
    Promise.all([
      fetchVisits(),
      fetchConsultants()
    ]).finally(() => {
      setLoading(false)
    })

    // Subscribe to real-time updates
    const unsubscribe = subscribeToVisits()
    return unsubscribe
  }, [fetchVisits, fetchConsultants, subscribeToVisits, refreshKey])

  // Calculate date range for filtering
  const getDateRange = (range: TimeRange) => {
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        const dayOfWeek = now.getDay()
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }
    
    return { startDate, endDate: now }
  }

  // Filter visits based on time range
  const filteredVisits = useMemo(() => {
    const { startDate, endDate } = getDateRange(timeRange)
    return visits.filter(visit => {
      const visitDate = new Date(visit.created_at)
      return visitDate >= startDate && visitDate <= endDate
    })
  }, [visits, timeRange])

  // Calculate high-level metrics
  const dealershipMetrics = useMemo(() => {
    const totalVisits = filteredVisits.length
    const completedVisits = filteredVisits.filter(v => v.status === 'completed').length
    const lostVisits = filteredVisits.filter(v => v.status === 'lost').length
    const activeVisits = filteredVisits.filter(v => 
      v.status === 'assigned' || v.status === 'in_progress'
    ).length

    const conversionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0
    const activeConsultants = consultants.filter(c => c.active).length
    
    // Average visits per consultant
    const avgVisitsPerConsultant = activeConsultants > 0 ? totalVisits / activeConsultants : 0
    
    // Daily averages
    const daysInRange = timeRange === 'today' ? 1 : 
                       timeRange === 'week' ? 7 :
                       timeRange === 'month' ? 30 :
                       timeRange === 'quarter' ? 90 : 365
    
    const avgDailyVisits = totalVisits / daysInRange

    return {
      totalVisits,
      completedVisits,
      lostVisits,
      activeVisits,
      conversionRate,
      activeConsultants,
      avgVisitsPerConsultant,
      avgDailyVisits,
    }
  }, [filteredVisits, consultants, timeRange])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log('Exporting analytics data...')
  }

  // Check permissions
  if (!hasPermission(['manager', 'admin'])) {
    return (
      <Container size="xl">
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Access Denied" 
          color="red"
          variant="light"
        >
          You need manager or admin permissions to access the analytics dashboard.
        </Alert>
      </Container>
    )
  }

  const isLoadingData = loading || visitsLoading || consultantsLoading
  const hasError = visitsError || consultantsError

  if (hasError) {
    return (
      <Container size="xl">
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Error Loading Data" 
          color="red"
          variant="light"
        >
          {visitsError || consultantsError}
          <Button size="xs" variant="subtle" onClick={handleRefresh} mt="xs">
            Retry
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>
            <IconChartBar size={28} style={{ marginRight: 8 }} />
            Analytics Dashboard
          </Title>
          <Text c="dimmed">
            Dealership performance analytics and insights
          </Text>
        </div>
        
        <Group>
          <Select
            data={timeRangeOptions}
            value={timeRange}
            onChange={(value) => setTimeRange(value as TimeRange)}
            w={150}
            leftSection={<IconCalendar size={16} />}
          />
          
          <ActionIcon 
            onClick={handleRefresh}
            loading={isLoadingData}
            variant="subtle"
            size="lg"
            title="Refresh Data"
          >
            <IconRefresh size={18} />
          </ActionIcon>
          
          <Button
            onClick={handleExportData}
            leftSection={<IconDownload size={16} />}
            variant="light"
          >
            Export
          </Button>
        </Group>
      </Group>

      {/* Quick Overview Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="blue">
                {dealershipMetrics.totalVisits}
              </Text>
              <Text size="sm" c="dimmed">Total Visits</Text>
              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">
                  {dealershipMetrics.avgDailyVisits.toFixed(1)}/day avg
                </Text>
              </Group>
            </div>
            <IconUsers size={24} color="blue" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="green">
                {dealershipMetrics.conversionRate.toFixed(1)}%
              </Text>
              <Text size="sm" c="dimmed">Conversion Rate</Text>
              <Group gap="xs" mt="xs">
                <Badge 
                  size="xs" 
                  color={dealershipMetrics.conversionRate >= 60 ? 'green' : 
                         dealershipMetrics.conversionRate >= 40 ? 'yellow' : 'red'}
                  variant="light"
                >
                  {dealershipMetrics.conversionRate >= 60 ? 'Excellent' : 
                   dealershipMetrics.conversionRate >= 40 ? 'Good' : 'Needs Work'}
                </Badge>
              </Group>
            </div>
            <IconTarget size={24} color="green" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="orange">
                {dealershipMetrics.activeVisits}
              </Text>
              <Text size="sm" c="dimmed">Active Now</Text>
              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">
                  {dealershipMetrics.activeConsultants} consultants
                </Text>
              </Group>
            </div>
            <IconClock size={24} color="orange" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="violet">
                {dealershipMetrics.avgVisitsPerConsultant.toFixed(1)}
              </Text>
              <Text size="sm" c="dimmed">Avg per Consultant</Text>
              <Group gap="xs" mt="xs">
                <Badge 
                  size="xs" 
                  color={dealershipMetrics.avgVisitsPerConsultant >= 8 ? 'green' : 
                         dealershipMetrics.avgVisitsPerConsultant >= 5 ? 'yellow' : 'red'}
                  variant="light"
                >
                  {dealershipMetrics.avgVisitsPerConsultant >= 8 ? 'High' : 
                   dealershipMetrics.avgVisitsPerConsultant >= 5 ? 'Normal' : 'Low'}
                </Badge>
              </Group>
            </div>
            <IconTrendingUp size={24} color="violet" />
          </Group>
        </Card>
      </SimpleGrid>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconEye size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="consultants" leftSection={<IconUsers size={16} />}>
            Consultants ({consultants.length})
          </Tabs.Tab>
          <Tabs.Tab value="sales" leftSection={<IconTrendingUp size={16} />}>
            Sales Analytics
          </Tabs.Tab>
          <Tabs.Tab value="customers" leftSection={<IconTarget size={16} />}>
            Customer Insights
          </Tabs.Tab>
          <Tabs.Tab value="charts" leftSection={<IconChartBar size={16} />}>
            Charts & Insights
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <DealershipMetrics 
            visits={filteredVisits}
            consultants={consultants}
            timeRange={timeRange}
            loading={isLoadingData}
          />
        </Tabs.Panel>

        <Tabs.Panel value="consultants" pt="md">
          <ConsultantPerformance
            visits={filteredVisits}
            consultants={consultants}
            timeRange={timeRange}
            loading={isLoadingData}
          />
        </Tabs.Panel>

        <Tabs.Panel value="sales" pt="md">
          <SalesAnalytics
            visits={filteredVisits}
            timeRange={timeRange}
            loading={isLoadingData}
          />
        </Tabs.Panel>

        <Tabs.Panel value="customers" pt="md">
          <CustomerInsights
            visits={filteredVisits}
            timeRange={timeRange}
            loading={isLoadingData}
          />
        </Tabs.Panel>

        <Tabs.Panel value="charts" pt="md">
          <Stack gap="xl">
            {/* Visit Trends and Conversion Funnel */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <VisitTrendsChart
                  visits={filteredVisits}
                  timeRange={timeRange}
                  loading={isLoadingData}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <ConversionFunnelChart
                  visits={filteredVisits}
                  timeRange={timeRange}
                  loading={isLoadingData}
                />
              </Grid.Col>
            </Grid>

            {/* Consultant Performance and Vehicle Interest */}
            <Grid>
              <Grid.Col span={{ base: 12, lg: 7 }}>
                <ConsultantPerformanceChart
                  visits={filteredVisits}
                  consultants={consultants}
                  timeRange={timeRange}
                  loading={isLoadingData}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 5 }}>
                <VehicleInterestChart
                  visits={filteredVisits}
                  timeRange={timeRange}
                  loading={isLoadingData}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}