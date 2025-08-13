import { useMemo } from 'react'
import {
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Progress,
  Badge,
  Table,
  Avatar,
  Center,
  Loader,
  Alert,
  Select,
  SimpleGrid,
} from '@mantine/core'
import {
  IconUser,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconClock,
  IconCheck,
  IconX,
  IconTarget,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { QueueVisit } from '../../stores/queueStore'

interface ConsultantWithStats {
  id: string
  name: string
  active: boolean
  activeVisitsCount: number
  totalVisitsToday: number
  isAvailable: boolean
}

interface ConsultantPerformanceProps {
  visits: QueueVisit[]
  consultants: ConsultantWithStats[]
  timeRange: string
  loading: boolean
}

interface ConsultantMetrics {
  id: string
  name: string
  active: boolean
  totalVisits: number
  completedVisits: number
  lostVisits: number
  conversionRate: number
  avgServiceTime: number
  avgResponseTime: number
  rank: number
}

type SortBy = 'visits' | 'conversion' | 'service_time' | 'response_time'

const sortOptions = [
  { value: 'visits', label: 'Total Visits' },
  { value: 'conversion', label: 'Conversion Rate' },
  { value: 'service_time', label: 'Service Time' },
  { value: 'response_time', label: 'Response Time' },
]

export function ConsultantPerformance({ 
  visits, 
  consultants, 
  timeRange, 
  loading 
}: ConsultantPerformanceProps) {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState<SortBy>('conversion')

  // Calculate metrics for each consultant
  const consultantMetrics = useMemo(() => {
    const metrics: ConsultantMetrics[] = consultants.map(consultant => {
      const consultantVisits = visits.filter(v => v.consultant_id === consultant.id)
      const completedVisits = consultantVisits.filter(v => v.status === 'completed')
      const lostVisits = consultantVisits.filter(v => v.status === 'lost')
      
      const conversionRate = consultantVisits.length > 0 
        ? (completedVisits.length / consultantVisits.length) * 100 
        : 0

      // Average service time for completed visits
      const completedWithTimes = completedVisits.filter(v => v.updated_at && v.created_at)
      const avgServiceTime = completedWithTimes.length > 0
        ? completedWithTimes.reduce((acc, visit) => {
            const start = new Date(visit.created_at).getTime()
            const end = new Date(visit.updated_at!).getTime()
            return acc + (end - start)
          }, 0) / (completedWithTimes.length * 1000 * 60) // minutes
        : 0

      // Average response time
      const visitsWithResponse = consultantVisits.filter(v => 
        v.status !== 'new' && v.updated_at && v.created_at
      )
      const avgResponseTime = visitsWithResponse.length > 0
        ? visitsWithResponse.reduce((acc, visit) => {
            const created = new Date(visit.created_at).getTime()
            const responded = new Date(visit.updated_at!).getTime()
            return acc + (responded - created)
          }, 0) / (visitsWithResponse.length * 1000 * 60) // minutes
        : 0

      return {
        id: consultant.id,
        name: consultant.name,
        active: consultant.active,
        totalVisits: consultantVisits.length,
        completedVisits: completedVisits.length,
        lostVisits: lostVisits.length,
        conversionRate,
        avgServiceTime,
        avgResponseTime,
        rank: 0, // Will be calculated after sorting
      }
    })

    // Sort and rank consultants
    const sortedMetrics = [...metrics].sort((a, b) => {
      switch (sortBy) {
        case 'visits':
          return b.totalVisits - a.totalVisits
        case 'conversion':
          return b.conversionRate - a.conversionRate
        case 'service_time':
          return a.avgServiceTime - b.avgServiceTime // Lower is better
        case 'response_time':
          return a.avgResponseTime - b.avgResponseTime // Lower is better
        default:
          return b.conversionRate - a.conversionRate
      }
    })

    // Assign ranks
    sortedMetrics.forEach((metric, index) => {
      metric.rank = index + 1
    })

    return sortedMetrics
  }, [visits, consultants, sortBy])

  // Team averages
  const teamAverages = useMemo(() => {
    const activeConsultants = consultantMetrics.filter(c => c.active)
    if (activeConsultants.length === 0) return null

    return {
      avgVisits: activeConsultants.reduce((sum, c) => sum + c.totalVisits, 0) / activeConsultants.length,
      avgConversion: activeConsultants.reduce((sum, c) => sum + c.conversionRate, 0) / activeConsultants.length,
      avgServiceTime: activeConsultants.reduce((sum, c) => sum + c.avgServiceTime, 0) / activeConsultants.length,
      avgResponseTime: activeConsultants.reduce((sum, c) => sum + c.avgResponseTime, 0) / activeConsultants.length,
    }
  }, [consultantMetrics])

  if (loading) {
    return (
      <Center h="400px">
        <Loader size="lg" />
      </Center>
    )
  }

  if (consultants.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="No Consultants" color="blue" variant="light">
        No consultant data available.
      </Alert>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const getPerformanceColor = (value: number, metric: string) => {
    switch (metric) {
      case 'conversion':
        if (value >= 70) return 'green'
        if (value >= 50) return 'yellow'
        return 'red'
      case 'service_time':
        if (value <= 90) return 'green'
        if (value <= 150) return 'yellow'
        return 'red'
      case 'response_time':
        if (value <= 15) return 'green'
        if (value <= 30) return 'yellow'
        return 'red'
      default:
        return 'blue'
    }
  }

  const getRankIcon = (rank: number, total: number) => {
    const percentile = (rank / total) * 100
    if (percentile <= 33) return <IconTrendingUp size={16} color="green" />
    if (percentile <= 66) return <IconMinus size={16} color="orange" />
    return <IconTrendingDown size={16} color="red" />
  }

  return (
    <Stack gap="lg">
      {/* Team Overview */}
      {teamAverages && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xl" fw={700} c="blue">
                  {teamAverages.avgVisits.toFixed(1)}
                </Text>
                <Text size="sm" c="dimmed">Avg Visits/Consultant</Text>
              </div>
              <IconUser size={24} color="blue" />
            </Group>
          </Card>
          
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xl" fw={700} c="green">
                  {teamAverages.avgConversion.toFixed(1)}%
                </Text>
                <Text size="sm" c="dimmed">Team Conversion</Text>
              </div>
              <IconTarget size={24} color="green" />
            </Group>
          </Card>
          
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xl" fw={700} c="orange">
                  {formatTime(teamAverages.avgServiceTime)}
                </Text>
                <Text size="sm" c="dimmed">Avg Service Time</Text>
              </div>
              <IconClock size={24} color="orange" />
            </Group>
          </Card>
          
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xl" fw={700} c="violet">
                  {formatTime(teamAverages.avgResponseTime)}
                </Text>
                <Text size="sm" c="dimmed">Avg Response Time</Text>
              </div>
              <IconClock size={24} color="violet" />
            </Group>
          </Card>
        </SimpleGrid>
      )}

      {/* Sort Controls */}
      <Group>
        <Text fw={600}>Sort by:</Text>
        <Select
          data={sortOptions}
          value={sortBy}
          onChange={(value) => setSortBy(value as SortBy)}
          w={200}
        />
      </Group>

      {/* Consultant Performance Table */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Text fw={600} mb="md">Individual Performance</Text>
        
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Consultant</Table.Th>
              <Table.Th ta="center">Rank</Table.Th>
              <Table.Th ta="center">Visits</Table.Th>
              <Table.Th ta="center">Completed</Table.Th>
              <Table.Th ta="center">Conversion</Table.Th>
              <Table.Th ta="center">Avg Service Time</Table.Th>
              <Table.Th ta="center">Avg Response Time</Table.Th>
              <Table.Th ta="center">Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {consultantMetrics.map((consultant) => (
              <Table.Tr key={consultant.id}>
                <Table.Td>
                  <Group gap="sm">
                    <Avatar size="sm" color="blue" radius="xl">
                      <IconUser size={16} />
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>{consultant.name}</Text>
                    </div>
                  </Group>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Group gap="xs" justify="center">
                    <Text size="sm" fw={600}>#{consultant.rank}</Text>
                    {getRankIcon(consultant.rank, consultantMetrics.length)}
                  </Group>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Text size="sm" fw={600}>{consultant.totalVisits}</Text>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Group gap="xs" justify="center">
                    <Text size="sm" fw={600}>{consultant.completedVisits}</Text>
                    <IconCheck size={14} color="green" />
                    <Text size="sm" c="red">{consultant.lostVisits}</Text>
                    <IconX size={14} color="red" />
                  </Group>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Group gap="xs" justify="center">
                    <Badge
                      color={getPerformanceColor(consultant.conversionRate, 'conversion')}
                      variant="light"
                      size="sm"
                    >
                      {consultant.conversionRate.toFixed(1)}%
                    </Badge>
                  </Group>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Badge
                    color={getPerformanceColor(consultant.avgServiceTime, 'service_time')}
                    variant="light"
                    size="sm"
                  >
                    {formatTime(consultant.avgServiceTime)}
                  </Badge>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Badge
                    color={getPerformanceColor(consultant.avgResponseTime, 'response_time')}
                    variant="light"
                    size="sm"
                  >
                    {formatTime(consultant.avgResponseTime)}
                  </Badge>
                </Table.Td>
                
                <Table.Td ta="center">
                  <Badge
                    color={consultant.active ? 'green' : 'gray'}
                    variant="dot"
                    size="sm"
                  >
                    {consultant.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Top Performers */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">🏆 Top Performers (Conversion Rate)</Text>
            
            <Stack gap="sm">
              {consultantMetrics
                .filter(c => c.active && c.totalVisits > 0)
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 5)
                .map((consultant, index) => (
                  <Group key={consultant.id} justify="space-between">
                    <Group gap="sm">
                      <Badge size="sm" variant="light" color="gold">
                        #{index + 1}
                      </Badge>
                      <Text size="sm" fw={500}>{consultant.name}</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" fw={600} c="green">
                        {consultant.conversionRate.toFixed(1)}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        ({consultant.completedVisits}/{consultant.totalVisits})
                      </Text>
                    </Group>
                  </Group>
                ))}
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">⚡ Fastest Response Times</Text>
            
            <Stack gap="sm">
              {consultantMetrics
                .filter(c => c.active && c.totalVisits > 0 && c.avgResponseTime > 0)
                .sort((a, b) => a.avgResponseTime - b.avgResponseTime)
                .slice(0, 5)
                .map((consultant, index) => (
                  <Group key={consultant.id} justify="space-between">
                    <Group gap="sm">
                      <Badge size="sm" variant="light" color="blue">
                        #{index + 1}
                      </Badge>
                      <Text size="sm" fw={500}>{consultant.name}</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" fw={600} c="blue">
                        {formatTime(consultant.avgResponseTime)}
                      </Text>
                    </Group>
                  </Group>
                ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}