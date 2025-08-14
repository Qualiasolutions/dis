import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Select,
  Stack,
  ActionIcon,
  Menu,
  Tooltip,
  Avatar,
} from '@mantine/core'
import { 
  IconUser, 
  IconPhone, 
  IconCar, 
  IconClock,
  IconDots,
  IconCheck,
  IconX,
  IconArrowRight
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import type { QueueVisit } from '../../stores/queueStore'
import { useQueueStore } from '../../stores/queueStore'
import { useConsultantsStore } from '../../stores/consultantsStore'

interface QueueCardProps {
  visit: QueueVisit
  onAssign?: (visitId: string, consultantId: string) => void
  showActions?: boolean
}

const statusColors = {
  new: 'blue',
  contacted: 'yellow',
  assigned: 'green',
  in_progress: 'orange',
  completed: 'gray',
  lost: 'red',
} as const

export function QueueCard({ visit, onAssign, showActions = true }: QueueCardProps) {
  const { t } = useTranslation()
  const [assigningConsultant, setAssigningConsultant] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { assignConsultant, updateVisitStatus } = useQueueStore()
  const { consultants, getAvailableConsultants } = useConsultantsStore()

  const availableConsultants = getAvailableConsultants()

  const handleAssignConsultant = async () => {
    if (!assigningConsultant) return

    setLoading(true)
    try {
      await assignConsultant(visit.id, assigningConsultant)
      
      notifications.show({
        title: t('status.success'),
        message: 'Consultant assigned successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      
      setAssigningConsultant('')
      onAssign?.(visit.id, assigningConsultant)
    } catch (error) {
      notifications.show({
        title: t('status.error'),
        message: 'Failed to assign consultant',
        color: 'red',
        icon: <IconX size={16} />,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: typeof visit.status) => {
    setLoading(true)
    try {
      await updateVisitStatus(visit.id, newStatus)
      
      notifications.show({
        title: t('status.success'),
        message: `Visit status updated to ${newStatus}`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })
    } catch (error) {
      notifications.show({
        title: t('status.error'),
        message: 'Failed to update status',
        color: 'red',
        icon: <IconX size={16} />,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getWaitTime = () => {
    const now = new Date()
    const created = new Date(visit.created_at)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000)
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`
    }
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`
  }

  const consultantSelectData = availableConsultants.map(consultant => ({
    value: consultant.id,
    label: `${consultant.name} (${consultant.activeVisitsCount} active)`,
  }))

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group>
            <Avatar color="blue" radius="xl">
              <IconUser size={20} />
            </Avatar>
            <div>
              <Text fw={600} size="sm">
                {visit.customer.name}
              </Text>
              <Group gap="xs">
                <IconPhone size={14} />
                <Text size="xs" c="dimmed" dir="ltr">
                  {visit.customer.phone}
                </Text>
              </Group>
            </div>
          </Group>
          
          <Group>
            <Badge color={statusColors[visit.status]} variant="light" size="sm">
              {visit.status.toUpperCase()}
            </Badge>
            {showActions && (
              <Menu shadow="md" width={150}>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="sm">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item 
                    onClick={() => handleStatusChange('in_progress')}
                    leftSection={<IconArrowRight size={14} />}
                    disabled={visit.status === 'in_progress' || loading}
                  >
                    Start Service
                  </Menu.Item>
                  <Menu.Item 
                    onClick={() => handleStatusChange('completed')}
                    leftSection={<IconCheck size={14} />}
                    disabled={loading}
                  >
                    Complete
                  </Menu.Item>
                  <Menu.Item 
                    onClick={() => handleStatusChange('lost')}
                    leftSection={<IconX size={14} />}
                    color="red"
                    disabled={loading}
                  >
                    Mark Lost
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>

        {/* Vehicle Interest */}
        {visit.vehicle_interest && (
          <Group gap="xs">
            <IconCar size={14} color="gray" />
            <Text size="sm" c="dimmed">
              {typeof visit.vehicle_interest === 'object' 
                ? `${visit.vehicle_interest.type} - ${visit.vehicle_interest.budget_range}`
                : visit.vehicle_interest
              }
            </Text>
          </Group>
        )}

        {/* Time Info */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconClock size={14} color="gray" />
            <Text size="xs" c="dimmed">
              Arrived: {formatTime(visit.created_at)}
            </Text>
          </Group>
          <Tooltip label="Wait time">
            <Badge color="gray" variant="outline" size="xs">
              {getWaitTime()}
            </Badge>
          </Tooltip>
        </Group>

        {/* Consultant Assignment */}
        {visit.consultant ? (
          <Group gap="xs">
            <Avatar size="xs" color="green" radius="xl">
              {visit.consultant.name.charAt(0)}
            </Avatar>
            <Text size="sm" fw={500}>
              {visit.consultant.name}
            </Text>
          </Group>
        ) : showActions && visit.status !== 'lost' && visit.status !== 'completed' && (
          <Group>
            <Select
              placeholder="Assign consultant"
              data={consultantSelectData}
              value={assigningConsultant}
              onChange={(value) => setAssigningConsultant(value || '')}
              size="xs"
              flex={1}
            />
            <Button
              size="xs"
              onClick={handleAssignConsultant}
              disabled={!assigningConsultant || loading}
              loading={loading}
            >
              Assign
            </Button>
          </Group>
        )}

        {/* Notes */}
        {visit.notes && (
          <Text size="xs" c="dimmed" fs="italic">
            "{visit.notes}"
          </Text>
        )}
      </Stack>
    </Card>
  )
}