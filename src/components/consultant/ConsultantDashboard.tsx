import { useEffect, useState, useRef } from 'react'
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
  Progress,
  RingProgress,
  Timeline,
  ThemeIcon,
  Tooltip,
  NumberInput,
  TextInput,
  Modal,
  Divider,
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
  IconStar,
  IconStarFilled,
  IconPhone,
  IconMail,
  IconCar,
  IconCalendar,
  IconTarget,
  IconChartBar,
  IconBolt,
  IconFlame,
  IconSparkles,
  IconNotebook,
  IconSearch,
  IconPlus,
  IconBell,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { useQueueStore } from '../../stores/queueStore'
import { AssignedCustomersList } from './AssignedCustomersList'
import { CustomerProfileModal } from './CustomerProfileModal'
import { PerformanceMetrics } from './PerformanceMetrics'
import { AnimatedButton } from '../buttons/AnimatedButton'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRevealOnScroll, useCounterAnimation, useStaggerAnimation } from '../../hooks/useGSAPAnimation'
import { animationUtils } from '../../utils/animations'

// Quick action interface
interface QuickAction {
  icon: typeof IconPhone
  label: string
  color: string
  action: () => void
  count?: number
}

// Activity item interface
interface Activity {
  id: string
  type: 'call' | 'email' | 'visit' | 'sale' | 'followup'
  title: string
  time: string
  customer: string
  status: 'completed' | 'pending' | 'missed'
}

