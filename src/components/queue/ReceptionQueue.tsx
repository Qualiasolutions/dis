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
  Button,
  Select,
  ActionIcon,
  Loader,
  Alert,
  Tabs,
  Progress,
  RingProgress,
  Timeline,
  ThemeIcon,
  Paper,
  Switch,
  Tooltip,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Indicator,
  Avatar,
  SegmentedControl,
  Divider,
  Collapse,
} from '@mantine/core'
import { 
  IconRefresh, 
  IconUsers, 
  IconClock, 
  IconUserCheck,
  IconAlertCircle,
  IconFilter,
  IconBolt,
  IconSparkles,
  IconChartBar,
  IconTrendingUp,
  IconBell,
  IconSearch,
  IconPlus,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconRobot,
  IconBrain,
  IconDashboard,
  IconCalendarStats,
  IconUserPlus,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'
import { QueueCard } from './QueueCard'
import { useQueueStore } from '../../stores/queueStore'
import { useConsultantsStore } from '../../stores/consultantsStore'
import { TahboubLogo } from '../common/TahboubLogo'
import { AnimatedButton } from '../buttons/AnimatedButton'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useStaggerAnimation, useRevealOnScroll, useCounterAnimation } from '../../hooks/useGSAPAnimation'
import { animationUtils } from '../../utils/animations'

interface QueueStats {
  totalToday: number
  inQueue: number
  beingServed: number
  completed: number
  avgWaitTime: number
  peakHour: string
  consultantLoad: { [key: string]: number }
}

