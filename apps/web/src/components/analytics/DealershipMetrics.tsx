import { useMemo } from 'react'
import {
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Progress,
  Badge,
  SimpleGrid,
  Center,
  Loader,
  RingProgress,
  Table,
  Alert,
} from '@mantine/core'
import {
  IconUsers,
  IconClock,
  IconCheck,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { QueueVisit } from '../../stores/queueStore'

interface ConsultantWithStats {
  id: string
  name: string
  active: boolean
  activeVisitsCount: number
  totalVisitsToday: number
  isAvailable: boolean
}

interface DealershipMetricsProps {
  visits: QueueVisit[]
  consultants: ConsultantWithStats[]
  timeRange: string
  loading: boolean
}

export function DealershipMetrics({ visits, consultants, timeRange, loading }: DealershipMetricsProps) {
  const { t } = useTranslation()

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    if (visits.length === 0) {
      return {
        totalVisits: 0,
        statusBreakdown: { new: 0, assigned: 0, in_progress: 0, completed: 0, lost: 0 },
        conversionRate: 0,
        averageWaitTime: 0,
        peakHours: [],
        consultantUtilization: 0,
        customerSatisfaction: 0,
        revenueMetrics: { potential: 0, realized: 0 },
        vehicleInterests: {},
        hourlyDistribution: Array(24).fill(0),
      }
    }

    // Status breakdown
    const statusBreakdown = {
      new: visits.filter(v => v.status === 'new').length,
      assigned: visits.filter(v => v.status === 'assigned').length,
      in_progress: visits.filter(v => v.status === 'in_progress').length,
      completed: visits.filter(v => v.status === 'completed').length,
      lost: visits.filter(v => v.status === 'lost').length,
    }

    // Conversion rate
    const eligibleForConversion = visits.filter(v => v.status !== 'new')
    const conversionRate = eligibleForConversion.length > 0 
      ? (statusBreakdown.completed / eligibleForConversion.length) * 100 
      : 0

    // Average wait time (for completed visits)
    const completedVisits = visits.filter(v => 
      v.status === 'completed' && v.updated_at && v.created_at
    )
    const averageWaitTime = completedVisits.length > 0
      ? completedVisits.reduce((acc, visit) => {
          const start = new Date(visit.created_at).getTime()
          const end = new Date(visit.updated_at!).getTime()
          return acc + (end - start)
        }, 0) / (completedVisits.length * 1000 * 60) // minutes
      : 0

    // Peak hours analysis
    const hourlyDistribution = Array(24).fill(0)
    visits.forEach(visit => {
      const hour = new Date(visit.created_at).getHours()
      hourlyDistribution[hour]++
    })
    
    const maxHourlyVisits = Math.max(...hourlyDistribution)
    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count === maxHourlyVisits && h.count > 0)
      .map(h => h.hour)

    // Consultant utilization
    const activeConsultants = consultants.filter(c => c.active)
    const consultantUtilization = activeConsultants.length > 0
      ? (visits.length / (activeConsultants.length * 10)) * 100 // assuming 10 visits per consultant is 100%
      : 0

    // Vehicle interests analysis
    const vehicleInterests: Record<string, number> = {}
    visits.forEach(visit => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        const type = visit.vehicle_interest.type
        if (type) {
          vehicleInterests[type] = (vehicleInterests[type] || 0) + 1
        }
      }
    })

    return {
      totalVisits: visits.length,
      statusBreakdown,
      conversionRate,
      averageWaitTime,
      peakHours,
      consultantUtilization: Math.min(consultantUtilization, 100),
      vehicleInterests,
      hourlyDistribution,
    }
  }, [visits, consultants])

  if (loading) {
    return (
      <Center h="400px">
        <Loader size="lg" />
      </Center>
    )
  }

  if (visits.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="No Data" color="blue" variant="light">
        No visits found for the selected time period.
      </Alert>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'blue',
      assigned: 'green',
      in_progress: 'orange',
      completed: 'gray',
      lost: 'red',
    }
    return colors[status as keyof typeof colors] || 'gray'
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <Stack gap="lg">
      {/* Status Overview */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Visit Status Distribution</Text>
            
            <Stack gap="md">
              {Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                <Group key={status} justify="space-between">
                  <Group gap="xs">
                    <Badge color={getStatusColor(status)} variant="dot" size="sm" />
                    <Text size="sm" tt="capitalize">{status.replace('_', ' ')}</Text>
                  </Group>
                  <Text size="sm" fw={600}>{count}</Text>
                  <div style={{ width: 100 }}>
                    <Progress
                      value={(count / metrics.totalVisits) * 100}
                      color={getStatusColor(status)}
                      size="sm"
                    />
                  </div>
                  <Text size="xs" c="dimmed" w={40} ta="right">
                    {((count / metrics.totalVisits) * 100).toFixed(1)}%
                  </Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Conversion Overview</Text>
            
            <Center>
              <RingProgress
                size={140}
                thickness={12}
                sections={[
                  { value: metrics.conversionRate, color: metrics.conversionRate >= 60 ? 'green' : metrics.conversionRate >= 40 ? 'yellow' : 'red' },
                ]}
                label={
                  <Text size="lg" fw={700} ta="center">
                    {metrics.conversionRate.toFixed(1)}%
                  </Text>
                }
              />
            </Center>
            
            <Stack gap="xs" mt="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Completed</Text>
                <Text size="sm" fw={600}>{metrics.statusBreakdown.completed}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Lost</Text>
                <Text size="sm" fw={600}>{metrics.statusBreakdown.lost}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">In Progress</Text>
                <Text size="sm" fw={600}>
                  {metrics.statusBreakdown.assigned + metrics.statusBreakdown.in_progress}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Performance Metrics */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Average Service Time</Text>
            <IconClock size={20} color="orange" />
          </Group>
          
          <Text size="xl" fw={700} c="orange">
            {formatTime(metrics.averageWaitTime)}
          </Text>
          
          <Text size="sm" c="dimmed" mt="xs">
            {metrics.averageWaitTime <= 90 ? 'Excellent' :
             metrics.averageWaitTime <= 150 ? 'Good' : 'Needs Improvement'}
          </Text>
          
          <Progress
            value={Math.max(0, 100 - (metrics.averageWaitTime / 180) * 100)}
            color={metrics.averageWaitTime <= 90 ? 'green' : 
                   metrics.averageWaitTime <= 150 ? 'yellow' : 'red'}
            size="sm"
            mt="xs"
          />
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Consultant Utilization</Text>
            <IconUsers size={20} color="blue" />
          </Group>
          
          <Text size="xl" fw={700} c="blue">
            {metrics.consultantUtilization.toFixed(1)}%
          </Text>
          
          <Text size="sm" c="dimmed" mt="xs">
            {consultants.filter(c => c.active).length} active consultants
          </Text>
          
          <Progress
            value={metrics.consultantUtilization}
            color={metrics.consultantUtilization >= 80 ? 'green' :
                   metrics.consultantUtilization >= 60 ? 'yellow' : 'red'}
            size="sm"
            mt="xs"
          />
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Peak Hours</Text>
            <IconTrendingUp size={20} color="violet" />
          </Group>
          
          <Group gap="xs">
            {metrics.peakHours.length > 0 ? (
              metrics.peakHours.map(hour => (
                <Badge key={hour} size="lg" variant="light" color="violet">
                  {formatHour(hour)}
                </Badge>
              ))
            ) : (
              <Text size="sm" c="dimmed">No peak identified</Text>
            )}
          </Group>
          
          <Text size="sm" c="dimmed" mt="xs">
            Highest traffic times
          </Text>
        </Card>
      </SimpleGrid>

      {/* Vehicle Interest & Hourly Distribution */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Vehicle Interest Types</Text>
            
            {Object.keys(metrics.vehicleInterests).length > 0 ? (
              <Stack gap="sm">
                {Object.entries(metrics.vehicleInterests)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <Group key={type} justify="space-between">
                      <Text size="sm">{type}</Text>
                      <Group gap="xs">
                        <Text size="sm" fw={600}>{count}</Text>
                        <div style={{ width: 60 }}>
                          <Progress
                            value={(count / Math.max(...Object.values(metrics.vehicleInterests))) * 100}
                            size="sm"
                          />
                        </div>
                      </Group>
                    </Group>
                  ))
                }
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">No vehicle interest data available</Text>
            )}
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Hourly Visit Distribution</Text>
            
            <Stack gap="xs" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {metrics.hourlyDistribution
                .map((count, hour) => ({ hour, count }))
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map(({ hour, count }) => (
                  <Group key={hour} justify="space-between">
                    <Text size="sm">{formatHour(hour)}</Text>
                    <Group gap="xs">
                      <Text size="sm" fw={600}>{count}</Text>
                      <div style={{ width: 60 }}>
                        <Progress
                          value={(count / Math.max(...metrics.hourlyDistribution)) * 100}
                          size="sm"
                          color="blue"
                        />
                      </div>
                    </Group>
                  </Group>
                ))
              }
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}