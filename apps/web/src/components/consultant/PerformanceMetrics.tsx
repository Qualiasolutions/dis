import { useMemo } from 'react'
import {
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Progress,
  Badge,
  Select,
  SimpleGrid,
  Center,
  Alert,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconClock,
  IconUsers,
  IconCheck,
  IconX,
  IconTarget,
  IconCalendar,
  IconRefresh,
  IconInfoCircle,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { QueueVisit } from '../../stores/queueStore'

interface PerformanceMetricsProps {
  consultantId: string
  visits: QueueVisit[]
}

type TimeRange = 'today' | 'week' | 'month'

const getDateRange = (range: TimeRange) => {
  const now = new Date()
  let startDate = new Date()
  
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'month':
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      break
  }
  
  return { startDate, endDate: now }
}

export function PerformanceMetrics({ consultantId, visits }: PerformanceMetricsProps) {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<TimeRange>('today')
  
  const metrics = useMemo(() => {
    const { startDate, endDate } = getDateRange(timeRange)
    
    // Filter visits for the selected time range
    const filteredVisits = visits.filter(visit => {
      const visitDate = new Date(visit.created_at)
      return visitDate >= startDate && visitDate <= endDate
    })
    
    const totalVisits = filteredVisits.length
    const completedVisits = filteredVisits.filter(v => v.status === 'completed').length
    const lostVisits = filteredVisits.filter(v => v.status === 'lost').length
    const inProgressVisits = filteredVisits.filter(v => v.status === 'in_progress').length
    const assignedVisits = filteredVisits.filter(v => v.status === 'assigned').length
    
    // Conversion rate (completed / total non-new visits)
    const eligibleForConversion = filteredVisits.filter(v => v.status !== 'new')
    const conversionRate = eligibleForConversion.length > 0 
      ? (completedVisits / eligibleForConversion.length) * 100 
      : 0
    
    // Average service time for completed visits
    const completedWithTimes = filteredVisits.filter(v => 
      v.status === 'completed' && v.updated_at && v.created_at
    )
    
    const averageServiceTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((acc, visit) => {
          const start = new Date(visit.created_at).getTime()
          const end = new Date(visit.updated_at!).getTime()
          return acc + (end - start)
        }, 0) / completedWithTimes.length
      : 0
    
    // Average service time in minutes
    const avgServiceMinutes = Math.round(averageServiceTime / (1000 * 60))
    
    // Response time (time between visit creation and first status change)
    const visitsWithResponse = filteredVisits.filter(v => 
      v.status !== 'new' && v.updated_at && v.created_at
    )
    
    const averageResponseTime = visitsWithResponse.length > 0
      ? visitsWithResponse.reduce((acc, visit) => {
          const created = new Date(visit.created_at).getTime()
          const responded = new Date(visit.updated_at!).getTime()
          return acc + (responded - created)
        }, 0) / visitsWithResponse.length
      : 0
    
    const avgResponseMinutes = Math.round(averageResponseTime / (1000 * 60))
    
    return {
      totalVisits,
      completedVisits,
      lostVisits,
      inProgressVisits,
      assignedVisits,
      conversionRate,
      avgServiceMinutes,
      avgResponseMinutes,
    }
  }, [visits, timeRange])
  
  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
  ]
  
  const getPerformanceColor = (rate: number, type: 'conversion' | 'response') => {
    if (type === 'conversion') {
      if (rate >= 70) return 'green'
      if (rate >= 50) return 'yellow'
      return 'red'
    } else {
      if (rate <= 15) return 'green'  // Response time <= 15 mins is good
      if (rate <= 30) return 'yellow'
      return 'red'
    }
  }
  
  const getTrendIcon = (value: number, isHigherBetter: boolean = true) => {
    if (value === 0) return <IconMinus size={16} color="gray" />
    if ((value > 0 && isHigherBetter) || (value < 0 && !isHigherBetter)) {
      return <IconTrendingUp size={16} color="green" />
    }
    return <IconTrendingDown size={16} color="red" />
  }
  
  if (!consultantId) {
    return (
      <Alert icon={<IconInfoCircle size="1rem" />} title="No Data" color="blue" variant="light">
        Please select a consultant to view performance metrics.
      </Alert>
    )
  }
  
  if (metrics.totalVisits === 0) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Center>
          <Stack align="center" gap="sm">
            <IconUsers size={48} color="gray" />
            <Text ta="center" c="dimmed">
              No visits found for the selected time period
            </Text>
            <Select
              data={timeRangeOptions}
              value={timeRange}
              onChange={(value) => setTimeRange(value as TimeRange)}
              w={200}
            />
          </Stack>
        </Center>
      </Card>
    )
  }
  
  return (
    <Stack gap="md">
      {/* Header with Time Range Selector */}
      <Group justify="space-between">
        <Text size="lg" fw={600}>Performance Analytics</Text>
        <Group>
          <Select
            data={timeRangeOptions}
            value={timeRange}
            onChange={(value) => setTimeRange(value as TimeRange)}
            w={150}
            leftSection={<IconCalendar size={16} />}
          />
          <Tooltip label="Metrics update in real-time">
            <ActionIcon variant="subtle" size="sm">
              <IconInfoCircle size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      
      {/* Key Metrics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        {/* Total Visits */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="blue">
                {metrics.totalVisits}
              </Text>
              <Text size="sm" c="dimmed">Total Visits</Text>
            </div>
            <IconUsers size={24} color="blue" />
          </Group>
        </Card>
        
        {/* Conversion Rate */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Group gap="xs">
                <Text size="xl" fw={700} c={getPerformanceColor(metrics.conversionRate, 'conversion')}>
                  {metrics.conversionRate.toFixed(1)}%
                </Text>
                {getTrendIcon(metrics.conversionRate - 60)} {/* Assume 60% is baseline */}
              </Group>
              <Text size="sm" c="dimmed">Conversion Rate</Text>
            </div>
            <IconTarget size={24} color={getPerformanceColor(metrics.conversionRate, 'conversion')} />
          </Group>
          <Progress 
            value={metrics.conversionRate} 
            color={getPerformanceColor(metrics.conversionRate, 'conversion')}
            size="sm" 
            mt="xs" 
          />
        </Card>
        
        {/* Average Service Time */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Group gap="xs">
                <Text size="xl" fw={700} c="orange">
                  {metrics.avgServiceMinutes}m
                </Text>
                {getTrendIcon(45 - metrics.avgServiceMinutes)} {/* Lower is better, baseline 45min */}
              </Group>
              <Text size="sm" c="dimmed">Avg. Service Time</Text>
            </div>
            <IconClock size={24} color="orange" />
          </Group>
        </Card>
        
        {/* Response Time */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Group gap="xs">
                <Text size="xl" fw={700} c={getPerformanceColor(metrics.avgResponseMinutes, 'response')}>
                  {metrics.avgResponseMinutes}m
                </Text>
                {getTrendIcon(20 - metrics.avgResponseMinutes)} {/* Lower is better, baseline 20min */}
              </Group>
              <Text size="sm" c="dimmed">Avg. Response Time</Text>
            </div>
            <IconClock size={24} color={getPerformanceColor(metrics.avgResponseMinutes, 'response')} />
          </Group>
        </Card>
      </SimpleGrid>
      
      {/* Detailed Breakdown */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Visit Status Breakdown</Text>
            
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color="green" variant="dot" size="sm" />
                  <Text size="sm">Completed</Text>
                </Group>
                <Text size="sm" fw={600}>{metrics.completedVisits}</Text>
              </Group>
              
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color="orange" variant="dot" size="sm" />
                  <Text size="sm">In Progress</Text>
                </Group>
                <Text size="sm" fw={600}>{metrics.inProgressVisits}</Text>
              </Group>
              
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color="blue" variant="dot" size="sm" />
                  <Text size="sm">Assigned</Text>
                </Group>
                <Text size="sm" fw={600}>{metrics.assignedVisits}</Text>
              </Group>
              
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color="red" variant="dot" size="sm" />
                  <Text size="sm">Lost</Text>
                </Group>
                <Text size="sm" fw={600}>{metrics.lostVisits}</Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Performance Indicators</Text>
            
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm">Conversion Rate</Text>
                  <Text size="sm" fw={600}>{metrics.conversionRate.toFixed(1)}%</Text>
                </Group>
                <Progress 
                  value={metrics.conversionRate} 
                  color={getPerformanceColor(metrics.conversionRate, 'conversion')}
                  size="sm"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {metrics.conversionRate >= 70 ? 'Excellent' : 
                   metrics.conversionRate >= 50 ? 'Good' : 'Needs Improvement'}
                </Text>
              </div>
              
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm">Service Efficiency</Text>
                  <Text size="sm" fw={600}>{metrics.avgServiceMinutes}min</Text>
                </Group>
                <Progress 
                  value={Math.max(0, 100 - (metrics.avgServiceMinutes / 60) * 100)} 
                  color={metrics.avgServiceMinutes <= 30 ? 'green' : metrics.avgServiceMinutes <= 45 ? 'yellow' : 'red'}
                  size="sm"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {metrics.avgServiceMinutes <= 30 ? 'Very Efficient' : 
                   metrics.avgServiceMinutes <= 45 ? 'Efficient' : 'Room for Improvement'}
                </Text>
              </div>
              
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm">Response Speed</Text>
                  <Text size="sm" fw={600}>{metrics.avgResponseMinutes}min</Text>
                </Group>
                <Progress 
                  value={Math.max(0, 100 - (metrics.avgResponseMinutes / 30) * 100)}
                  color={getPerformanceColor(metrics.avgResponseMinutes, 'response')}
                  size="sm"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {metrics.avgResponseMinutes <= 15 ? 'Excellent Response' : 
                   metrics.avgResponseMinutes <= 30 ? 'Good Response' : 'Slow Response'}
                </Text>
              </div>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}