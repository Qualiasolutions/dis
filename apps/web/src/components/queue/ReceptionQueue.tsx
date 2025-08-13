import { useEffect, useState } from 'react'
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Select,
  ActionIcon,
  Loader,
  Alert,
  Tabs,
} from '@mantine/core'
import { 
  IconRefresh, 
  IconUsers, 
  IconClock, 
  IconUserCheck,
  IconAlertCircle,
  IconFilter
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'
import { QueueCard } from './QueueCard'
import { useQueueStore } from '../../stores/queueStore'
import { useConsultantsStore } from '../../stores/consultantsStore'

export function ReceptionQueue() {
  const { t } = useTranslation()
  const [autoAssignMode, setAutoAssignMode] = useState(false)
  
  const { 
    visits, 
    loading, 
    error, 
    fetchVisits, 
    subscribeToVisits,
    getPendingVisits,
    getActiveVisits,
    getVisitsByStatus,
    assignConsultant
  } = useQueueStore()
  
  const { 
    consultants,
    loading: consultantsLoading,
    fetchConsultants,
    getLeastBusyConsultant
  } = useConsultantsStore()

  useEffect(() => {
    // Initial data fetch
    fetchVisits()
    fetchConsultants()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToVisits()

    // Refresh consultants every 30 seconds
    const consultantsInterval = setInterval(fetchConsultants, 30000)

    return () => {
      unsubscribe()
      clearInterval(consultantsInterval)
    }
  }, [fetchVisits, fetchConsultants, subscribeToVisits])

  const handleRefresh = () => {
    fetchVisits()
    fetchConsultants()
  }

  const handleAutoAssign = async () => {
    const pendingVisits = getPendingVisits()
    const leastBusy = getLeastBusyConsultant()
    
    if (!leastBusy || pendingVisits.length === 0) {
      notifications.show({
        title: 'Auto Assignment',
        message: 'No available consultants or pending visits',
        color: 'orange',
      })
      return
    }

    try {
      // Auto-assign oldest unassigned visit
      const oldestVisit = pendingVisits.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0]

      await assignConsultant(oldestVisit.id, leastBusy.id)
      
      notifications.show({
        title: 'Auto Assignment',
        message: `${oldestVisit.customer.name} assigned to ${leastBusy.name}`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Auto Assignment Failed',
        message: 'Could not auto-assign consultant',
        color: 'red',
      })
    }
  }

  const newVisits = getVisitsByStatus('new')
  const contactedVisits = getVisitsByStatus('contacted') 
  const assignedVisits = getVisitsByStatus('assigned')
  const inProgressVisits = getVisitsByStatus('in_progress')
  const activeVisits = getActiveVisits()
  const pendingVisits = getPendingVisits()

  if (error) {
    return (
      <Container size="xl">
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Error" 
          color="red"
          variant="light"
        >
          {error}
          <Button size="xs" variant="subtle" onClick={handleRefresh} mt="xs">
            Retry
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Title order={2}>
          {t('navigation.dashboard')} - Reception Queue
        </Title>
        
        <Group>
          <Button
            leftSection={<IconUserCheck size={16} />}
            onClick={handleAutoAssign}
            variant="light"
            size="sm"
            disabled={pendingVisits.length === 0 || consultantsLoading}
          >
            Auto Assign
          </Button>
          
          <ActionIcon 
            onClick={handleRefresh}
            loading={loading}
            variant="subtle"
            size="lg"
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Statistics Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconUsers size={24} color="blue" />
              <div>
                <Text size="xl" fw={700} c="blue">
                  {pendingVisits.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Waiting
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconClock size={24} color="orange" />
              <div>
                <Text size="xl" fw={700} c="orange">
                  {activeVisits.length}
                </Text>
                <Text size="sm" c="dimmed">
                  In Service
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconUserCheck size={24} color="green" />
              <div>
                <Text size="xl" fw={700} c="green">
                  {consultants.filter(c => c.isAvailable).length}
                </Text>
                <Text size="sm" c="dimmed">
                  Available
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconUsers size={24} color="gray" />
              <div>
                <Text size="xl" fw={700}>
                  {visits.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Today
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Queue Tabs */}
      <Tabs defaultValue="pending" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="pending" leftSection={<IconClock size={16} />}>
            Pending ({pendingVisits.length})
          </Tabs.Tab>
          <Tabs.Tab value="active" leftSection={<IconUserCheck size={16} />}>
            Active ({activeVisits.length})
          </Tabs.Tab>
          <Tabs.Tab value="all" leftSection={<IconUsers size={16} />}>
            All ({visits.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pending" pt="md">
          {loading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : pendingVisits.length === 0 ? (
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Text ta="center" c="dimmed">
                No customers waiting
              </Text>
            </Card>
          ) : (
            <Grid>
              {pendingVisits.map(visit => (
                <Grid.Col key={visit.id} span={{ base: 12, md: 6, lg: 4 }}>
                  <QueueCard visit={visit} showActions={true} />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="active" pt="md">
          {loading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : activeVisits.length === 0 ? (
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Text ta="center" c="dimmed">
                No active consultations
              </Text>
            </Card>
          ) : (
            <Grid>
              {activeVisits.map(visit => (
                <Grid.Col key={visit.id} span={{ base: 12, md: 6, lg: 4 }}>
                  <QueueCard visit={visit} showActions={true} />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="all" pt="md">
          {loading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : visits.length === 0 ? (
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Text ta="center" c="dimmed">
                No visits today
              </Text>
            </Card>
          ) : (
            <Grid>
              {visits.map(visit => (
                <Grid.Col key={visit.id} span={{ base: 12, md: 6, lg: 4 }}>
                  <QueueCard visit={visit} showActions={true} />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}