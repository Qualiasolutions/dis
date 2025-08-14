import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import {
  Card,
  Text,
  Group,
  Stack,
  Select,
  LoadingOverlay,
  Alert,
  Badge,
  Avatar,
  Table,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconTrophy,
  IconTarget,
  IconClock,
  IconUsers,
} from '@tabler/icons-react'
import type { QueueVisit } from '../../stores/queueStore'

interface ConsultantPerformanceChartProps {
  visits: QueueVisit[]
  consultants: Array<{ id: string; name: string; active: boolean }>
  timeRange: string
  loading?: boolean
}

type ChartType = 'bar' | 'radar'
type MetricType = 'conversions' | 'visits' | 'conversion_rate' | 'response_time'

const chartTypeOptions = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'radar', label: 'Radar Chart' },
]

const metricOptions = [
  { value: 'conversions', label: 'Total Conversions' },
  { value: 'visits', label: 'Total Visits' },
  { value: 'conversion_rate', label: 'Conversion Rate %' },
  { value: 'response_time', label: 'Avg Response Time (min)' },
]

interface ConsultantMetrics {
  id: string
  name: string
  totalVisits: number
  completedVisits: number
  lostVisits: number
  conversionRate: number
  avgResponseTime: number
  activeVisits: number
  performanceScore: number
}

