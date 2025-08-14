import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Avatar,
  ActionIcon,
  Menu,
  Grid,
  Loader,
  Center,
} from '@mantine/core'
import {
  IconUser,
  IconPhone,
  IconCar,
  IconClock,
  IconDots,
  IconCheck,
  IconX,
  IconArrowRight,
  IconEye,
  IconNote,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'
import type { QueueVisit } from '../../stores/queueStore'

interface AssignedCustomersListProps {
  visits: QueueVisit[]
  loading: boolean
  onCustomerClick: (visitId: string) => void
  onStatusUpdate: (visitId: string, status: string) => Promise<void>
}

const statusColors = {
  new: 'blue',
  contacted: 'yellow',
  assigned: 'green',
  in_progress: 'orange',
  completed: 'gray',
  lost: 'red',
} as const

export function AssignedCustomersList({
  visits,
  loading,
  onCustomerClick,
  onStatusUpdate
}: AssignedCustomersListProps) {
  const { t } = useTranslation()

  const handleStatusChange = async (visitId: string, newStatus: string) => {
    try {
      await onStatusUpdate(visitId, newStatus)
      
      notifications.show({
        title: 'Status Updated',
        message: `Visit status changed to ${newStatus}`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update status',
        color: 'red',
        icon: <IconX size={16} />,
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getWaitTime = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000)
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`
    }
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`
  }

  const getPriorityColor = (visit: QueueVisit) => {
    const waitTime = Math.floor((new Date().getTime() - new Date(visit.created_at).getTime()) / 60000)
    
    if (waitTime > 120) return 'red' // Over 2 hours
    if (waitTime > 60) return 'orange' // Over 1 hour
    if (visit.status === 'in_progress') return 'blue'
    return 'gray'
  }

  if (loading) {
    return (
      <Center h="300px">
        <Loader size="lg" />
      </Center>
    )
  }

  if (visits.length === 0) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Center>
          <Stack align="center" gap="sm">
            <IconUser size={48} color="gray" />
            <Text ta="center" c="dimmed">
              No customers assigned to you yet
            </Text>
          </Stack>
        </Center>
      </Card>
    )
  }

  return (
    <Grid>
      {visits.map((visit) => (
        <Grid.Col key={visit.id} span={{ base: 12, md: 6, lg: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
            <Stack gap="sm" h="100%">
              {/* Header */}
              <Group justify="space-between" align="flex-start">
                <Group>
                  <Avatar 
                    color={getPriorityColor(visit)} 
                    radius="xl"
                    size="md"
                  >
                    <IconUser size={20} />
                  </Avatar>
                  <div>
                    <Text fw={600} size="sm" lineClamp={1}>
                      {visit.customer.name}
                    </Text>
                    <Group gap="xs">
                      <IconPhone size={12} />
                      <Text size="xs" c="dimmed" dir="ltr">
                        {visit.customer.phone}
                      </Text>
                    </Group>
                  </div>
                </Group>
                
                <Menu shadow="md" width={180}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="sm">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item 
                      onClick={() => onCustomerClick(visit.id)}
                      leftSection={<IconEye size={14} />}
                    >
                      View Details
                    </Menu.Item>
                    
                    <Menu.Item 
                      onClick={() => handleStatusChange(visit.id, 'in_progress')}
                      leftSection={<IconArrowRight size={14} />}
                      disabled={visit.status === 'in_progress'}
                    >
                      Start Service
                    </Menu.Item>
                    
                    <Menu.Item 
                      onClick={() => handleStatusChange(visit.id, 'completed')}
                      leftSection={<IconCheck size={14} />}
                      disabled={visit.status === 'completed'}
                    >
                      Mark Complete
                    </Menu.Item>
                    
                    <Menu.Item 
                      onClick={() => handleStatusChange(visit.id, 'lost')}
                      leftSection={<IconX size={14} />}
                      color="red"
                      disabled={visit.status === 'lost' || visit.status === 'completed'}
                    >
                      Mark Lost
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              {/* Status Badge */}
              <Group>
                <Badge 
                  color={statusColors[visit.status]} 
                  variant="light" 
                  size="sm"
                >
                  {visit.status.toUpperCase()}
                </Badge>
                <Badge 
                  color={getPriorityColor(visit)} 
                  variant="outline" 
                  size="xs"
                >
                  {getWaitTime(visit.created_at)}
                </Badge>
              </Group>

              {/* Vehicle Interest */}
              {visit.vehicle_interest && (
                <Group gap="xs">
                  <IconCar size={14} color="gray" />
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {typeof visit.vehicle_interest === 'object' 
                      ? `${visit.vehicle_interest.type} - ${visit.vehicle_interest.budget_range}`
                      : visit.vehicle_interest
                    }
                  </Text>
                </Group>
              )}

              {/* Time Info */}
              <Group gap="xs">
                <IconClock size={14} color="gray" />
                <Text size="xs" c="dimmed">
                  Arrived: {formatTime(visit.created_at)}
                </Text>
              </Group>

              {/* Notes Preview */}
              {visit.notes && (
                <Group gap="xs" align="flex-start">
                  <IconNote size={14} color="gray" style={{ marginTop: 2 }} />
                  <Text size="xs" c="dimmed" lineClamp={2} style={{ flex: 1 }}>
                    {visit.notes}
                  </Text>
                </Group>
              )}

              {/* Action Buttons */}
              <Group gap="xs" mt="auto">
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => onCustomerClick(visit.id)}
                  leftSection={<IconEye size={14} />}
                  flex={1}
                >
                  Details
                </Button>
                
                {visit.status === 'assigned' && (
                  <Button
                    size="xs"
                    onClick={() => handleStatusChange(visit.id, 'in_progress')}
                    leftSection={<IconArrowRight size={14} />}
                    flex={1}
                  >
                    Start
                  </Button>
                )}
                
                {visit.status === 'in_progress' && (
                  <Button
                    size="xs"
                    color="green"
                    onClick={() => handleStatusChange(visit.id, 'completed')}
                    leftSection={<IconCheck size={14} />}
                    flex={1}
                  >
                    Complete
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  )
}