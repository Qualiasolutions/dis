import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
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
} from '@mantine/core'
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconAlertCircle,
} from '@tabler/icons-react'
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'
import type { QueueVisit } from '../../stores/queueStore'

interface VisitTrendsChartProps {
  visits: QueueVisit[]
  timeRange: string
  loading?: boolean
}

type ChartType = 'line' | 'area'
type MetricType = 'total' | 'completed' | 'conversion'

const chartTypeOptions = [
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
]

const metricOptions = [
  { value: 'total', label: 'Total Visits' },
  { value: 'completed', label: 'Completed Visits' },
  { value: 'conversion', label: 'Conversion Rate %' },
]

interface ChartDataPoint {
  date: string
  totalVisits: number
  completedVisits: number
  lostVisits: number
  conversionRate: number
  formattedDate: string
}

export function VisitTrendsChart({ visits, timeRange, loading = false }: VisitTrendsChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [metric, setMetric] = useState<MetricType>('total')

  // Generate chart data based on time range
  const chartData = useMemo(() => {
    if (visits.length === 0) return []

    const now = new Date()
    let days = 7 // default for week
    
    switch (timeRange) {
      case 'today':
        days = 1
        break
      case 'week':
        days = 7
        break
      case 'month':
        days = 30
        break
      case 'quarter':
        days = 90
        break
      case 'year':
        days = 365
        break
    }

    const startDate = startOfDay(subDays(now, days - 1))
    const endDate = endOfDay(now)

    // Create array of all dates in range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
    
    const dataPoints: ChartDataPoint[] = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayVisits = visits.filter(visit => {
        const visitDate = format(new Date(visit.created_at), 'yyyy-MM-dd')
        return visitDate === dateStr
      })

      const totalVisits = dayVisits.length
      const completedVisits = dayVisits.filter(v => v.status === 'completed').length
      const lostVisits = dayVisits.filter(v => v.status === 'lost').length
      const conversionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0

      return {
        date: dateStr,
        totalVisits,
        completedVisits,
        lostVisits,
        conversionRate,
        formattedDate: format(date, timeRange === 'today' ? 'HH:mm' : 'MMM dd'),
      }
    })

    return dataPoints
  }, [visits, timeRange])

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return null
    
    const currentValue = chartData[chartData.length - 1]?.[metric === 'total' ? 'totalVisits' : 
                                                          metric === 'completed' ? 'completedVisits' : 
                                                          'conversionRate'] || 0
    const previousValue = chartData[chartData.length - 2]?.[metric === 'total' ? 'totalVisits' : 
                                                           metric === 'completed' ? 'completedVisits' : 
                                                           'conversionRate'] || 0
    
    if (previousValue === 0) return null
    
    const change = ((currentValue - previousValue) / previousValue) * 100
    return {
      percentage: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      value: change,
    }
  }, [chartData, metric])

  const getTrendIcon = () => {
    if (!trend) return <IconMinus size={16} />
    switch (trend.direction) {
      case 'up':
        return <IconTrendingUp size={16} color="green" />
      case 'down':
        return <IconTrendingDown size={16} color="red" />
      default:
        return <IconMinus size={16} color="gray" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return 'gray'
    return trend.direction === 'up' ? 'green' : trend.direction === 'down' ? 'red' : 'gray'
  }

  const getChartColor = () => {
    switch (metric) {
      case 'total':
        return '#3b82f6' // blue
      case 'completed':
        return '#10b981' // green
      case 'conversion':
        return '#8b5cf6' // purple
      default:
        return '#3b82f6'
    }
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'conversionRate') {
      return [`${value.toFixed(1)}%`, 'Conversion Rate']
    }
    return [value, name === 'totalVisits' ? 'Total Visits' : 'Completed Visits']
  }

  const formatYAxisTick = (value: number) => {
    if (metric === 'conversion') {
      return `${value}%`
    }
    return value.toString()
  }

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ position: 'relative', height: 400 }}>
        <LoadingOverlay visible={loading} />
        <Text fw={600}>Visit Trends</Text>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Alert icon={<IconAlertCircle size="1rem" />} title="No Data" color="blue" variant="light">
          No visit data available for the selected time period.
        </Alert>
      </Card>
    )
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text fw={600} size="lg">Visit Trends</Text>
            {trend && (
              <Group gap="xs" mt="xs">
                {getTrendIcon()}
                <Text size="sm" c={getTrendColor()}>
                  {trend.percentage.toFixed(1)}% vs previous period
                </Text>
                <Badge size="sm" color={getTrendColor()} variant="light">
                  {trend.direction === 'up' ? 'Improving' : 
                   trend.direction === 'down' ? 'Declining' : 'Stable'}
                </Badge>
              </Group>
            )}
          </div>
          
          <Group>
            <Select
              data={metricOptions}
              value={metric}
              onChange={(value) => setMetric(value as MetricType)}
              w={140}
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
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ChartComponent data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={formatYAxisTick}
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
              
              {chartType === 'area' ? (
                <Area
                  type="monotone"
                  dataKey={metric === 'total' ? 'totalVisits' : 
                           metric === 'completed' ? 'completedVisits' : 'conversionRate'}
                  stroke={getChartColor()}
                  fill={getChartColor()}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey={metric === 'total' ? 'totalVisits' : 
                           metric === 'completed' ? 'completedVisits' : 'conversionRate'}
                  stroke={getChartColor()}
                  strokeWidth={2}
                  dot={{ fill: getChartColor(), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: getChartColor(), strokeWidth: 2 }}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <Group justify="space-around" mt="md">
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="blue">
              {chartData.reduce((sum, day) => sum + day.totalVisits, 0)}
            </Text>
            <Text size="sm" c="dimmed">Total Visits</Text>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="green">
              {chartData.reduce((sum, day) => sum + day.completedVisits, 0)}
            </Text>
            <Text size="sm" c="dimmed">Completed</Text>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Text size="lg" fw={700} c="purple">
              {chartData.length > 0 
                ? (chartData.reduce((sum, day) => sum + day.conversionRate, 0) / chartData.length).toFixed(1)
                : 0}%
            </Text>
            <Text size="sm" c="dimmed">Avg Conversion</Text>
          </div>
        </Group>
      </Stack>
    </Card>
  )
}