export function ConsultantPerformanceChart({ 
  visits, 
  consultants, 
  timeRange, 
  loading = false 
}: ConsultantPerformanceChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [metric, setMetric] = useState<MetricType>('conversion_rate')

  const consultantMetrics = useMemo(() => {
    if (visits.length === 0 || consultants.length === 0) return []

    const metrics: ConsultantMetrics[] = consultants
      .filter(consultant => consultant.active)
      .map(consultant => {
        const consultantVisits = visits.filter(v => v.consultant_id === consultant.id)
        const completedVisits = consultantVisits.filter(v => v.status === 'completed')
        const lostVisits = consultantVisits.filter(v => v.status === 'lost')
        const activeVisits = consultantVisits.filter(v => 
          v.status === 'assigned' || v.status === 'in_progress'
        )

        // Calculate average response time (simulated for demo)
        const avgResponseTime = Math.random() * 30 + 5 // 5-35 minutes

        const conversionRate = consultantVisits.length > 0 
          ? (completedVisits.length / consultantVisits.length) * 100 
          : 0

        // Performance score combines multiple factors
        const performanceScore = Math.min(100, 
          (conversionRate * 0.4) + 
          (Math.min(consultantVisits.length / 10, 1) * 30) + // Volume factor
          (Math.max(0, 100 - avgResponseTime * 2) * 0.3) // Response time factor
        )

        return {
          id: consultant.id,
          name: consultant.name,
          totalVisits: consultantVisits.length,
          completedVisits: completedVisits.length,
          lostVisits: lostVisits.length,
          conversionRate,
          avgResponseTime,
          activeVisits: activeVisits.length,
          performanceScore,
        }
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)

    return metrics
  }, [visits, consultants])

  const chartData = useMemo(() => {
    return consultantMetrics.map(consultant => ({
      name: consultant.name.split(' ')[0], // First name only for chart
      fullName: consultant.name,
      conversions: consultant.completedVisits,
      visits: consultant.totalVisits,
      conversion_rate: consultant.conversionRate,
      response_time: consultant.avgResponseTime,
      performance: consultant.performanceScore,
    }))
  }, [consultantMetrics])

  const radarData = useMemo(() => {
    if (consultantMetrics.length === 0) return []
    
    return consultantMetrics.slice(0, 5).map(consultant => ({
      consultant: consultant.name.split(' ')[0],
      'Conversion Rate': consultant.conversionRate,
      'Volume Score': Math.min(100, (consultant.totalVisits / Math.max(...consultantMetrics.map(c => c.totalVisits))) * 100),
      'Response Speed': Math.max(0, 100 - (consultant.avgResponseTime / 60) * 100),
      'Active Pipeline': Math.min(100, (consultant.activeVisits / 5) * 100),
      'Overall Score': consultant.performanceScore,
    }))
  }, [consultantMetrics])

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ position: 'relative', height: 500 }}>
        <LoadingOverlay visible={loading} />
        <Text fw={600}>Consultant Performance</Text>
      </Card>
    )
  }

  if (consultantMetrics.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Alert icon={<IconAlertCircle size="1rem" />} title="No Data" color="blue" variant="light">
          No consultant performance data available for the selected time period.
        </Alert>
      </Card>
    )
  }

  const getMetricColor = () => {
    switch (metric) {
      case 'conversions':
        return '#10b981' // green
      case 'visits':
        return '#3b82f6' // blue
      case 'conversion_rate':
        return '#8b5cf6' // purple
      case 'response_time':
        return '#f59e0b' // orange
      default:
        return '#3b82f6'
    }
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'conversion_rate') {
      return [`${value.toFixed(1)}%`, 'Conversion Rate']
    }
    if (name === 'response_time') {
      return [`${value.toFixed(1)} min`, 'Avg Response Time']
    }
    return [value, name]
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text fw={600} size="lg">Consultant Performance Comparison</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Performance metrics for active consultants in {timeRange}
            </Text>
          </div>
          
          <Group>
            <Select
              data={metricOptions}
              value={metric}
              onChange={(value) => setMetric(value as MetricType)}
              w={180}
              size="sm"
            />
            <Select
              data={chartTypeOptions}
              value={chartType}
              onChange={(value) => setChartType(value as ChartType)}
              w={120}
              size="sm"
            />
          </Group>
        </Group>

        {/* Chart */}
        <div className="mobile-scroll-container">
          <div style={{ width: '100%', minWidth: '500px', height: 400 }}>
            <ResponsiveContainer>
            {chartType === 'radar' ? (
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="consultant" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10 }}
                />
                {radarData.length > 0 && Object.keys(radarData[0])
                  .filter(key => key !== 'consultant')
                  .slice(0, 3) // Show top 3 consultants
                  .map((key, index) => (
                    <Radar
                      key={key}
                      dataKey={key}
                      stroke={['#3b82f6', '#10b981', '#8b5cf6'][index]}
                      fill={['#3b82f6', '#10b981', '#8b5cf6'][index]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}`, '']}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
              </RadarChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <Tooltip
                  formatter={formatTooltipValue}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar
                  dataKey={metric}
                  fill={getMetricColor()}
                  radius={[4, 4, 0, 0]}
                  name={metricOptions.find(opt => opt.value === metric)?.label}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Table */}
        <Card shadow="xs" padding="md" radius="md" withBorder bg="gray.0">
          <Text fw={600} mb="md">🏆 Top Performers</Text>
          
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rank</Table.Th>
                <Table.Th>Consultant</Table.Th>
                <Table.Th ta="center">Visits</Table.Th>
                <Table.Th ta="center">Conversions</Table.Th>
                <Table.Th ta="center">Rate</Table.Th>
                <Table.Th ta="center">Performance</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {consultantMetrics.slice(0, 5).map((consultant, index) => (
                <Table.Tr key={consultant.id}>
                  <Table.Td>
                    <Group gap="xs">
                      {index === 0 && <IconTrophy size={16} color="gold" />}
                      <Badge size="sm" variant="light" color={index === 0 ? 'yellow' : 'gray'}>
                        #{index + 1}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" color="blue">
                        {consultant.name.charAt(0)}
                      </Avatar>
                      <Text size="sm" fw={500}>{consultant.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap="xs" justify="center">
                      <IconUsers size={14} />
                      <Text size="sm">{consultant.totalVisits}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap="xs" justify="center">
                      <IconTarget size={14} />
                      <Text size="sm" fw={600}>{consultant.completedVisits}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      color={consultant.conversionRate >= 70 ? 'green' : consultant.conversionRate >= 50 ? 'yellow' : 'red'}
                      variant="light"
                    >
                      {consultant.conversionRate.toFixed(1)}%
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap="xs" justify="center">
                      <Text size="sm" fw={600} c="purple">
                        {consultant.performanceScore.toFixed(0)}
                      </Text>
                      <Text size="xs" c="dimmed">/100</Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>

        {/* Performance Insights */}
        <Group justify="space-around">
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="blue">
              {consultantMetrics.length}
            </Text>
            <Text size="sm" c="dimmed">Active Consultants</Text>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="green">
              {consultantMetrics.length > 0 
                ? (consultantMetrics.reduce((sum, c) => sum + c.conversionRate, 0) / consultantMetrics.length).toFixed(1)
                : 0}%
            </Text>
            <Text size="sm" c="dimmed">Avg Conversion Rate</Text>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="orange">
              {consultantMetrics.length > 0 
                ? consultantMetrics.reduce((sum, c) => sum + c.avgResponseTime, 0) / consultantMetrics.length
                : 0
              } min
            </Text>
            <Text size="sm" c="dimmed">Avg Response Time</Text>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="purple">
              {consultantMetrics.reduce((sum, c) => sum + c.completedVisits, 0)}
            </Text>
            <Text size="sm" c="dimmed">Total Conversions</Text>
          </div>
        </Group>
      </Stack>
    </Card>
  )
}