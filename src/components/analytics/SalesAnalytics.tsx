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
} from '@mantine/core'
import {
  IconCurrencyDollar,
  IconTrendingUp,
  IconTarget,
  IconCar,
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { QueueVisit } from '../../stores/queueStore'

interface SalesAnalyticsProps {
  visits: QueueVisit[]
  timeRange: string
  loading: boolean
}

interface SalesMetrics {
  totalDeals: number
  lostDeals: number
  pipelineValue: number
  avgDealSize: number
  salesByType: Record<string, number>
  salesByBudget: Record<string, number>
  conversionByTimeline: Record<string, { total: number; converted: number; rate: number }>
  revenueProjection: number
  topPerformingTypes: Array<{ type: string; deals: number; rate: number }>
}

const budgetRanges = [
  '10k-15k JD',
  '15k-20k JD', 
  '20k-30k JD',
  '30k-50k JD',
  '50k+ JD'
]

export function SalesAnalytics({ visits, timeRange, loading }: SalesAnalyticsProps) {
  const { t } = useTranslation()

  const salesMetrics = useMemo(() => {
    if (visits.length === 0) {
      return {
        totalDeals: 0,
        lostDeals: 0,
        pipelineValue: 0,
        avgDealSize: 0,
        salesByType: {},
        salesByBudget: {},
        conversionByTimeline: {},
        revenueProjection: 0,
        topPerformingTypes: [],
      }
    }

    const completedVisits = visits.filter(v => v.status === 'completed')
    const lostVisits = visits.filter(v => v.status === 'lost')
    const activeVisits = visits.filter(v => 
      v.status === 'assigned' || v.status === 'in_progress'
    )

    // Extract budget values for calculation
    const getBudgetValue = (budgetRange: string): number => {
      if (!budgetRange) return 25000 // default estimate
      
      // Extract numbers from strings like "20k-30k JD"
      const matches = budgetRange.match(/(\d+)k?(?:-(\d+)k?)?\s*JD/i)
      if (!matches) return 25000
      
      const min = parseInt(matches[1]) * 1000
      const max = matches[2] ? parseInt(matches[2]) * 1000 : min * 1.5
      return (min + max) / 2 // average of range
    }

    // Sales by vehicle type
    const salesByType: Record<string, number> = {}
    const typeConversions: Record<string, { total: number; converted: number }> = {}

    visits.forEach(visit => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        const type = visit.vehicle_interest.type || 'Unknown'
        
        if (!typeConversions[type]) {
          typeConversions[type] = { total: 0, converted: 0 }
        }
        typeConversions[type].total++
        
        if (visit.status === 'completed') {
          salesByType[type] = (salesByType[type] || 0) + 1
          typeConversions[type].converted++
        }
      }
    })

    // Sales by budget range
    const salesByBudget: Record<string, number> = {}
    completedVisits.forEach(visit => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        const budget = visit.vehicle_interest.budget_range || 'Not specified'
        salesByBudget[budget] = (salesByBudget[budget] || 0) + 1
      }
    })

    // Conversion by purchase timeline
    const conversionByTimeline: Record<string, { total: number; converted: number; rate: number }> = {}
    visits.forEach(visit => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        const timeline = visit.vehicle_interest.purchase_timeline || 'not_specified'
        
        if (!conversionByTimeline[timeline]) {
          conversionByTimeline[timeline] = { total: 0, converted: 0, rate: 0 }
        }
        conversionByTimeline[timeline].total++
        
        if (visit.status === 'completed') {
          conversionByTimeline[timeline].converted++
        }
      }
    })

    // Calculate conversion rates
    Object.keys(conversionByTimeline).forEach(timeline => {
      const data = conversionByTimeline[timeline]
      data.rate = data.total > 0 ? (data.converted / data.total) * 100 : 0
    })

    // Calculate financial metrics
    const totalDeals = completedVisits.length
    const lostDeals = lostVisits.length
    
    // Estimate deal values
    const completedDealValue = completedVisits.reduce((sum, visit) => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        return sum + getBudgetValue(visit.vehicle_interest.budget_range || '')
      }
      return sum + 25000 // default value
    }, 0)

    const pipelineValue = activeVisits.reduce((sum, visit) => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        return sum + getBudgetValue(visit.vehicle_interest.budget_range || '')
      }
      return sum + 25000
    }, 0)

    const avgDealSize = totalDeals > 0 ? completedDealValue / totalDeals : 0

    // Revenue projection (based on current pipeline and historical conversion)
    const overallConversionRate = visits.length > 0 ? (totalDeals / visits.length) : 0
    const revenueProjection = pipelineValue * overallConversionRate

    // Top performing vehicle types
    const topPerformingTypes = Object.entries(typeConversions)
      .map(([type, data]) => ({
        type,
        deals: data.converted,
        rate: data.total > 0 ? (data.converted / data.total) * 100 : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)

    return {
      totalDeals,
      lostDeals,
      pipelineValue,
      avgDealSize,
      salesByType,
      salesByBudget,
      conversionByTimeline,
      revenueProjection,
      topPerformingTypes,
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
      <Alert icon={<IconAlertCircle size="1rem" />} title="No Sales Data" color="blue" variant="light">
        No sales data available for the selected time period.
      </Alert>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JO', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTimelineLabel = (timeline: string) => {
    const labels: Record<string, string> = {
      'within_week': 'Within a Week',
      'within_month': 'Within a Month',
      'within_3months': 'Within 3 Months',
      'within_6months': 'Within 6 Months',
      'not_decided': 'Not Decided',
      'not_specified': 'Not Specified'
    }
    return labels[timeline] || timeline
  }

  return (
    <Stack gap="lg">
      {/* Financial Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="green">
                {salesMetrics.totalDeals}
              </Text>
              <Text size="sm" c="dimmed">Completed Deals</Text>
              <Text size="xs" c="dimmed" mt="xs">
                {formatCurrency(salesMetrics.avgDealSize)} avg
              </Text>
            </div>
            <IconCheck size={24} color="green" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="blue">
                {formatCurrency(salesMetrics.pipelineValue)}
              </Text>
              <Text size="sm" c="dimmed">Pipeline Value</Text>
              <Text size="xs" c="dimmed" mt="xs">
                Active opportunities
              </Text>
            </div>
            <IconTarget size={24} color="blue" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="orange">
                {formatCurrency(salesMetrics.revenueProjection)}
              </Text>
              <Text size="sm" c="dimmed">Revenue Projection</Text>
              <Text size="xs" c="dimmed" mt="xs">
                Estimated from pipeline
              </Text>
            </div>
            <IconTrendingUp size={24} color="orange" />
          </Group>
        </Card>
        
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xl" fw={700} c="red">
                {salesMetrics.lostDeals}
              </Text>
              <Text size="sm" c="dimmed">Lost Deals</Text>
              <Text size="xs" c="dimmed" mt="xs">
                Opportunity for improvement
              </Text>
            </div>
            <IconX size={24} color="red" />
          </Group>
        </Card>
      </SimpleGrid>

      {/* Sales Breakdown */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Sales by Vehicle Type</Text>
            
            {Object.keys(salesMetrics.salesByType).length > 0 ? (
              <Stack gap="sm">
                {Object.entries(salesMetrics.salesByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <Group key={type} justify="space-between">
                      <Text size="sm">{type}</Text>
                      <Group gap="xs">
                        <Text size="sm" fw={600}>{count} deals</Text>
                        <div style={{ width: 80 }}>
                          <Progress
                            value={(count / Math.max(...Object.values(salesMetrics.salesByType))) * 100}
                            size="sm"
                            color="green"
                          />
                        </div>
                      </Group>
                    </Group>
                  ))
                }
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">No sales data available</Text>
            )}
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Sales by Budget Range</Text>
            
            {Object.keys(salesMetrics.salesByBudget).length > 0 ? (
              <Stack gap="sm">
                {budgetRanges
                  .filter(range => salesMetrics.salesByBudget[range])
                  .map(range => (
                    <Group key={range} justify="space-between">
                      <Text size="sm">{range}</Text>
                      <Group gap="xs">
                        <Text size="sm" fw={600}>{salesMetrics.salesByBudget[range]} deals</Text>
                        <div style={{ width: 80 }}>
                          <Progress
                            value={(salesMetrics.salesByBudget[range] / Math.max(...Object.values(salesMetrics.salesByBudget))) * 100}
                            size="sm"
                            color="blue"
                          />
                        </div>
                      </Group>
                    </Group>
                  ))
                }
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">No budget range data available</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Top Performing Types */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text fw={600} mb="md">🏆 Best Converting Vehicle Types</Text>
        
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Vehicle Type</Table.Th>
              <Table.Th ta="center">Deals Closed</Table.Th>
              <Table.Th ta="center">Conversion Rate</Table.Th>
              <Table.Th ta="center">Performance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {salesMetrics.topPerformingTypes.map((item, index) => (
              <Table.Tr key={item.type}>
                <Table.Td>
                  <Group gap="sm">
                    <Badge size="sm" variant="light" color="gold">
                      #{index + 1}
                    </Badge>
                    <IconCar size={16} />
                    <Text size="sm" fw={500}>{item.type}</Text>
                  </Group>
                </Table.Td>
                <Table.Td ta="center">
                  <Text size="sm" fw={600}>{item.deals}</Text>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge
                    color={item.rate >= 70 ? 'green' : item.rate >= 50 ? 'yellow' : 'red'}
                    variant="light"
                  >
                    {item.rate.toFixed(1)}%
                  </Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <div style={{ width: 100 }}>
                    <Progress
                      value={item.rate}
                      color={item.rate >= 70 ? 'green' : item.rate >= 50 ? 'yellow' : 'red'}
                      size="sm"
                    />
                  </div>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Conversion by Purchase Timeline */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text fw={600} mb="md">Conversion Rate by Purchase Timeline</Text>
        
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Purchase Timeline</Table.Th>
              <Table.Th ta="center">Total Inquiries</Table.Th>
              <Table.Th ta="center">Conversions</Table.Th>
              <Table.Th ta="center">Conversion Rate</Table.Th>
              <Table.Th ta="center">Performance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(salesMetrics.conversionByTimeline)
              .sort(([, a], [, b]) => b.rate - a.rate)
              .map(([timeline, data]) => (
                <Table.Tr key={timeline}>
                  <Table.Td>
                    <Group gap="sm">
                      <IconCalendar size={16} />
                      <Text size="sm">{getTimelineLabel(timeline)}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text size="sm" fw={600}>{data.total}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text size="sm" fw={600}>{data.converted}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      color={data.rate >= 60 ? 'green' : data.rate >= 40 ? 'yellow' : 'red'}
                      variant="light"
                    >
                      {data.rate.toFixed(1)}%
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    <div style={{ width: 100 }}>
                      <Progress
                        value={data.rate}
                        color={data.rate >= 60 ? 'green' : data.rate >= 40 ? 'yellow' : 'red'}
                        size="sm"
                      />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  )
}