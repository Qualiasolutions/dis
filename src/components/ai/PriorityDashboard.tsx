import React, { useState } from 'react'
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Grid,
  ActionIcon,
  Select,
  LoadingOverlay,
  Alert,
  Avatar,
  Button,
  Tooltip,
  Box,
  ScrollArea,
  Divider,
  ThemeIcon,
  Progress,
  Anchor
} from '@mantine/core'
import {
  IconBrain,
  IconTrendingUp,
  IconPhone,
  IconCalendar,
  IconCar,
  IconRefresh,
  IconEye,
  IconMessage,
  IconAlertTriangle,
  IconTarget,
  IconHeart
} from '@tabler/icons-react'
import { useHighPriorityVisits, useAIAnalysis } from '../../hooks/useAIAnalysis'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

export function PriorityDashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  
  const [limit, setLimit] = useState('10')
  const { data: priorityVisits, isLoading, error, refetch } = useHighPriorityVisits(parseInt(limit))
  const aiAnalysisMutation = useAIAnalysis()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue'
      case 'contacted': return 'cyan'
      case 'scheduled': return 'yellow'
      case 'test_drive': return 'orange'
      case 'negotiating': return 'grape'
      case 'completed': return 'green'
      case 'lost': return 'red'
      default: return 'gray'
    }
  }

  const getPriorityColor = (ranking: number) => {
    if (ranking >= 9) return 'red'
    if (ranking >= 8) return 'orange'
    if (ranking >= 7) return 'yellow'
    return 'blue'
  }

  const getPriorityLabel = (ranking: number) => {
    if (ranking >= 9) return t('ai.priority.critical')
    if (ranking >= 8) return t('ai.priority.high')
    if (ranking >= 7) return t('ai.priority.medium')
    return t('ai.priority.normal')
  }

  const formatPhoneJordan = (phone: string) => {
    // Format Jordan phone numbers (07XXXXXXXX -> 07X XXX XXXX)
    if (phone.startsWith('07') && phone.length === 10) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
    }
    return phone
  }

  const handleViewVisit = (visitId: string) => {
    navigate(`/visits/${visitId}`)
  }

  const handleReanalyzeVisit = async (visit: any) => {
    const requestData = {
      visit_id: visit.id,
      customer_data: {
        name: visit.customers.name,
        phone: visit.customers.phone,
        language_preference: visit.customers.language_preference,
        visit_history: 1
      },
      visit_data: {
        vehicle_interest: visit.vehicle_interest || {},
        consultant_notes: visit.consultant_notes,
        source: visit.source,
        visit_duration: visit.visit_duration,
        interaction_quality: visit.interaction_quality
      },
      force_reanalysis: true
    }

    aiAnalysisMutation.mutate(requestData)
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={16} />}>
        {t('ai.priority.loadError')}
      </Alert>
    )
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="orange">
              <IconBrain size={16} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('ai.priority.title')}</Text>
            <Badge variant="light" color="orange">
              {priorityVisits?.length || 0} {t('ai.priority.customers')}
            </Badge>
          </Group>
          
          <Group gap="xs">
            <Select
              size="xs"
              value={limit}
              onChange={(value) => setLimit(value || '10')}
              data={[
                { value: '5', label: '5' },
                { value: '10', label: '10' },
                { value: '20', label: '20' },
                { value: '50', label: '50' }
              ]}
              w={70}
            />
            <Tooltip label={t('common.refresh')}>
              <ActionIcon size="sm" variant="light" onClick={() => refetch()}>
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Priority Visits List */}
        <Box pos="relative">
          <LoadingOverlay visible={isLoading} />
          
          {priorityVisits && priorityVisits.length > 0 ? (
            <ScrollArea h={600}>
              <Stack gap="sm">
                {priorityVisits.map((visit, index) => {
                  const analysis = visit.ai_analysis as any
                  const priority = visit.ai_priority_ranking || analysis?.priority_ranking || 5
                  const purchaseProb = visit.ai_purchase_probability || analysis?.purchase_probability || 0
                  const sentiment = visit.ai_sentiment_score || analysis?.sentiment_score || 0
                  
                  return (
                    <Card key={visit.id} withBorder shadow="sm" padding="md">
                      <Stack gap="sm">
                        {/* Customer Info Header */}
                        <Group justify="space-between">
                          <Group gap="sm">
                            <Avatar 
                              size="md" 
                              color={getPriorityColor(priority)}
                              radius="xl"
                            >
                              {index + 1}
                            </Avatar>
                            <Box>
                              <Text fw={600} size="sm">
                                {visit.customers.name}
                              </Text>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">
                                  <IconPhone size={12} style={{ marginRight: 4 }} />
                                  {formatPhoneJordan(visit.customers.phone)}
                                </Text>
                                <Badge 
                                  size="xs" 
                                  variant="light"
                                  color={visit.customers.language_preference === 'ar' ? 'green' : 'blue'}
                                >
                                  {visit.customers.language_preference === 'ar' ? 'العربية' : 'English'}
                                </Badge>
                              </Group>
                            </Box>
                          </Group>

                          <Group gap="xs">
                            <Badge 
                              color={getPriorityColor(priority)}
                              variant="filled"
                              size="sm"
                            >
                              {getPriorityLabel(priority)} ({priority}/10)
                            </Badge>
                            <Badge 
                              color={getStatusColor(visit.status)}
                              variant="light"
                              size="sm"
                            >
                              {t(`visit.status.${visit.status}`)}
                            </Badge>
                          </Group>
                        </Group>

                        {/* AI Metrics */}
                        <Grid>
                          <Grid.Col span={4}>
                            <Group gap="xs" justify="center">
                              <ThemeIcon size="sm" variant="light" color="green">
                                <IconTarget size={14} />
                              </ThemeIcon>
                              <Box ta="center">
                                <Text size="xs" c="dimmed">{t('ai.purchaseProb')}</Text>
                                <Text fw={600} size="sm" c="green">
                                  {Math.round(purchaseProb * 100)}%
                                </Text>
                              </Box>
                            </Group>
                          </Grid.Col>

                          <Grid.Col span={4}>
                            <Group gap="xs" justify="center">
                              <ThemeIcon size="sm" variant="light" color="blue">
                                <IconHeart size={14} />
                              </ThemeIcon>
                              <Box ta="center">
                                <Text size="xs" c="dimmed">{t('ai.sentiment')}</Text>
                                <Text fw={600} size="sm" c={sentiment > 0 ? 'green' : sentiment < 0 ? 'red' : 'yellow'}>
                                  {sentiment > 0 ? '+' : ''}{(sentiment * 100).toFixed(0)}
                                </Text>
                              </Box>
                            </Group>
                          </Grid.Col>

                          <Grid.Col span={4}>
                            <Group gap="xs" justify="center">
                              <ThemeIcon size="sm" variant="light" color="orange">
                                <IconTrendingUp size={14} />
                              </ThemeIcon>
                              <Box ta="center">
                                <Text size="xs" c="dimmed">{t('ai.lastAnalysis')}</Text>
                                <Text fw={600} size="sm">
                                  {analysis?.generated_at 
                                    ? formatDistanceToNow(new Date(analysis.generated_at), { 
                                        addSuffix: true, 
                                        locale 
                                      })
                                    : t('common.never')
                                  }
                                </Text>
                              </Box>
                            </Group>
                          </Grid.Col>
                        </Grid>

                        {/* Vehicle Interest */}
                        {visit.vehicle_interest && (
                          <Group gap="xs" wrap="nowrap">
                            <IconCar size={14} />
                            <Text size="xs" c="dimmed" truncate>
                              {visit.vehicle_interest.brand} {visit.vehicle_interest.model} 
                              {visit.vehicle_interest.type && ` (${visit.vehicle_interest.type})`}
                              {visit.vehicle_interest.budget_range && ` - ${visit.vehicle_interest.budget_range} JOD`}
                            </Text>
                          </Group>
                        )}

                        {/* Consultant */}
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            {t('visit.consultant')}:
                          </Text>
                          <Text size="xs" fw={500}>
                            {visit.consultants?.name || t('common.unassigned')}
                          </Text>
                        </Group>

                        {/* Next Contact Timing */}
                        {analysis?.next_contact_timing && (
                          <Alert color="blue" size="xs" p="xs">
                            <Group gap="xs">
                              <IconCalendar size={14} />
                              <Text size="xs">
                                {t('ai.nextContact')}: {analysis.next_contact_timing}
                              </Text>
                            </Group>
                          </Alert>
                        )}

                        {/* Recommended Actions */}
                        {analysis?.recommended_actions && analysis.recommended_actions.length > 0 && (
                          <Box>
                            <Text size="xs" fw={500} mb={4}>{t('ai.topActions')}:</Text>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {analysis.recommended_actions.slice(0, 2).join(' • ')}
                            </Text>
                          </Box>
                        )}

                        <Divider />

                        {/* Actions */}
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconEye size={14} />}
                              onClick={() => handleViewVisit(visit.id)}
                            >
                              {t('common.view')}
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              leftSection={<IconMessage size={14} />}
                            >
                              {t('common.contact')}
                            </Button>
                          </Group>

                          <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<IconRefresh size={14} />}
                            loading={aiAnalysisMutation.isPending}
                            onClick={() => handleReanalyzeVisit(visit)}
                          >
                            {t('ai.reanalyze')}
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  )
                })}
              </Stack>
            </ScrollArea>
          ) : (
            <Alert icon={<IconAlertTriangle size={16} />}>
              {isLoading ? t('common.loading') : t('ai.priority.noPriority')}
            </Alert>
          )}
        </Box>

        {/* Summary Stats */}
        {priorityVisits && priorityVisits.length > 0 && (
          <Card withBorder bg="gray.0">
            <Grid>
              <Grid.Col span={3}>
                <Text ta="center" size="sm" c="dimmed">{t('ai.priority.avgProb')}</Text>
                <Text ta="center" fw={600} size="lg" c="green">
                  {Math.round(
                    priorityVisits.reduce((sum, v) => 
                      sum + (v.ai_purchase_probability || 0), 0
                    ) / priorityVisits.length * 100
                  )}%
                </Text>
              </Grid.Col>
              
              <Grid.Col span={3}>
                <Text ta="center" size="sm" c="dimmed">{t('ai.priority.avgPriority')}</Text>
                <Text ta="center" fw={600} size="lg" c="orange">
                  {(
                    priorityVisits.reduce((sum, v) => 
                      sum + (v.ai_priority_ranking || 5), 0
                    ) / priorityVisits.length
                  ).toFixed(1)}/10
                </Text>
              </Grid.Col>
              
              <Grid.Col span={3}>
                <Text ta="center" size="sm" c="dimmed">{t('ai.priority.critical')}</Text>
                <Text ta="center" fw={600} size="lg" c="red">
                  {priorityVisits.filter(v => (v.ai_priority_ranking || 0) >= 9).length}
                </Text>
              </Grid.Col>
              
              <Grid.Col span={3}>
                <Text ta="center" size="sm" c="dimmed">{t('ai.priority.hot')}</Text>
                <Text ta="center" fw={600} size="lg" c="orange">
                  {priorityVisits.filter(v => (v.ai_purchase_probability || 0) >= 0.8).length}
                </Text>
              </Grid.Col>
            </Grid>
          </Card>
        )}
      </Stack>
    </Card>
  )
}