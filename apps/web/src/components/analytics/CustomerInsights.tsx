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
  Alert,
  Table,
  RingProgress,
} from '@mantine/core'
import {
  IconUsers,
  IconClock,
  IconPhone,
  IconMail,
  IconCar,
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconTarget,
  IconUserCheck,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { QueueVisit } from '../../stores/queueStore'

interface CustomerInsightsProps {
  visits: QueueVisit[]
  timeRange: string
  loading: boolean
}

interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customersBySource: Record<string, number>
  demographicInsights: {
    avgWaitTime: number
    peakVisitHours: number[]
    communicationPreferences: Record<string, number>
    vehiclePreferences: Record<string, number>
  }
  engagementMetrics: {
    responseRate: number
    followUpSuccess: number
    avgInteractionTime: number
  }
  customerJourney: {
    inquiryToVisit: number
    visitToDecision: number
    totalCycleTime: number
  }
}

export function CustomerInsights({ visits, timeRange, loading }: CustomerInsightsProps) {
  const { t } = useTranslation()

  const customerMetrics = useMemo(() => {
    if (visits.length === 0) {
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        customersBySource: {},
        demographicInsights: {
          avgWaitTime: 0,
          peakVisitHours: [],
          communicationPreferences: {},
          vehiclePreferences: {},
        },
        engagementMetrics: {
          responseRate: 0,
          followUpSuccess: 0,
          avgInteractionTime: 0,
        },
        customerJourney: {
          inquiryToVisit: 0,
          visitToDecision: 0,
          totalCycleTime: 0,
        },
      }
    }

    // Unique customers
    const uniqueCustomers = new Set(visits.map(v => v.customer.phone))
    const totalCustomers = uniqueCustomers.size

    // Customer frequency analysis
    const customerVisitCounts = new Map<string, number>()
    visits.forEach(visit => {
      const phone = visit.customer.phone
      customerVisitCounts.set(phone, (customerVisitCounts.get(phone) || 0) + 1)
    })

    const newCustomers = Array.from(customerVisitCounts.values()).filter(count => count === 1).length
    const returningCustomers = totalCustomers - newCustomers

    // Peak visit hours
    const hourlyVisits = Array(24).fill(0)
    visits.forEach(visit => {
      const hour = new Date(visit.created_at).getHours()
      hourlyVisits[hour]++
    })
    
    const maxHourlyVisits = Math.max(...hourlyVisits)
    const peakVisitHours = hourlyVisits
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count === maxHourlyVisits && h.count > 0)
      .map(h => h.hour)

    // Communication preferences (based on provided contact info)
    const communicationPreferences: Record<string, number> = {
      'phone_only': 0,
      'phone_and_email': 0,
      'email_preferred': 0,
    }

    visits.forEach(visit => {
      const hasEmail = !!visit.customer.email
      const hasPhone = !!visit.customer.phone

      if (hasPhone && hasEmail) {
        communicationPreferences.phone_and_email++
      } else if (hasPhone) {
        communicationPreferences.phone_only++
      } else if (hasEmail) {
        communicationPreferences.email_preferred++
      }
    })

    // Vehicle preferences analysis
    const vehiclePreferences: Record<string, number> = {}
    visits.forEach(visit => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        const type = visit.vehicle_interest.type
        if (type) {
          vehiclePreferences[type] = (vehiclePreferences[type] || 0) + 1
        }
      }
    })

    // Average wait/service time
    const completedVisits = visits.filter(v => 
      v.status === 'completed' && v.updated_at && v.created_at
    )
    const avgWaitTime = completedVisits.length > 0
      ? completedVisits.reduce((acc, visit) => {
          const start = new Date(visit.created_at).getTime()
          const end = new Date(visit.updated_at!).getTime()
          return acc + (end - start)
        }, 0) / (completedVisits.length * 1000 * 60) // minutes
      : 0

    // Engagement metrics
    const respondedVisits = visits.filter(v => 
      v.status !== 'new' && v.updated_at !== v.created_at
    )
    const responseRate = visits.length > 0 ? (respondedVisits.length / visits.length) * 100 : 0

    const successfulFollowUps = visits.filter(v => 
      v.status === 'completed' || v.status === 'in_progress'
    )
    const followUpSuccess = visits.length > 0 
      ? (successfulFollowUps.length / visits.length) * 100 
      : 0

    // Average interaction time (from first contact to status change)
    const avgInteractionTime = respondedVisits.length > 0
      ? respondedVisits.reduce((acc, visit) => {
          const start = new Date(visit.created_at).getTime()
          const responded = new Date(visit.updated_at!).getTime()
          return acc + (responded - start)
        }, 0) / (respondedVisits.length * 1000 * 60) // minutes
      : 0

    // Customer journey timing
    const inquiryToVisit = avgInteractionTime // Time from inquiry to first response
    const visitToDecision = avgWaitTime // Time from visit to completion
    const totalCycleTime = inquiryToVisit + visitToDecision

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customersBySource: {}, // Could be enhanced with actual source tracking
      demographicInsights: {
        avgWaitTime,
        peakVisitHours,
        communicationPreferences,
        vehiclePreferences,
      },
      engagementMetrics: {
        responseRate,
        followUpSuccess,
        avgInteractionTime,
      },
      customerJourney: {
        inquiryToVisit,
        visitToDecision,
        totalCycleTime,
      },
    }
  }, [visits])

  if (loading) {
    return (
      <Center h="400px">
        <Loader size="lg" />
      </Center>
    )
  }

  if (visits.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="No Customer Data" color="blue" variant="light">
        No customer insights available for the selected time period.
      </Alert>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const getCustomerLoyalty = () => {
    const loyaltyRate = customerMetrics.totalCustomers > 0 
      ? (customerMetrics.returningCustomers / customerMetrics.totalCustomers) * 100 
      : 0
    return loyaltyRate
  }

  return (
    <Stack gap="lg">
      {/* Customer Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="blue">
                {customerMetrics.totalCustomers}
              </Text>
              <Text size="sm" c="dimmed">Total Customers</Text>
              <Text size="xs" c="green" mt="xs">
                {customerMetrics.newCustomers} new
              </Text>
            </div>
            <IconUsers size={24} color="blue" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="green">
                {getCustomerLoyalty().toFixed(1)}%
              </Text>
              <Text size="sm" c="dimmed">Customer Loyalty</Text>
              <Text size="xs" c="dimmed" mt="xs">
                {customerMetrics.returningCustomers} returning
              </Text>
            </div>
            <IconUserCheck size={24} color="green" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="orange">
                {customerMetrics.engagementMetrics.responseRate.toFixed(1)}%
              </Text>
              <Text size="sm" c="dimmed">Response Rate</Text>
              <Text size="xs" c="dimmed" mt="xs">
                Customer engagement
              </Text>
            </div>
            <IconPhone size={24} color="orange" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="violet">
                {formatTime(customerMetrics.customerJourney.totalCycleTime)}
              </Text>
              <Text size="sm" c="dimmed">Avg Journey Time</Text>
              <Text size="xs" c="dimmed" mt="xs">
                Inquiry to decision
              </Text>
            </div>
            <IconClock size={24} color="violet" />
          </Group>
        </Card>
      </SimpleGrid>

      {/* Customer Segmentation */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Customer Loyalty Breakdown</Text>
            
            <Center mb="md">
              <RingProgress
                size={160}
                thickness={16}
                sections={[
                  { 
                    value: (customerMetrics.newCustomers / customerMetrics.totalCustomers) * 100,
                    color: 'blue',
                    tooltip: `${customerMetrics.newCustomers} new customers`
                  },
                  { 
                    value: (customerMetrics.returningCustomers / customerMetrics.totalCustomers) * 100,
                    color: 'green',
                    tooltip: `${customerMetrics.returningCustomers} returning customers`
                  },
                ]}
                label={
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Customer Mix</Text>
                  </div>
                }
              />
            </Center>
            
            <Stack gap="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color="blue" variant="dot" size="sm" />
                  <Text size="sm">New Customers</Text>
                </Group>
                <Text size="sm" fw={600}>
                  {customerMetrics.newCustomers} ({((customerMetrics.newCustomers / customerMetrics.totalCustomers) * 100).toFixed(1)}%)
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Group gap="xs">
                  <Badge color="green" variant="dot" size="sm" />
                  <Text size="sm">Returning Customers</Text>
                </Group>
                <Text size="sm" fw={600}>
                  {customerMetrics.returningCustomers} ({((customerMetrics.returningCustomers / customerMetrics.totalCustomers) * 100).toFixed(1)}%)
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Communication Preferences</Text>
            
            <Stack gap="sm">
              {Object.entries(customerMetrics.demographicInsights.communicationPreferences)
                .sort(([, a], [, b]) => b - a)
                .map(([pref, count]) => {
                  const percentage = customerMetrics.totalCustomers > 0 
                    ? (count / visits.length) * 100 
                    : 0
                  
                  const prefLabels: Record<string, string> = {
                    'phone_only': 'Phone Only',
                    'phone_and_email': 'Phone & Email',
                    'email_preferred': 'Email Preferred'
                  }

                  return (
                    <Group key={pref} justify="space-between">
                      <Text size="sm">{prefLabels[pref] || pref}</Text>
                      <Group gap="xs">
                        <Text size="sm" fw={600}>{count}</Text>
                        <div style={{ width: 80 }}>
                          <Progress
                            value={percentage}
                            size="sm"
                            color="blue"
                          />
                        </div>
                        <Text size="xs" c="dimmed" w={40} ta="right">
                          {percentage.toFixed(1)}%
                        </Text>
                      </Group>
                    </Group>
                  )
                })}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Vehicle Preferences */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text fw={600} mb="md">🚗 Popular Vehicle Types</Text>
        
        {Object.keys(customerMetrics.demographicInsights.vehiclePreferences).length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {Object.entries(customerMetrics.demographicInsights.vehiclePreferences)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([type, count]) => {
                const percentage = (count / visits.length) * 100
                return (
                  <Card key={type} shadow="xs" padding="sm" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <IconCar size={16} />
                        <Text size="sm" fw={500}>{type}</Text>
                      </Group>
                      <Badge size="sm" variant="light">
                        {count}
                      </Badge>
                    </Group>
                    <Progress 
                      value={percentage} 
                      size="sm" 
                      color="green"
                    />
                    <Text size="xs" c="dimmed" mt="xs">
                      {percentage.toFixed(1)}% of inquiries
                    </Text>
                  </Card>
                )
              })}
          </SimpleGrid>
        ) : (
          <Text size="sm" c="dimmed">No vehicle preference data available</Text>
        )}
      </Card>

      {/* Customer Journey Metrics */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Customer Journey Timeline</Text>
            
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">Inquiry to First Response</Text>
                  <Text size="sm" fw={600}>
                    {formatTime(customerMetrics.customerJourney.inquiryToVisit)}
                  </Text>
                </Group>
                <Progress 
                  value={Math.max(0, 100 - (customerMetrics.customerJourney.inquiryToVisit / 60) * 100)}
                  color={customerMetrics.customerJourney.inquiryToVisit <= 15 ? 'green' : 
                         customerMetrics.customerJourney.inquiryToVisit <= 30 ? 'yellow' : 'red'}
                  size="sm"
                />
              </div>
              
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">Visit to Decision</Text>
                  <Text size="sm" fw={600}>
                    {formatTime(customerMetrics.customerJourney.visitToDecision)}
                  </Text>
                </Group>
                <Progress 
                  value={Math.max(0, 100 - (customerMetrics.customerJourney.visitToDecision / 180) * 100)}
                  color={customerMetrics.customerJourney.visitToDecision <= 90 ? 'green' : 
                         customerMetrics.customerJourney.visitToDecision <= 150 ? 'yellow' : 'red'}
                  size="sm"
                />
              </div>
              
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">Total Journey Time</Text>
                  <Text size="sm" fw={600} c="violet">
                    {formatTime(customerMetrics.customerJourney.totalCycleTime)}
                  </Text>
                </Group>
                <Progress 
                  value={Math.max(0, 100 - (customerMetrics.customerJourney.totalCycleTime / 300) * 100)}
                  color="violet"
                  size="sm"
                />
              </div>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Peak Visit Hours</Text>
            
            {customerMetrics.demographicInsights.peakVisitHours.length > 0 ? (
              <Stack gap="sm">
                <Text size="sm" c="dimmed" mb="sm">Highest traffic times:</Text>
                <Group gap="xs">
                  {customerMetrics.demographicInsights.peakVisitHours.map(hour => (
                    <Badge key={hour} size="lg" variant="light" color="orange">
                      {formatHour(hour)}
                    </Badge>
                  ))}
                </Group>
                <Text size="xs" c="dimmed" mt="md">
                  Consider staffing adjustments during these hours
                </Text>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">No clear peak hours identified</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Engagement Summary */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text fw={600} mb="md">Customer Engagement Summary</Text>
        
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          <div>
            <Text size="lg" fw={700} c="blue">
              {customerMetrics.engagementMetrics.responseRate.toFixed(1)}%
            </Text>
            <Text size="sm" c="dimmed">Response Rate</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Customers who received follow-up
            </Text>
          </div>
          
          <div>
            <Text size="lg" fw={700} c="green">
              {customerMetrics.engagementMetrics.followUpSuccess.toFixed(1)}%
            </Text>
            <Text size="sm" c="dimmed">Follow-up Success</Text>
            <Text size="xs" c="dimmed" mt="xs">
              Active or completed visits
            </Text>
          </div>
          
          <div>
            <Text size="lg" fw={700} c="orange">
              {formatTime(customerMetrics.engagementMetrics.avgInteractionTime)}
            </Text>
            <Text size="sm" c="dimmed">Avg Response Time</Text>
            <Text size="xs" c="dimmed" mt="xs">
              From inquiry to response
            </Text>
          </div>
        </SimpleGrid>
      </Card>
    </Stack>
  )
}