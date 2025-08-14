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
  Tabs,
  Button,
  Paper,
  Alert,
  ActionIcon,
  Select,
} from '@mantine/core'
import {
  IconUsers,
  IconClock,
  IconCheck,
  IconTrendingUp,
  IconRefresh,
  IconFilter,
  IconUserCheck,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useQueueStore } from '../../stores/queueStore'
import { AssignedCustomersList } from './AssignedCustomersList'
import { CustomerProfileModal } from './CustomerProfileModal'
import { PerformanceMetrics } from './PerformanceMetrics'

export function ConsultantDashboard() {
  const { t } = useTranslation()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  
  const { user, getUserRole, isConsultant } = useAuthStore()
  const { 
    visits, 
    loading, 
    error, 
    fetchVisits, 
    subscribeToVisits,
    updateVisitStatus 
  } = useQueueStore()

  useEffect(() => {
    // Initial data fetch
    fetchVisits()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToVisits()

    return unsubscribe
  }, [fetchVisits, subscribeToVisits, refreshKey])

  // Filter visits for current consultant
  const myVisits = visits.filter(visit => 
    visit.consultant_id === user?.consultant_profile?.id
  )

  const filteredVisits = statusFilter === 'all' 
    ? myVisits 
    : myVisits.filter(visit => visit.status === statusFilter)

  // Calculate metrics
  const todayVisits = myVisits.filter(visit => {
    const today = new Date()
    const visitDate = new Date(visit.created_at)
    return visitDate.toDateString() === today.toDateString()
  })

  const activeVisits = myVisits.filter(visit => 
    visit.status === 'assigned' || visit.status === 'in_progress'
  )

  const completedToday = todayVisits.filter(visit => 
    visit.status === 'completed'
  ).length

  const averageTimePerVisit = todayVisits.length > 0 
    ? Math.round(((new Date().getTime() - new Date().setHours(9, 0, 0, 0)) / (1000 * 60)) / todayVisits.length)
    : 0

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleQuickStatusUpdate = async (visitId: string, newStatus: string) => {
    try {
      await updateVisitStatus(visitId, newStatus as any)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All Visits' },
    { value: 'assigned', label: 'Assigned to Me' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'lost', label: 'Lost' },
  ]

  if (!isConsultant()) {
    return (
      <Container size="xl">
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Access Denied" 
          color="red"
          variant="light"
        >
          You need consultant permissions to access this dashboard.
        </Alert>
      </Container>
    )
  }

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
        <div>
          <Title order={2}>
            Consultant Dashboard
          </Title>
          <Text c="dimmed">
            Welcome back, {user?.consultant_profile?.name || 'Consultant'}!
          </Text>
        </div>
        
        <Group>
          <Select
            placeholder="Filter by status"
            data={statusOptions}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || 'all')}
            w={180}
            leftSection={<IconFilter size={16} />}
          />
          
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

      {/* Quick Stats */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconUsers size={24} color="blue" />
              <div>
                <Text size="xl" fw={700} c="blue">
                  {todayVisits.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Today's Visits
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
                  Active Now
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconCheck size={24} color="green" />
              <div>
                <Text size="xl" fw={700} c="green">
                  {completedToday}
                </Text>
                <Text size="sm" c="dimmed">
                  Completed
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group>
              <IconTrendingUp size={24} color="violet" />
              <div>
                <Text size="xl" fw={700} c="violet">
                  {averageTimePerVisit}m
                </Text>
                <Text size="sm" c="dimmed">
                  Avg. Time
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="customers" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="customers" leftSection={<IconUserCheck size={16} />}>
            My Customers ({filteredVisits.length})
          </Tabs.Tab>
          <Tabs.Tab value="performance" leftSection={<IconTrendingUp size={16} />}>
            Performance
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="customers" pt="md">
          <AssignedCustomersList
            visits={filteredVisits}
            loading={loading}
            onCustomerClick={setSelectedCustomerId}
            onStatusUpdate={handleQuickStatusUpdate}
          />
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="md">
          <PerformanceMetrics
            consultantId={user?.consultant_profile?.id || ''}
            visits={myVisits}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Customer Profile Modal */}
      {selectedCustomerId && (
        <CustomerProfileModal
          visitId={selectedCustomerId}
          opened={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onStatusUpdate={handleQuickStatusUpdate}
        />
      )}
    </Container>
  )
}