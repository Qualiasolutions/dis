import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  SimpleGrid,
  Progress,
  Center,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCar,
  IconEngine,
  IconPalette,
  IconCurrencyDollar,
} from '@tabler/icons-react'
import type { QueueVisit } from '../../stores/queueStore'

interface VehicleInterestChartProps {
  visits: QueueVisit[]
  timeRange: string
  loading?: boolean
}

type ChartType = 'pie' | 'donut' | 'bar'
type DataType = 'type' | 'brand' | 'budget' | 'transmission'

const chartTypeOptions = [
  { value: 'donut', label: 'Donut Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'bar', label: 'Bar Chart' },
]

const dataTypeOptions = [
  { value: 'type', label: 'Vehicle Type' },
  { value: 'brand', label: 'Brand Preference' },
  { value: 'budget', label: 'Budget Range' },
  { value: 'transmission', label: 'Transmission Type' },
]

// Color palette for charts
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
]

interface DataPoint {
  name: string
  value: number
  percentage: number
  color: string
  icon?: React.ReactNode
}

export function VehicleInterestChart({ visits, timeRange, loading = false }: VehicleInterestChartProps) {
  const [chartType, setChartType] = useState<ChartType>('donut')
  const [dataType, setDataType] = useState<DataType>('type')

  const chartData = useMemo(() => {
    if (visits.length === 0) return []

    const dataMap: Record<string, number> = {}
    
    visits.forEach(visit => {
      if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
        let key = ''
        
        switch (dataType) {
          case 'type':
            key = visit.vehicle_interest.type || 'Not specified'
            break
          case 'brand':
            key = visit.vehicle_interest.brand || 'Not specified'
            break
          case 'budget':
            key = visit.vehicle_interest.budget_range || 'Not specified'
            break
          case 'transmission':
            key = visit.vehicle_interest.transmission || 'Not specified'
            break
        }
        
        dataMap[key] = (dataMap[key] || 0) + 1
      }
    })

    const total = Object.values(dataMap).reduce((sum, count) => sum + count, 0)
    
    return Object.entries(dataMap)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: COLORS[index % COLORS.length],
        icon: getIconForCategory(dataType, name)
      }))
      .sort((a, b) => b.value - a.value)
  }, [visits, dataType])

  const getIconForCategory = (category: DataType, name: string) => {
    switch (category) {
      case 'type':
        return <IconCar size={16} />
      case 'brand':
        return <IconCar size={16} />
      case 'budget':
        return <IconCurrencyDollar size={16} />
      case 'transmission':
        return <IconEngine size={16} />
      default:
        return <IconCar size={16} />
    }
  }

  const topCategories = useMemo(() => {
    return chartData.slice(0, 5)
  }, [chartData])

  const formatTooltipValue = (value: number, name: string) => {
    const percentage = chartData.find(item => item.name === name)?.percentage || 0
    return [`${value} customers (${percentage.toFixed(1)}%)`, name]
  }

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ position: 'relative', height: 500 }}>
        <LoadingOverlay visible={loading} />
        <Text fw={600}>Vehicle Interest Distribution</Text>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Alert icon={<IconAlertCircle size="1rem" />} title="No Data" color="blue" variant="light">
          No vehicle interest data available for the selected time period.
        </Alert>
      </Card>
    )
  }

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text fw={600} size="lg">Vehicle Interest Distribution</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Customer preferences breakdown for {timeRange}
            </Text>
          </div>
          
          <Group>
            <Select
              data={dataTypeOptions}
              value={dataType}
              onChange={(value) => setDataType(value as DataType)}
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

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {/* Chart */}
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              {chartType === 'bar' ? (
                <BarChart data={chartData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={chartType === 'donut' ? 100 : 120}
                    innerRadius={chartType === 'donut' ? 60 : 0}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltipValue} />
                  
                  {/* Center text for donut chart */}
                  {chartType === 'donut' && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-0.5em" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {chartData.reduce((sum, item) => sum + item.value, 0)}
                      </tspan>
                      <tspan x="50%" dy="1.2em" style={{ fontSize: '12px', fill: '#666' }}>
                        Total Customers
                      </tspan>
                    </text>
                  )}
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <Stack gap="md">
            <Card shadow="xs" padding="md" radius="md" withBorder bg="blue.0">
              <Text fw={600} mb="md">Top Preferences</Text>
              
              <Stack gap="sm">
                {topCategories.map((item, index) => (
                  <Group key={item.name} justify="space-between">
                    <Group gap="sm">
                      <Badge size="sm" variant="light" color="blue">
                        #{index + 1}
                      </Badge>
                      <div style={{ color: item.color }}>
                        {item.icon}
                      </div>
                      <Text size="sm" fw={500}>{item.name}</Text>
                    </Group>
                    
                    <Group gap="xs">
                      <Text size="sm" fw={600}>{item.value}</Text>
                      <div style={{ width: 60 }}>
                        <Progress
                          value={item.percentage}
                          size="sm"
                          color={item.color}
                        />
                      </div>
                      <Text size="xs" c="dimmed" style={{ minWidth: 40 }}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>

            {/* Summary Stats */}
            <SimpleGrid cols={2} spacing="md">
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Center>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw={700} c="blue">
                      {chartData.length}
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Different {dataTypeOptions.find(opt => opt.value === dataType)?.label}s
                    </Text>
                  </Stack>
                </Center>
              </Card>
              
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Center>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw={700} c="green">
                      {topCategories[0]?.percentage.toFixed(1) || 0}%
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      Most Popular
                    </Text>
                  </Stack>
                </Center>
              </Card>
            </SimpleGrid>

            {/* Market Insights */}
            <Card shadow="xs" padding="md" radius="md" withBorder bg="green.0">
              <Text fw={600} mb="sm">💡 Market Insights</Text>
              
              <Stack gap="xs">
                <Text size="sm">
                  <strong>{topCategories[0]?.name}</strong> is the most popular choice with{' '}
                  <strong>{topCategories[0]?.percentage.toFixed(1)}%</strong> preference
                </Text>
                
                {topCategories.length > 1 && (
                  <Text size="sm">
                    Strong secondary interest in{' '}
                    <strong>{topCategories[1]?.name}</strong> ({topCategories[1]?.percentage.toFixed(1)}%)
                  </Text>
                )}
                
                {chartData.length > 5 && (
                  <Text size="sm" c="dimmed">
                    {chartData.length - 5} other categories with lower interest levels
                  </Text>
                )}
              </Stack>
            </Card>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Card>
  )
}