import { useState, useRef } from 'react'
import {
  Table,
  Badge,
  Text,
  Group,
  ActionIcon,
  Menu,
  Stack,
  Button,
  Card,
  Avatar,
  Tooltip,
  TextInput,
  Select,
  Modal,
  Textarea,
  Progress,
  Timeline,
  ThemeIcon,
  Indicator,
  Paper,
  Collapse,
  Divider,
  Grid,
} from '@mantine/core'
import {
  IconPhone,
  IconMail,
  IconCar,
  IconNotes,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconCalendar,
  IconUser,
  IconStar,
  IconStarFilled,
  IconMessage,
  IconChevronDown,
  IconChevronUp,
  IconBolt,
  IconTrendingUp,
  IconMapPin,
  IconCash,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { AnimatedButton } from '../buttons/AnimatedButton'
import { useMagneticEffect } from '../../hooks/useGSAPAnimation'

interface AssignedCustomersListProps {
  visits: any[]
  onSelectCustomer: (visitId: string) => void
  onUpdateStatus: (visitId: string, status: string) => void
  onAddNote?: (visit: any) => void
}

export function AssignedCustomersList({ 
  visits, 
  onSelectCustomer, 
  onUpdateStatus,
  onAddNote 
}: AssignedCustomersListProps) {
  const { t, i18n } = useTranslation()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [favoriteCustomers, setFavoriteCustomers] = useState<Set<string>>(new Set())
  const [showQuickContact, setShowQuickContact] = useState<string | null>(null)
  const [selectedVisitForAction, setSelectedVisitForAction] = useState<any>(null)
  const [actionType, setActionType] = useState<'call' | 'email' | 'schedule' | null>(null)
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS
  
  // Refs for animations
  const tableRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())

  // Animate table rows on mount
  useGSAP(() => {
    if (!tableRef.current) return
    
    const rows = tableRef.current.querySelectorAll('tbody tr')
    gsap.fromTo(rows,
      { 
        opacity: 0,
        x: isRTL ? 30 : -30,
      },
      { 
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
      }
    )
  }, { scope: tableRef, dependencies: [visits.length, isRTL] })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue'
      case 'contacted': return 'cyan'
      case 'scheduled': return 'violet'
      case 'test_drive': return 'orange'
      case 'negotiating': return 'yellow'
      case 'completed': return 'green'
      case 'lost': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return IconUser
      case 'contacted': return IconPhone
      case 'scheduled': return IconCalendar
      case 'test_drive': return IconCar
      case 'negotiating': return IconCash
      case 'completed': return IconCheck
      case 'lost': return IconAlertCircle
      default: return IconClock
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'red'
    if (priority >= 6) return 'orange'
    if (priority >= 4) return 'yellow'
    return 'gray'
  }

  const toggleRowExpansion = (visitId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId)
      
      // Collapse animation
      const row = rowRefs.current.get(visitId)
      if (row) {
        const expandedContent = row.nextElementSibling?.querySelector('.expanded-content')
        if (expandedContent) {
          gsap.to(expandedContent, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
          })
        }
      }
    } else {
      newExpanded.add(visitId)
      
      // Expand animation
      setTimeout(() => {
        const row = rowRefs.current.get(visitId)
        if (row) {
          const expandedContent = row.nextElementSibling?.querySelector('.expanded-content')
          if (expandedContent) {
            gsap.fromTo(expandedContent,
              { height: 0, opacity: 0 },
              { height: 'auto', opacity: 1, duration: 0.4, ease: "power2.out" }
            )
          }
        }
      }, 0)
    }
    setExpandedRows(newExpanded)
  }

  const toggleFavorite = (visitId: string) => {
    const newFavorites = new Set(favoriteCustomers)
    if (newFavorites.has(visitId)) {
      newFavorites.delete(visitId)
    } else {
      newFavorites.add(visitId)
      
      // Star animation
      const star = document.querySelector(`#star-${visitId}`)
      if (star) {
        gsap.fromTo(star,
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }
        )
      }
    }
    setFavoriteCustomers(newFavorites)
  }

  const handleQuickAction = (visit: any, type: 'call' | 'email' | 'schedule') => {
    setSelectedVisitForAction(visit)
    setActionType(type)
  }

  const closeActionModal = () => {
    setSelectedVisitForAction(null)
    setActionType(null)
  }

  // Calculate visit score (mock data)
  const getVisitScore = (visit: any) => {
    const base = 50
    const statusBonus = visit.status === 'negotiating' ? 30 : visit.status === 'scheduled' ? 20 : 0
    const timeBonus = Math.max(0, 20 - (new Date().getTime() - new Date(visit.visit_date).getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(100, base + statusBonus + timeBonus)
  }

  return (
    <div ref={tableRef}>
      <Card className="overflow-visible shadow-clean-lg">
        <Table horizontalSpacing="md" verticalSpacing="md" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              <Table.Th>{t('customer.name')}</Table.Th>
              <Table.Th>{t('vehicle.interest')}</Table.Th>
              <Table.Th>{t('visit.status.new')}</Table.Th>
              <Table.Th>{t('dashboard.priority', 'Priority')}</Table.Th>
              <Table.Th>{t('dashboard.score', 'Score')}</Table.Th>
              <Table.Th>{t('visit.visitDate')}</Table.Th>
              <Table.Th>{t('dashboard.quickActions', 'Quick Actions')}</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visits.map((visit) => {
              const StatusIcon = getStatusIcon(visit.status)
              const isExpanded = expandedRows.has(visit.id)
              const isFavorite = favoriteCustomers.has(visit.id)
              const visitScore = getVisitScore(visit)
              
              return (
                <>
                  <Table.Tr 
                    key={visit.id}
                    ref={(el) => {
                      if (el) rowRefs.current.set(visit.id, el)
                    }}
                    className="hover:bg-dealership-light transition-colors cursor-pointer"
                    onClick={() => onSelectCustomer(visit.id)}
                  >
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(visit.id)
                        }}
                      >
                        {isFavorite ? (
                          <IconStarFilled id={`star-${visit.id}`} size={16} className="text-yellow-500" />
                        ) : (
                          <IconStar id={`star-${visit.id}`} size={16} />
                        )}
                      </ActionIcon>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="sm">
                        <Indicator
                          inline
                          size={8}
                          offset={5}
                          position="bottom-end"
                          color={visit.ai_insights?.sentiment === 'positive' ? 'green' : 'red'}
                          withBorder
                        >
                          <Avatar size="sm" radius="xl" color="blue">
                            {visit.customer?.name?.charAt(0)}
                          </Avatar>
                        </Indicator>
                        <div>
                          <Text size="sm" fw={500}>{visit.customer?.name}</Text>
                          <Text size="xs" c="dimmed">{visit.customer?.phone}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <Stack gap={4}>
                        <Text size="sm">{visit.customer?.vehicleType}</Text>
                        <Badge size="xs" variant="light">
                          {visit.customer?.budgetRange}
                        </Badge>
                      </Stack>
                    </Table.Td>
                    
                    <Table.Td>
                      <Badge
                        leftSection={<StatusIcon size={14} />}
                        color={getStatusColor(visit.status)}
                        variant="light"
                      >
                        {t(`visit.status.${visit.status}`)}
                      </Badge>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap={4}>
                        <IconBolt size={16} className={`text-${getPriorityColor(visit.ai_insights?.priority || 5)}-500`} />
                        <Text size="sm" fw={500}>
                          {visit.ai_insights?.priority || 'N/A'}
                        </Text>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <Progress
                        value={visitScore}
                        size="lg"
                        radius="xl"
                        color={visitScore >= 80 ? 'green' : visitScore >= 60 ? 'yellow' : 'red'}
                      />
                      <Text size="xs" c="dimmed" ta="center" mt={2}>
                        {visitScore}%
                      </Text>
                    </Table.Td>
                    
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">
                          {formatDistanceToNow(new Date(visit.visit_date), { 
                            addSuffix: true,
                            locale: dateLocale 
                          })}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </Text>
                      </Stack>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <Tooltip label={t('common.contact')}>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleQuickAction(visit, 'call')}
                          >
                            <IconPhone size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('form.email')}>
                          <ActionIcon
                            variant="light"
                            color="teal"
                            onClick={() => handleQuickAction(visit, 'email')}
                          >
                            <IconMail size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('dashboard.schedule', 'Schedule')}>
                          <ActionIcon
                            variant="light"
                            color="violet"
                            onClick={() => handleQuickAction(visit, 'schedule')}
                          >
                            <IconCalendar size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => toggleRowExpansion(visit.id)}
                        >
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                        
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEye size={14} />}
                              onClick={() => onSelectCustomer(visit.id)}
                            >
                              {t('common.view')}
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconNotes size={14} />}
                              onClick={() => onAddNote?.(visit)}
                            >
                              {t('form.notes')}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Label>{t('dashboard.updateStatus', 'Update Status')}</Menu.Label>
                            {['contacted', 'scheduled', 'test_drive', 'negotiating', 'completed'].map(status => (
                              <Menu.Item
                                key={status}
                                onClick={() => onUpdateStatus(visit.id, status)}
                                disabled={visit.status === status}
                              >
                                {t(`visit.status.${status}`)}
                              </Menu.Item>
                            ))}
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  
                  {isExpanded && (
                    <Table.Tr>
                      <Table.Td colSpan={9} p={0}>
                        <div className="expanded-content overflow-hidden">
                          <Paper p="md" className="bg-dealership-light">
                            <Group justify="space-between" mb="md">
                              <Text fw={500}>{t('dashboard.customerDetails', 'Customer Details')}</Text>
                              <Group gap="xs">
                                <Badge variant="light" leftSection={<IconMessage size={12} />}>
                                  {visit.interactions?.length || 0} {t('dashboard.interactions', 'Interactions')}
                                </Badge>
                                <Badge variant="light" leftSection={<IconTrendingUp size={12} />}>
                                  {visit.ai_insights?.purchase_probability || 0}% {t('ai.purchaseProb')}
                                </Badge>
                              </Group>
                            </Group>
                            
                            <Grid gutter="md">
                              <Grid.Col span={6}>
                                <Stack gap="xs">
                                  <Group gap="xs">
                                    <IconMapPin size={16} className="text-dealership-text" />
                                    <Text size="sm">{visit.source || t('common.walkIn')}</Text>
                                  </Group>
                                  <Group gap="xs">
                                    <IconCar size={16} className="text-dealership-text" />
                                    <Text size="sm">{visit.customer?.purchaseTimeline}</Text>
                                  </Group>
                                  <Group gap="xs">
                                    <IconNotes size={16} className="text-dealership-text" />
                                    <Text size="sm">{visit.customer?.notes || t('dashboard.noNotes', 'No notes')}</Text>
                                  </Group>
                                </Stack>
                              </Grid.Col>
                              
                              <Grid.Col span={6}>
                                {visit.ai_insights && (
                                  <Stack gap="xs">
                                    <Text size="sm" fw={500}>{t('ai.insights')}</Text>
                                    <Text size="xs" c="dimmed">{visit.ai_insights.recommended_actions?.[0]}</Text>
                                    <Group gap="xs">
                                      <Badge size="xs" color={visit.ai_insights.sentiment === 'positive' ? 'green' : 'red'}>
                                        {visit.ai_insights.sentiment}
                                      </Badge>
                                      <Badge size="xs" variant="dot">
                                        {t('ai.confidence')}: {visit.ai_insights.confidence}%
                                      </Badge>
                                    </Group>
                                  </Stack>
                                )}
                              </Grid.Col>
                            </Grid>
                          </Paper>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </>
              )
            })}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Quick Action Modals */}
      <Modal
        opened={!!selectedVisitForAction && !!actionType}
        onClose={closeActionModal}
        title={
          actionType === 'call' ? t('dashboard.makeCall', 'Make a Call') :
          actionType === 'email' ? t('dashboard.sendEmail', 'Send Email') :
          t('dashboard.scheduleAppointment', 'Schedule Appointment')
        }
      >
        {selectedVisitForAction && (
          <Stack>
            <Group>
              <Avatar color="blue">{selectedVisitForAction.customer?.name?.charAt(0)}</Avatar>
              <div>
                <Text fw={500}>{selectedVisitForAction.customer?.name}</Text>
                <Text size="sm" c="dimmed">{selectedVisitForAction.customer?.phone}</Text>
              </div>
            </Group>
            
            <Divider />
            
            {actionType === 'call' && (
              <>
                <Text size="sm" c="dimmed">{t('dashboard.callNotes', 'Call Notes')}</Text>
                <Textarea
                  placeholder={t('dashboard.callNotesPlaceholder', 'Enter notes about the call...')}
                  rows={4}
                />
                <AnimatedButton
                  leftSection={<IconPhone size={16} />}
                  fullWidth
                >
                  {t('dashboard.logCall', 'Log Call')}
                </AnimatedButton>
              </>
            )}
            
            {actionType === 'email' && (
              <>
                <TextInput
                  label={t('dashboard.subject', 'Subject')}
                  placeholder={t('dashboard.emailSubject', 'Email subject...')}
                />
                <Textarea
                  label={t('dashboard.message', 'Message')}
                  placeholder={t('dashboard.emailMessage', 'Email message...')}
                  rows={6}
                />
                <AnimatedButton
                  leftSection={<IconMail size={16} />}
                  fullWidth
                >
                  {t('dashboard.sendEmail', 'Send Email')}
                </AnimatedButton>
              </>
            )}
            
            {actionType === 'schedule' && (
              <>
                <TextInput
                  label={t('dashboard.appointmentType', 'Appointment Type')}
                  placeholder={t('dashboard.appointmentTypePlaceholder', 'e.g., Test Drive, Consultation')}
                />
                <DateTimePicker
                  label={t('dashboard.dateTime', 'Date & Time')}
                  placeholder={t('dashboard.selectDateTime', 'Select date and time')}
                />
                <Textarea
                  label={t('form.notes')}
                  placeholder={t('dashboard.appointmentNotes', 'Additional notes...')}
                  rows={3}
                />
                <AnimatedButton
                  leftSection={<IconCalendar size={16} />}
                  fullWidth
                >
                  {t('dashboard.scheduleAppointment', 'Schedule Appointment')}
                </AnimatedButton>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  )
}

// Mock DateTimePicker component (replace with actual Mantine DateTimePicker when available)
function DateTimePicker({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <TextInput
      label={label}
      placeholder={placeholder}
      leftSection={<IconCalendar size={16} />}
      type="datetime-local"
    />
  )
}