export function ConsultantDashboard() {
  const { t, i18n } = useTranslation()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedVisitForNotes, setSelectedVisitForNotes] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showGoals, setShowGoals] = useState(false)
  const [monthlyGoal, setMonthlyGoal] = useState(20)
  const isRTL = i18n.language === 'ar'
  
  // Refs for animations
  const dashboardRef = useRef<HTMLDivElement>(null)
  const statsRef = useStaggerAnimation(0.1, 0.6)
  const activityRef = useRevealOnScroll()
  const performanceRef = useRevealOnScroll()
  
  const { user, getUserRole, isConsultant } = useAuthStore()
  const { 
    visits, 
    loading, 
    error, 
    fetchVisits, 
    subscribeToVisits,
    updateVisitStatus 
  } = useQueueStore()

  // Animation for header
  useGSAP(() => {
    if (!dashboardRef.current) return
    
    const tl = gsap.timeline()
    
    // Animate header elements
    tl.fromTo('.dashboard-header',
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
    .fromTo('.dashboard-subtitle',
      { opacity: 0, x: isRTL ? 30 : -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
  }, { scope: dashboardRef, dependencies: [isRTL] })

  useEffect(() => {
    fetchVisits()
    const unsubscribe = subscribeToVisits()
    return () => unsubscribe()
  }, [fetchVisits, subscribeToVisits, refreshKey])

  const consultantId = user?.id
  const consultantName = user?.consultant_profile?.name || user?.email || 'Consultant'
  
  // Filter visits assigned to this consultant
  const myVisits = visits.filter(visit => visit.assigned_consultant_id === consultantId)
  
  // Apply status filter
  const filteredVisits = statusFilter === 'all' 
    ? myVisits 
    : myVisits.filter(visit => visit.status === statusFilter)
  
  // Apply search filter
  const searchedVisits = searchQuery
    ? filteredVisits.filter(visit => 
        visit.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.customer?.phone?.includes(searchQuery)
      )
    : filteredVisits

  // Calculate statistics
  const stats = {
    total: myVisits.length,
    active: myVisits.filter(v => ['new', 'contacted', 'scheduled'].includes(v.status)).length,
    completed: myVisits.filter(v => v.status === 'completed').length,
    conversion: myVisits.length > 0 
      ? Math.round((myVisits.filter(v => v.status === 'completed').length / myVisits.length) * 100)
      : 0,
    todayCount: myVisits.filter(v => {
      const visitDate = new Date(v.visit_date)
      const today = new Date()
      return visitDate.toDateString() === today.toDateString()
    }).length,
    weekCount: myVisits.filter(v => {
      const visitDate = new Date(v.visit_date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return visitDate >= weekAgo
    }).length,
  }

  // Mock recent activities
  const recentActivities: Activity[] = [
    { id: '1', type: 'call', title: 'Called Ahmad about SUV options', time: '10 minutes ago', customer: 'Ahmad Ali', status: 'completed' },
    { id: '2', type: 'visit', title: 'Test drive scheduled', time: '1 hour ago', customer: 'Sara Hassan', status: 'pending' },
    { id: '3', type: 'email', title: 'Sent financing options', time: '2 hours ago', customer: 'Mohammad Khalil', status: 'completed' },
    { id: '4', type: 'followup', title: 'Follow up required', time: '3 hours ago', customer: 'Layla Ahmad', status: 'missed' },
  ]

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      icon: IconPhone,
      label: t('common.contact'),
      color: 'blue',
      action: () => console.log('Contact'),
      count: stats.active
    },
    {
      icon: IconMail,
      label: t('form.email'),
      color: 'teal',
      action: () => console.log('Email'),
      count: 3
    },
    {
      icon: IconCalendar,
      label: t('visit.scheduled'),
      color: 'violet',
      action: () => console.log('Schedule'),
      count: 5
    },
    {
      icon: IconNotebook,
      label: t('form.notes'),
      color: 'orange',
      action: () => setShowNotesModal(true),
    },
  ]

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    
    // Animate refresh button
    const button = document.querySelector('.refresh-button')
    if (button) {
      gsap.to(button, {
        rotation: 360,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(button, { rotation: 0 })
        }
      })
    }
  }

  const handleAddNote = (visitId: string, note: string) => {
    // Add note logic here
    console.log('Adding note:', { visitId, note })
    setShowNotesModal(false)
    setSelectedVisitForNotes(null)
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call': return IconPhone
      case 'email': return IconMail
      case 'visit': return IconCar
      case 'sale': return IconCheck
      case 'followup': return IconBell
      default: return IconUsers
    }
  }

  const getActivityColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return 'green'
      case 'pending': return 'blue'
      case 'missed': return 'red'
      default: return 'gray'
    }
  }

  if (!isConsultant()) {
    return (
      <Container>
        <Alert color="red" icon={<IconAlertCircle />}>
          {t('auth.unauthorized', 'Unauthorized access')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container ref={dashboardRef} size="xl" className="py-8">
      {/* Enhanced Header */}
      <div className="mb-8">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} className="dashboard-header text-dealership-black flex items-center gap-3">
              <IconUserCheck size={32} className="text-blue-500" />
              {t('dashboard.title')}
            </Title>
            <Text className="dashboard-subtitle text-dealership-dark-text mt-2">
              {t('welcome')}, {consultantName} - {t('dashboard.subtitle')}
            </Text>
          </div>
          <Group>
            <AnimatedButton
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              className="refresh-button"
            >
              {t('common.refresh')}
            </AnimatedButton>
            <AnimatedButton
              leftSection={<IconTarget size={16} />}
              onClick={() => setShowGoals(!showGoals)}
              variant={showGoals ? 'filled' : 'light'}
            >
              {t('dashboard.goals', 'Goals')}
            </AnimatedButton>
          </Group>
        </Group>
      </div>

      {/* Goals Section */}
      {showGoals && (
        <Card className="mb-6 shadow-clean-lg" p="lg">
          <Group justify="space-between" mb="md">
            <Title order={4} className="flex items-center gap-2">
              <IconTarget size={20} className="text-violet-500" />
              {t('dashboard.monthlyGoals', 'Monthly Goals')}
            </Title>
            <NumberInput
              value={monthlyGoal}
              onChange={(val) => setMonthlyGoal(Number(val))}
              min={1}
              max={100}
              size="sm"
              className="w-24"
              rightSection={<IconSparkles size={16} />}
            />
          </Group>
          <Progress 
            value={(stats.completed / monthlyGoal) * 100} 
            size="xl" 
            radius="xl"
            color="violet"
            striped
            animated
          />
          <Text size="sm" c="dimmed" mt="xs">
            {stats.completed} / {monthlyGoal} {t('dashboard.completed')} ({Math.round((stats.completed / monthlyGoal) * 100)}%)
          </Text>
        </Card>
      )}

      {/* Enhanced Statistics Grid */}
      <Grid ref={statsRef} gutter="md" className="mb-8">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="shadow-clean hover:shadow-clean-lg transition-all transform hover:-translate-y-1">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">{t('dashboard.totalVisits')}</Text>
                <Text size="2xl" fw={700} className="text-dealership-black" ref={useCounterAnimation(stats.total)}>0</Text>
                <Group gap={4} mt={4}>
                  <IconArrowUp size={16} className="text-green-500" />
                  <Text size="xs" c="green">+12%</Text>
                </Group>
              </div>
              <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
                <IconUsers size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="shadow-clean hover:shadow-clean-lg transition-all transform hover:-translate-y-1">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">{t('dashboard.activeVisits')}</Text>
                <Text size="2xl" fw={700} className="text-dealership-black" ref={useCounterAnimation(stats.active)}>0</Text>
                <Badge color="orange" variant="light" size="sm" mt={4}>
                  <Group gap={4}>
                    <IconFlame size={12} />
                    {t('dashboard.inProgress')}
                  </Group>
                </Badge>
              </div>
              <ThemeIcon size="xl" radius="xl" variant="light" color="orange">
                <IconClock size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="shadow-clean hover:shadow-clean-lg transition-all transform hover:-translate-y-1">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">{t('dashboard.completed')}</Text>
                <Text size="2xl" fw={700} className="text-dealership-black" ref={useCounterAnimation(stats.completed)}>0</Text>
                <Group gap={4} mt={4}>
                  <IconCheck size={16} className="text-green-500" />
                  <Text size="xs" c="dimmed">{t('common.today')}: {stats.todayCount}</Text>
                </Group>
              </div>
              <ThemeIcon size="xl" radius="xl" variant="light" color="green">
                <IconCheck size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card className="shadow-clean hover:shadow-clean-lg transition-all transform hover:-translate-y-1">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">{t('dashboard.conversionRate')}</Text>
                <Group align="baseline" gap={4}>
                  <Text size="2xl" fw={700} className="text-dealership-black" ref={useCounterAnimation(stats.conversion)}>0</Text>
                  <Text size="lg" fw={700}>%</Text>
                </Group>
                <Progress value={stats.conversion} size="sm" radius="xl" color="violet" mt={8} />
              </div>
              <RingProgress
                size={60}
                thickness={6}
                sections={[{ value: stats.conversion, color: 'violet' }]}
                label={
                  <Text size="xs" ta="center" fw={700}>
                    {stats.conversion}%
                  </Text>
                }
              />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions */}
      <Card className="mb-6 shadow-clean-lg" p="lg">
        <Title order={4} mb="md" className="flex items-center gap-2">
          <IconBolt size={20} className="text-yellow-500" />
          {t('dashboard.quickActions', 'Quick Actions')}
        </Title>
        <Group>
          {quickActions.map((action, index) => (
            <AnimatedButton
              key={index}
              variant="light"
              color={action.color}
              leftSection={<action.icon size={18} />}
              rightSection={action.count && (
                <Badge size="sm" variant="filled" color={action.color}>
                  {action.count}
                </Badge>
              )}
              onClick={action.action}
            >
              {action.label}
            </AnimatedButton>
          ))}
        </Group>
      </Card>

      {/* Search and Filter Bar */}
      <Card className="mb-6 shadow-clean" p="md">
        <Group>
          <TextInput
            placeholder={t('common.search', 'Search customers...')}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            className="flex-1"
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || 'all')}
            data={[
              { value: 'all', label: t('common.all', 'All') },
              { value: 'new', label: t('visit.status.new') },
              { value: 'contacted', label: t('visit.status.contacted') },
              { value: 'scheduled', label: t('visit.status.scheduled') },
              { value: 'completed', label: t('visit.status.completed') },
            ]}
            leftSection={<IconFilter size={16} />}
            className="w-48"
          />
        </Group>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="customers" className="mb-8">
        <Tabs.List className="mb-6">
          <Tabs.Tab value="customers" leftSection={<IconUsers size={16} />}>
            {t('navigation.customers')} ({searchedVisits.length})
          </Tabs.Tab>
          <Tabs.Tab value="activity" leftSection={<IconClock size={16} />}>
            {t('dashboard.recentActivity', 'Recent Activity')}
          </Tabs.Tab>
          <Tabs.Tab value="performance" leftSection={<IconChartBar size={16} />}>
            {t('dashboard.performance', 'Performance')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="customers">
          {loading ? (
            <div className="text-center py-8">
              <Text>{t('status.loading')}</Text>
            </div>
          ) : error ? (
            <Alert color="red" icon={<IconAlertCircle />}>
              {error}
            </Alert>
          ) : searchedVisits.length === 0 ? (
            <Card className="text-center py-12 shadow-clean">
              <IconUsers size={48} className="mx-auto mb-4 text-dealership-text" />
              <Text size="lg" c="dimmed">
                {searchQuery 
                  ? t('dashboard.noSearchResults', 'No customers found matching your search')
                  : t('dashboard.noCustomers', 'No customers assigned yet')
                }
              </Text>
              {searchQuery && (
                <Button 
                  variant="subtle" 
                  onClick={() => setSearchQuery('')}
                  mt="md"
                >
                  {t('common.clearSearch', 'Clear search')}
                </Button>
              )}
            </Card>
          ) : (
            <AssignedCustomersList 
              visits={searchedVisits}
              onSelectCustomer={setSelectedCustomerId}
              onUpdateStatus={updateVisitStatus}
              onAddNote={(visit) => {
                setSelectedVisitForNotes(visit)
                setShowNotesModal(true)
              }}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="activity">
          <div ref={activityRef}>
            <Timeline active={recentActivities.length - 1} bulletSize={24} lineWidth={2}>
              {recentActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <Timeline.Item
                    key={activity.id}
                    bullet={
                      <ThemeIcon color={getActivityColor(activity.status)} size={24} radius="xl">
                        <Icon size={14} />
                      </ThemeIcon>
                    }
                    title={activity.title}
                  >
                    <Text size="sm" c="dimmed">
                      {activity.customer} • {activity.time}
                    </Text>
                  </Timeline.Item>
                )
              })}
            </Timeline>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="performance">
          <div ref={performanceRef}>
            <PerformanceMetrics consultantId={consultantId} />
          </div>
        </Tabs.Panel>
      </Tabs>

      {/* Customer Profile Modal */}
      {selectedCustomerId && (
        <CustomerProfileModal
          visitId={selectedCustomerId}
          opened={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}

      {/* Notes Modal */}
      <Modal
        opened={showNotesModal}
        onClose={() => {
          setShowNotesModal(false)
          setSelectedVisitForNotes(null)
        }}
        title={t('form.notes')}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {selectedVisitForNotes?.customer?.name}
          </Text>
          <TextInput
            placeholder={t('form.notes')}
            multiline
            rows={4}
            onChange={(e) => console.log(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                setShowNotesModal(false)
                setSelectedVisitForNotes(null)
              }}
            >
              {t('form.cancel')}
            </Button>
            <AnimatedButton
              onClick={() => handleAddNote(selectedVisitForNotes?.id, 'Note content')}
            >
              {t('form.save')}
            </AnimatedButton>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}