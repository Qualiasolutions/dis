import React, { useState } from 'react'
import {
  Container,
  Stack,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Grid,
  Divider,
  ActionIcon,
  Tooltip,
  Alert,
  LoadingOverlay,
  Box,
  Tabs
} from '@mantine/core'
import {
  IconArrowLeft,
  IconBrain,
  IconPhone,
  IconCar,
  IconCalendar,
  IconUser,
  IconNotes,
  IconRefresh,
  IconAlertTriangle
} from '@tabler/icons-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { useVisitWithAI } from '../hooks/useAIAnalysis'
import { AIAnalysisPanel } from '../components/ai'

export function VisitDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  
  const [activeTab, setActiveTab] = useState('details')
  const { data: visit, isLoading, error, refetch } = useVisitWithAI(id!)

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

  const formatPhoneJordan = (phone: string) => {
    if (phone.startsWith('07') && phone.length === 10) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
    }
    return phone
  }

  if (isLoading) {
    return (
      <Container size="lg">
        <LoadingOverlay visible />
        <Text>{t('common.loading')}</Text>
      </Container>
    )
  }

  if (error || !visit) {
    return (
      <Container size="lg">
        <Alert color="red" icon={<IconAlertTriangle size={16} />}>
          {t('visit.notFound')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="md">
            <Tooltip label={t('common.back')}>
              <ActionIcon 
                variant="light" 
                size="lg"
                onClick={() => navigate(-1)}
              >
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Box>
              <Text fw={700} size="xl">{visit.customers.name}</Text>
              <Group gap="xs">
                <Text c="dimmed" size="sm">
                  {t('visit.visitDetails')} • {formatDistanceToNow(new Date(visit.created_at), { addSuffix: true, locale })}
                </Text>
                <Badge 
                  color={getStatusColor(visit.status)}
                  variant="light"
                  size="sm"
                >
                  {t(`visit.status.${visit.status}`)}
                </Badge>
              </Group>
            </Box>
          </Group>

          <Group gap="xs">
            <Tooltip label={t('common.refresh')}>
              <ActionIcon variant="light" onClick={() => refetch()}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Button variant="light" leftSection={<IconPhone size={16} />}>
              {t('common.contact')}
            </Button>
          </Group>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="details" leftSection={<IconUser size={16} />}>
              {t('visit.details')}
            </Tabs.Tab>
            <Tabs.Tab value="ai-analysis" leftSection={<IconBrain size={16} />}>
              {t('ai.analysis')}
            </Tabs.Tab>
          </Tabs.List>

          {/* Visit Details Tab */}
          <Tabs.Panel value="details">
            <Grid mt="md">
              <Grid.Col span={8}>
                <Stack gap="md">
                  {/* Customer Information */}
                  <Card withBorder>
                    <Text fw={500} mb="md">{t('customer.information')}</Text>
                    <Grid>
                      <Grid.Col span={6}>
                        <Group gap="xs">
                          <IconUser size={16} />
                          <Box>
                            <Text size="xs" c="dimmed">{t('customer.name')}</Text>
                            <Text fw={500}>{visit.customers.name}</Text>
                          </Box>
                        </Group>
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Group gap="xs">
                          <IconPhone size={16} />
                          <Box>
                            <Text size="xs" c="dimmed">{t('customer.phone')}</Text>
                            <Text fw={500}>{formatPhoneJordan(visit.customers.phone)}</Text>
                          </Box>
                        </Group>
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Group gap="xs">
                          <IconCalendar size={16} />
                          <Box>
                            <Text size="xs" c="dimmed">{t('visit.visitDate')}</Text>
                            <Text fw={500}>
                              {new Date(visit.created_at).toLocaleDateString(isRTL ? 'ar-JO' : 'en-US')}
                            </Text>
                          </Box>
                        </Group>
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">{t('customer.language')}</Text>
                          <Badge 
                            size="sm" 
                            variant="light"
                            color={visit.customers.language_preference === 'ar' ? 'green' : 'blue'}
                          >
                            {visit.customers.language_preference === 'ar' ? 'العربية' : 'English'}
                          </Badge>
                        </Group>
                      </Grid.Col>
                    </Grid>
                  </Card>

                  {/* Vehicle Interest */}
                  {visit.vehicle_interest && (
                    <Card withBorder>
                      <Text fw={500} mb="md">{t('vehicle.interest')}</Text>
                      <Grid>
                        {visit.vehicle_interest.type && (
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.type')}</Text>
                              <Text fw={500}>{visit.vehicle_interest.type}</Text>
                            </Box>
                          </Grid.Col>
                        )}

                        {visit.vehicle_interest.brand && (
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.brand')}</Text>
                              <Text fw={500}>{visit.vehicle_interest.brand}</Text>
                            </Box>
                          </Grid.Col>
                        )}

                        {visit.vehicle_interest.model && (
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.model')}</Text>
                              <Text fw={500}>{visit.vehicle_interest.model}</Text>
                            </Box>
                          </Grid.Col>
                        )}

                        {visit.vehicle_interest.budget_range && (
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.budget')}</Text>
                              <Text fw={500}>{visit.vehicle_interest.budget_range} JOD</Text>
                            </Box>
                          </Grid.Col>
                        )}

                        {visit.vehicle_interest.purchase_timeline && (
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.timeline')}</Text>
                              <Text fw={500}>{visit.vehicle_interest.purchase_timeline}</Text>
                            </Box>
                          </Grid.Col>
                        )}

                        {visit.vehicle_interest.financing_preference && (
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.financing')}</Text>
                              <Text fw={500}>{visit.vehicle_interest.financing_preference}</Text>
                            </Box>
                          </Grid.Col>
                        )}

                        {visit.vehicle_interest.features && visit.vehicle_interest.features.length > 0 && (
                          <Grid.Col span={12}>
                            <Box>
                              <Text size="xs" c="dimmed">{t('vehicle.features')}</Text>
                              <Group gap="xs" mt="xs">
                                {visit.vehicle_interest.features.map((feature: string, index: number) => (
                                  <Badge key={index} size="sm" variant="light">
                                    {feature}
                                  </Badge>
                                ))}
                              </Group>
                            </Box>
                          </Grid.Col>
                        )}
                      </Grid>
                    </Card>
                  )}

                  {/* Visit Details */}
                  <Card withBorder>
                    <Text fw={500} mb="md">{t('visit.visitInfo')}</Text>
                    <Grid>
                      <Grid.Col span={6}>
                        <Box>
                          <Text size="xs" c="dimmed">{t('visit.consultant')}</Text>
                          <Text fw={500}>
                            {visit.consultants?.name || t('common.unassigned')}
                          </Text>
                        </Box>
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Box>
                          <Text size="xs" c="dimmed">{t('visit.source')}</Text>
                          <Text fw={500}>{visit.source || t('common.walkIn')}</Text>
                        </Box>
                      </Grid.Col>

                      {visit.visit_duration && (
                        <Grid.Col span={6}>
                          <Box>
                            <Text size="xs" c="dimmed">{t('visit.duration')}</Text>
                            <Text fw={500}>{visit.visit_duration} {t('common.minutes')}</Text>
                          </Box>
                        </Grid.Col>
                      )}

                      {visit.interaction_quality && (
                        <Grid.Col span={6}>
                          <Box>
                            <Text size="xs" c="dimmed">{t('visit.quality')}</Text>
                            <Text fw={500}>{visit.interaction_quality}</Text>
                          </Box>
                        </Grid.Col>
                      )}
                    </Grid>
                  </Card>

                  {/* Consultant Notes */}
                  {visit.consultant_notes && (
                    <Card withBorder>
                      <Group gap="xs" mb="md">
                        <IconNotes size={16} />
                        <Text fw={500}>{t('visit.consultantNotes')}</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {visit.consultant_notes}
                      </Text>
                    </Card>
                  )}
                </Stack>
              </Grid.Col>

              <Grid.Col span={4}>
                {/* AI Analysis Compact */}
                <AIAnalysisPanel visitId={visit.id} compact />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* AI Analysis Tab */}
          <Tabs.Panel value="ai-analysis">
            <Box mt="md">
              <AIAnalysisPanel visitId={visit.id} showActions />
            </Box>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}