export function ReceptionQueue() {
  const { t, i18n } = useTranslation()
  const [autoAssignMode, setAutoAssignMode] = useState(false)
  const [aiPrioritization, setAiPrioritization] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid')
  const isRTL = i18n.language === 'ar'
  
  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const statsRef = useStaggerAnimation(0.1, 0.5)
  const queueRef = useRevealOnScroll()
  const refreshBtnRef = useRef<HTMLButtonElement>(null)
  
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
    getAvailableConsultants,
    getConsultantById,
    updateConsultantStatus
  } = useConsultantsStore()

  // Calculate queue statistics
  const stats: QueueStats = {
    totalToday: visits.length,
    inQueue: getPendingVisits().length,
    beingServed: getActiveVisits().length,
    completed: getVisitsByStatus('completed').length,
    avgWaitTime: Math.round(Math.random() * 30 + 10), // Mock data
    peakHour: '2:00 PM - 3:00 PM', // Mock data
    consultantLoad: consultants.reduce((acc, consultant) => {
      const assignedCount = visits.filter(v => v.assigned_consultant_id === consultant.id).length
      acc[consultant.name] = assignedCount
      return acc
    }, {} as { [key: string]: number })
  }

  // Header animation
  useGSAP(() => {
    if (!headerRef.current) return
    
    const tl = gsap.timeline()
    
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
    .fromTo('.header-subtitle',
      { opacity: 0, x: isRTL ? 30 : -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
  }, { scope: containerRef, dependencies: [isRTL] })

  useEffect(() => {
    fetchVisits()
    fetchConsultants()
    const unsubscribe = subscribeToVisits()
    
    return () => {
      unsubscribe()
    }
  }, [fetchVisits, fetchConsultants, subscribeToVisits])

  const handleRefresh = () => {
    // Animate refresh button
    if (refreshBtnRef.current) {
      gsap.to(refreshBtnRef.current, {
        rotation: 360,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(refreshBtnRef.current, { rotation: 0 })
        }
      })
    }
    
    fetchVisits()
    fetchConsultants()
  }

  const handleAssignConsultant = async (visitId: string, consultantId: string) => {
    try {
      await assignConsultant(visitId, consultantId)
      
      // Success animation
      const card = document.querySelector(`#queue-card-${visitId}`)
      if (card) {
        gsap.to(card, {
          scale: 0.95,
          opacity: 0.8,
          duration: 0.3,
          onComplete: () => {
            gsap.to(card, {
              scale: 1,
              opacity: 1,
              duration: 0.3,
            })
          }
        })
      }
      
      notifications.show({
        title: t('dashboard.consultantAssigned', 'Consultant Assigned'),
        message: t('dashboard.assignmentSuccess', 'Customer has been assigned successfully'),
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: t('status.error'),
        message: t('messages.sync_error'),
        color: 'red',
      })
    }
  }

  const getSmartAssignment = () => {
    // AI-based smart assignment logic (mock)
    const availableConsultants = getAvailableConsultants()
    if (availableConsultants.length === 0) return null
    
    // Sort by load (least busy first)
    const sortedConsultants = availableConsultants.sort((a, b) => {
      const loadA = stats.consultantLoad[a.name] || 0
      const loadB = stats.consultantLoad[b.name] || 0
      return loadA - loadB
    })
    
    return sortedConsultants[0]
  }

  const handleAutoAssign = async () => {
    const pendingVisits = getPendingVisits()
    if (pendingVisits.length === 0) {
      notifications.show({
        title: t('dashboard.noCustomersInQueue', 'No Customers in Queue'),
        message: t('dashboard.allCustomersAssigned', 'All customers have been assigned'),
        color: 'blue',
      })
      return
    }
    
    const smartConsultant = getSmartAssignment()
    if (!smartConsultant) {
      notifications.show({
        title: t('dashboard.noConsultantsAvailable', 'No Consultants Available'),
        message: t('dashboard.allConsultantsBusy', 'All consultants are currently busy'),
        color: 'yellow',
      })
      return
    }
    
    // Assign to first pending visit
    await handleAssignConsultant(pendingVisits[0].id, smartConsultant.id)
  }

  // Filter visits based on search and status
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = !searchQuery || 
      visit.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.customer?.phone?.includes(searchQuery)
    
    const matchesStatus = filterStatus === 'all' || visit.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const pendingVisits = filteredVisits.filter(v => !v.assigned_consultant_id)
  const activeVisits = filteredVisits.filter(v => v.assigned_consultant_id && v.status !== 'completed')
  const completedVisits = filteredVisits.filter(v => v.status === 'completed')

  if (error) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle />} title={t('status.error')} color="red">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container ref={containerRef} size="xl" className="py-8">
      {/* Enhanced Header */}
      <div ref={headerRef} className="mb-8">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} className="flex items-center gap-3 text-dealership-black">
              <IconUsers size={32} className="text-blue-500" />
              {t('navigation.queue', 'Reception Queue')}
            </Title>
            <Text className="header-subtitle text-dealership-dark-text mt-2">
              {t('dashboard.manageCustomerFlow', 'Manage customer flow and assignments')}
            </Text>
          </div>
          
          <Group>
            <AnimatedButton
              ref={refreshBtnRef}
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              loading={loading || consultantsLoading}
            >
              {t('common.refresh')}
            </AnimatedButton>
            <AnimatedButton
              leftSection={<IconChartBar size={16} />}
              variant={showStats ? 'filled' : 'light'}
              onClick={() => setShowStats(!showStats)}
            >
              {t('dashboard.statistics', 'Statistics')}
            </AnimatedButton>
            <AnimatedButton
              leftSection={<IconUserPlus size={16} />}
              onClick={() => setShowAddCustomer(true)}
              color="green"
            >
              {t('dashboard.addCustomer', 'Add Customer')}
            </AnimatedButton>
          </Group>
        </Group>
      </div>

      {/* AI Features Bar */}
      <Card className="mb-6 shadow-clean-lg" p="md">
        <Group justify="space-between">
          <Group>
            <ThemeIcon size="lg" radius="xl" variant="light" color="violet">
              <IconBrain size={20} />
            </ThemeIcon>
            <div>
              <Text fw={500}>{t('dashboard.aiFeatures', 'AI Features')}</Text>
              <Text size="xs" c="dimmed">
                {t('dashboard.intelligentQueueManagement', 'Intelligent queue management')}
              </Text>
            </div>
          </Group>
          
          <Group>
            <Switch
              label={t('dashboard.aiPrioritization', 'AI Prioritization')}
              checked={aiPrioritization}
              onChange={(e) => setAiPrioritization(e.currentTarget.checked)}
              thumbIcon={
                aiPrioritization ? <IconBolt size={12} /> : null
              }
            />
            <Switch
              label={t('dashboard.autoAssign', 'Auto-assign')}
              checked={autoAssignMode}
              onChange={(e) => setAutoAssignMode(e.currentTarget.checked)}
              thumbIcon={
                autoAssignMode ? <IconRobot size={12} /> : null
              }
            />
            {autoAssignMode && (
              <AnimatedButton
                size="sm"
                leftSection={<IconBolt size={16} />}
                onClick={handleAutoAssign}
                color="violet"
              >
                {t('dashboard.assignNext', 'Assign Next')}
              </AnimatedButton>
            )}
          </Group>
        </Group>
      </Card>

      {/* Statistics Dashboard */}
      {showStats && (
        <div ref={statsRef} className="mb-8">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="shadow-clean hover:shadow-clean-lg transition-all">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">{t('dashboard.todayTotal', "Today's Total")}</Text>
                    <Text size="2xl" fw={700} ref={useCounterAnimation(stats.totalToday)}>0</Text>
                    <Progress 
                      value={(stats.totalToday / 50) * 100} 
                      size="sm" 
                      radius="xl" 
                      color="blue" 
                      mt={8}
                    />
                  </div>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
                    <IconCalendarStats size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="shadow-clean hover:shadow-clean-lg transition-all">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">{t('dashboard.currentQueue', 'Current Queue')}</Text>
                    <Text size="2xl" fw={700} ref={useCounterAnimation(stats.inQueue)}>0</Text>
                    <Badge color="orange" variant="light" size="sm" mt={8}>
                      {t('dashboard.waiting', 'Waiting')}
                    </Badge>
                  </div>
                  <RingProgress
                    size={60}
                    thickness={6}
                    sections={[
                      { value: (stats.inQueue / stats.totalToday) * 100, color: 'orange' }
                    ]}
                    label={
                      <Text size="xs" ta="center" fw={700}>
                        {Math.round((stats.inQueue / stats.totalToday) * 100)}%
                      </Text>
                    }
                  />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="shadow-clean hover:shadow-clean-lg transition-all">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">{t('dashboard.beingServed', 'Being Served')}</Text>
                    <Text size="2xl" fw={700} ref={useCounterAnimation(stats.beingServed)}>0</Text>
                    <Group gap={4} mt={8}>
                      <IconArrowUp size={16} className="text-green-500" />
                      <Text size="xs" c="green">Active</Text>
                    </Group>
                  </div>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="teal">
                    <IconUserCheck size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="shadow-clean hover:shadow-clean-lg transition-all">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">{t('dashboard.avgWaitTime', 'Avg Wait Time')}</Text>
                    <Group align="baseline" gap={4}>
                      <Text size="2xl" fw={700} ref={useCounterAnimation(stats.avgWaitTime)}>0</Text>
                      <Text size="sm" c="dimmed">{t('common.minutes')}</Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={8}>
                      {t('dashboard.peakHour', 'Peak')}: {stats.peakHour}
                    </Text>
                  </div>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="violet">
                    <IconClock size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Consultant Load Chart */}
          <Card className="mt-4 shadow-clean">
            <Title order={5} mb="md">{t('dashboard.consultantWorkload', 'Consultant Workload')}</Title>
            <Stack gap="xs">
              {Object.entries(stats.consultantLoad).map(([name, count]) => (
                <div key={name}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm">{name}</Text>
                    <Badge size="sm" variant="light">{count} {t('dashboard.customers', 'customers')}</Badge>
                  </Group>
                  <Progress 
                    value={(count / 10) * 100} 
                    size="md" 
                    radius="xl"
                    color={count > 7 ? 'red' : count > 4 ? 'yellow' : 'green'}
                  />
                </div>
              ))}
            </Stack>
          </Card>
        </div>
      )}

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
            value={filterStatus}
            onChange={(value) => setFilterStatus(value || 'all')}
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
          <SegmentedControl
            value={selectedView}
            onChange={(value: any) => setSelectedView(value)}
            data={[
              { label: t('dashboard.grid', 'Grid'), value: 'grid' },
              { label: t('dashboard.list', 'List'), value: 'list' },
            ]}
          />
        </Group>
      </Card>

      {/* Queue Tabs */}
      <div ref={queueRef}>
        <Tabs defaultValue="pending" className="mb-8">
          <Tabs.List className="mb-6">
            <Tabs.Tab 
              value="pending" 
              leftSection={<IconClock size={16} />}
              rightSection={
                <Badge size="sm" variant="filled" color="orange">
                  {pendingVisits.length}
                </Badge>
              }
            >
              {t('dashboard.waitingQueue', 'Waiting Queue')}
            </Tabs.Tab>
            <Tabs.Tab 
              value="active" 
              leftSection={<IconUserCheck size={16} />}
              rightSection={
                <Badge size="sm" variant="filled" color="teal">
                  {activeVisits.length}
                </Badge>
              }
            >
              {t('dashboard.beingServed', 'Being Served')}
            </Tabs.Tab>
            <Tabs.Tab 
              value="completed" 
              leftSection={<IconCheck size={16} />}
              rightSection={
                <Badge size="sm" variant="filled" color="green">
                  {completedVisits.length}
                </Badge>
              }
            >
              {t('dashboard.completed', 'Completed')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            {loading ? (
              <div className="text-center py-12">
                <Loader size="lg" />
                <Text mt="md" c="dimmed">{t('status.loading')}</Text>
              </div>
            ) : pendingVisits.length === 0 ? (
              <Card className="text-center py-12 shadow-clean">
                <IconUsers size={48} className="mx-auto mb-4 text-dealership-text" />
                <Text size="lg" c="dimmed">{t('dashboard.noCustomersWaiting', 'No customers waiting')}</Text>
                <AnimatedButton
                  variant="subtle"
                  onClick={() => setShowAddCustomer(true)}
                  mt="md"
                  leftSection={<IconPlus size={16} />}
                >
                  {t('dashboard.addFirstCustomer', 'Add first customer')}
                </AnimatedButton>
              </Card>
            ) : (
              <Grid gutter="md">
                {pendingVisits.map((visit, index) => (
                  <Grid.Col key={visit.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <div id={`queue-card-${visit.id}`}>
                      <QueueCard
                        visit={visit}
                        consultants={consultants}
                        onAssign={handleAssignConsultant}
                        queuePosition={index + 1}
                        totalInQueue={pendingVisits.length}
                        aiPriority={aiPrioritization}
                      />
                    </div>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="active">
            {activeVisits.length === 0 ? (
              <Card className="text-center py-12 shadow-clean">
                <IconUserCheck size={48} className="mx-auto mb-4 text-dealership-text" />
                <Text size="lg" c="dimmed">{t('dashboard.noActiveCustomers', 'No customers being served')}</Text>
              </Card>
            ) : (
              <Grid gutter="md">
                {activeVisits.map((visit) => {
                  const consultant = getConsultantById(visit.assigned_consultant_id!)
                  return (
                    <Grid.Col key={visit.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card className="shadow-clean hover:shadow-clean-lg transition-all">
                        <Group justify="space-between" mb="md">
                          <Badge color="teal" variant="light">
                            {t('dashboard.beingServed', 'Being Served')}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {new Date(visit.visit_date).toLocaleTimeString()}
                          </Text>
                        </Group>
                        
                        <Stack gap="sm">
                          <Group>
                            <Avatar color="blue" radius="xl">
                              {visit.customer?.name?.charAt(0)}
                            </Avatar>
                            <div>
                              <Text fw={500}>{visit.customer?.name}</Text>
                              <Text size="sm" c="dimmed">{visit.customer?.phone}</Text>
                            </div>
                          </Group>
                          
                          <Divider />
                          
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">{t('visit.consultant')}</Text>
                            <Badge variant="dot" color="blue">
                              {consultant?.name || t('common.unassigned')}
                            </Badge>
                          </Group>
                          
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">{t('vehicle.type')}</Text>
                            <Text size="sm" fw={500}>{visit.customer?.vehicleType}</Text>
                          </Group>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  )
                })}
              </Grid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="completed">
            {completedVisits.length === 0 ? (
              <Card className="text-center py-12 shadow-clean">
                <IconCheck size={48} className="mx-auto mb-4 text-dealership-text" />
                <Text size="lg" c="dimmed">{t('dashboard.noCompletedToday', 'No completed visits today')}</Text>
              </Card>
            ) : (
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {completedVisits.map((visit) => {
                  const consultant = getConsultantById(visit.assigned_consultant_id!)
                  return (
                    <Timeline.Item
                      key={visit.id}
                      bullet={
                        <ThemeIcon color="green" size={24} radius="xl">
                          <IconCheck size={14} />
                        </ThemeIcon>
                      }
                      title={visit.customer?.name}
                    >
                      <Text size="sm" c="dimmed">
                        {t('dashboard.servedBy', 'Served by')} {consultant?.name} • {new Date(visit.visit_date).toLocaleTimeString()}
                      </Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        {visit.customer?.vehicleType} • {visit.customer?.budgetRange}
                      </Text>
                    </Timeline.Item>
                  )
                })}
              </Timeline>
            )}
          </Tabs.Panel>
        </Tabs>
      </div>

      {/* Add Customer Modal */}
      <Modal
        opened={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        title={t('dashboard.quickAddCustomer', 'Quick Add Customer')}
        size="md"
      >
        <Stack>
          <TextInput
            label={t('form.name')}
            placeholder={t('dashboard.enterName', 'Enter customer name')}
            leftSection={<IconUser size={16} />}
            required
          />
          <TextInput
            label={t('form.phone')}
            placeholder="07XXXXXXXX"
            leftSection={<IconPhone size={16} />}
            required
          />
          <Select
            label={t('form.vehicle_type')}
            placeholder={t('dashboard.selectType', 'Select type')}
            leftSection={<IconCar size={16} />}
            data={[
              { value: 'sedan', label: t('vehicle_types.sedan') },
              { value: 'suv', label: t('vehicle_types.suv') },
              { value: 'pickup', label: t('vehicle_types.pickup') },
              { value: 'luxury', label: t('vehicle_types.luxury') },
            ]}
          />
          <AnimatedButton
            fullWidth
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setShowAddCustomer(false)
              notifications.show({
                title: t('dashboard.customerAdded', 'Customer Added'),
                message: t('dashboard.addedToQueue', 'Customer has been added to the queue'),
                color: 'green',
              })
            }}
          >
            {t('dashboard.addToQueue', 'Add to Queue')}
          </AnimatedButton>
        </Stack>
      </Modal>
    </Container>
  )
}