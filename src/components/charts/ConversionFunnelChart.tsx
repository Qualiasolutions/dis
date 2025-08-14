import { useMemo } from 'react'
import {
  Card,
  Text,
  Group,
  Stack,
  Progress,
  Badge,
  LoadingOverlay,
  Alert,
  Center,
} from '@mantine/core'
import {
  IconUsers,
  IconUserCheck,
  IconCar,
  IconCheck,
  IconAlertCircle,
  IconTrendingDown,
} from '@tabler/icons-react'
import type { QueueVisit } from '../../stores/queueStore'

interface ConversionFunnelChartProps {
  visits: QueueVisit[]
  timeRange: string
  loading?: boolean
}

interface FunnelStage {
  name: string
  count: number
  percentage: number
  color: string
  icon: React.ReactNode
  description: string
}

export function ConversionFunnelChart({ visits, timeRange, loading = false }: ConversionFunnelChartProps) {
  const funnelData = useMemo(() => {
    if (visits.length === 0) return []

    // Define funnel stages based on visit status
    const totalVisits = visits.length
    const assignedVisits = visits.filter(v => 
      v.status !== 'waiting' && v.status !== 'cancelled'
    ).length
    const inProgressVisits = visits.filter(v => 
      v.status === 'in_progress' || v.status === 'test_drive' || v.status === 'negotiating'
    ).length
    const testDriveVisits = visits.filter(v => 
      v.status === 'test_drive' || v.status === 'negotiating' || v.status === 'completed'
    ).length
    const completedVisits = visits.filter(v => v.status === 'completed').length

    const stages: FunnelStage[] = [
      {
        name: 'Initial Visits',
        count: totalVisits,
        percentage: 100,
        color: 'blue',
        icon: <IconUsers size={20} />,
        description: 'All customers who visited the showroom'
      },
      {
        name: 'Engaged with Consultant',
        count: assignedVisits,
        percentage: totalVisits > 0 ? (assignedVisits / totalVisits) * 100 : 0,
        color: 'cyan',
        icon: <IconUserCheck size={20} />,
        description: 'Customers assigned to consultants for discussion'
      },
      {
        name: 'Active Interest',
        count: inProgressVisits,
        percentage: totalVisits > 0 ? (inProgressVisits / totalVisits) * 100 : 0,
        color: 'yellow',
        icon: <IconCar size={20} />,
        description: 'Customers showing serious interest or in negotiation'
      },
      {
        name: 'Test Drive/Negotiation',
        count: testDriveVisits,
        percentage: totalVisits > 0 ? (testDriveVisits / totalVisits) * 100 : 0,
        color: 'orange',
        icon: <IconCar size={20} />,
        description: 'Customers who test drove or started negotiations'
      },
      {
        name: 'Converted to Sale',
        count: completedVisits,
        percentage: totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0,
        color: 'green',
        icon: <IconCheck size={20} />,
        description: 'Customers who completed purchases'
      }
    ]

    return stages
  }, [visits])

  // Calculate drop-off rates between stages
  const dropOffRates = useMemo(() => {
    if (funnelData.length < 2) return []
    
    return funnelData.slice(1).map((stage, index) => {
      const prevStage = funnelData[index]
      const dropOff = prevStage.count - stage.count
      const dropOffRate = prevStage.count > 0 ? (dropOff / prevStage.count) * 100 : 0
      
      return {
        from: prevStage.name,
        to: stage.name,
        count: dropOff,
        rate: dropOffRate
      }
    })
  }, [funnelData])

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ position: 'relative', height: 500 }}>
        <LoadingOverlay visible={loading} />
        <Text fw={600}>Conversion Funnel</Text>
      </Card>
    )
  }

  if (visits.length === 0) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Alert icon={<IconAlertCircle size="1rem" />} title="No Data" color="blue" variant="light">
          No visit data available for the selected time period.
        </Alert>
      </Card>
    )
  }

  const maxCount = Math.max(...funnelData.map(stage => stage.count))

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Text fw={600} size="lg">Conversion Funnel</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Customer journey from visit to conversion for {timeRange}
            </Text>
          </div>
          <Badge size="lg" color="green" variant="light">
            {funnelData.length > 0 ? funnelData[funnelData.length - 1].percentage.toFixed(1) : 0}% 
            Overall Conversion
          </Badge>
        </Group>

        {/* Funnel Stages */}
        <Stack gap="md">
          {funnelData.map((stage, index) => {
            const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
            const isFirstStage = index === 0
            const isLastStage = index === funnelData.length - 1
            
            return (
              <div key={stage.name}>
                <Card 
                  shadow="xs" 
                  padding="md" 
                  radius="md" 
                  withBorder
                  style={{ 
                    borderColor: isFirstStage ? '#339af0' : isLastStage ? '#51cf66' : '#ced4da',
                    borderWidth: isFirstStage || isLastStage ? 2 : 1
                  }}
                >
                  <Group justify="space-between" mb="sm">
                    <Group gap="sm">
                      <div style={{ color: `var(--mantine-color-${stage.color}-6)` }}>
                        {stage.icon}
                      </div>
                      <div>
                        <Text fw={600} size="sm">{stage.name}</Text>
                        <Text size="xs" c="dimmed">{stage.description}</Text>
                      </div>
                    </Group>
                    
                    <Group gap="md">
                      <div style={{ textAlign: 'right' }}>
                        <Text fw={700} size="lg" c={stage.color}>
                          {stage.count}
                        </Text>
                        <Text size="xs" c="dimmed">customers</Text>
                      </div>
                      <Badge size="md" color={stage.color} variant="light">
                        {stage.percentage.toFixed(1)}%
                      </Badge>
                    </Group>
                  </Group>
                  
                  {/* Visual funnel bar */}
                  <div style={{ position: 'relative', height: 8, backgroundColor: '#f1f3f4', borderRadius: 4 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${width}%`,
                        backgroundColor: `var(--mantine-color-${stage.color}-6)`,
                        borderRadius: 4,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </Card>
                
                {/* Drop-off indicator between stages */}
                {index < funnelData.length - 1 && (
                  <Center my="xs">
                    <Group gap="xs">
                      <IconTrendingDown size={16} color="red" />
                      <Text size="xs" c="red">
                        {dropOffRates[index] ? 
                          `${dropOffRates[index].count} customers (${dropOffRates[index].rate.toFixed(1)}%) dropped off` 
                          : 'No drop-off data'
                        }
                      </Text>
                    </Group>
                  </Center>
                )}
              </div>
            )
          })}
        </Stack>

        {/* Summary Statistics */}
        <Card shadow="xs" padding="md" radius="md" withBorder bg="gray.0">
          <Group justify="space-around">
            <div style={{ textAlign: 'center' }}>
              <Text size="lg" fw={700} c="blue">
                {funnelData[0]?.count || 0}
              </Text>
              <Text size="sm" c="dimmed">Total Visits</Text>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <Text size="lg" fw={700} c="green">
                {funnelData[funnelData.length - 1]?.count || 0}
              </Text>
              <Text size="sm" c="dimmed">Conversions</Text>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <Text size="lg" fw={700} c="orange">
                {dropOffRates.reduce((sum, dropOff) => sum + dropOff.count, 0)}
              </Text>
              <Text size="sm" c="dimmed">Total Drop-offs</Text>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <Text size="lg" fw={700} c="purple">
                {funnelData.length > 1 ? 
                  ((funnelData[1].count / Math.max(funnelData[0].count, 1)) * 100).toFixed(1) : 0}%
              </Text>
              <Text size="sm" c="dimmed">Engagement Rate</Text>
            </div>
          </Group>
        </Card>
      </Stack>
    </Card>
  )
}