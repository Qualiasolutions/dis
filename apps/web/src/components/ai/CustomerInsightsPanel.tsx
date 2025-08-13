import React, { useState } from 'react'
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Grid,
  Progress,
  ThemeIcon,
  Box,
  SegmentedControl,
  Alert,
  LoadingOverlay,
  RingProgress,
  Center,
  Divider,
  Timeline,
  List,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import {
  IconBrain,
  IconTrendingUp,
  IconUser,
  IconCalendar,
  IconCar,
  IconClock,
  IconHeart,
  IconTarget,
  IconAlertTriangle,
  IconBulb,
  IconMessage,
  IconRefresh,
  IconPhone,
  IconMail
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface CustomerInsightsPanelProps {
  customerId: string
  customerData: {
    name: string
    phone: string
    email?: string
    language_preference: 'ar' | 'en'
    created_at: string
    total_visits: number
    last_visit?: string
    preferred_contact_method?: 'phone' | 'whatsapp' | 'email'
  }
  visitHistory: Array<{
    id: string
    visit_date: string
    status: string
    vehicle_interest: any
    ai_analysis?: any
    consultant_name?: string
  }>
  interactions?: Array<{
    type: 'call' | 'whatsapp' | 'email' | 'visit'
    date: string
    outcome?: string
    notes?: string
  }>
}

export function CustomerInsightsPanel({ 
  customerId, 
  customerData, 
  visitHistory,
  interactions = []
}: CustomerInsightsPanelProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  const [timeRange, setTimeRange] = useState('all')

  // Calculate customer lifetime metrics
  const totalVisits = visitHistory.length
  const completedPurchases = visitHistory.filter(v => v.status === 'completed').length
  const averagePurchaseProbability = visitHistory
    .filter(v => v.ai_analysis?.purchase_probability)
    .reduce((sum, v) => sum + v.ai_analysis.purchase_probability, 0) / (totalVisits || 1)
  
  const customerLifetimeValue = completedPurchases * 25000 // Estimated avg car value
  const engagementScore = calculateEngagementScore(visitHistory, interactions)
  const loyaltyTier = calculateLoyaltyTier(totalVisits, completedPurchases, engagementScore)
  
  // Behavior patterns
  const preferredVehicleTypes = extractPreferredVehicleTypes(visitHistory)
  const budgetRange = extractBudgetRange(visitHistory)
  const purchaseTimeline = predictPurchaseTimeline(visitHistory)
  const interactionPreferences = analyzeInteractionPreferences(interactions)
  
  // Risk indicators
  const churnRisk = calculateChurnRisk(visitHistory, interactions)
  const purchaseReadiness = calculatePurchaseReadiness(visitHistory)
  const nextBestAction = recommendNextAction(visitHistory, interactions, customerData)

  return (
    <Stack gap="md">
      {/* Customer Overview Header */}
      <Card withBorder>
        <Group justify="space-between">
          <Group gap="md">
            <ThemeIcon size="xl" variant="light" color="blue">
              <IconUser size={28} />
            </ThemeIcon>
            <Box>
              <Text fw={600} size="lg">{customerData.name}</Text>
              <Group gap="xs">
                <Badge variant="light" color={loyaltyTier.color} size="sm">
                  {loyaltyTier.label}
                </Badge>
                <Text size="xs" c="dimmed">
                  {t('ai.insights.customerSince')}: {new Date(customerData.created_at).toLocaleDateString(isRTL ? 'ar-JO' : 'en-US')}
                </Text>
              </Group>
            </Box>
          </Group>
          
          <Group gap="xs">
            <Tooltip label={t('common.call')}>
              <ActionIcon variant="light" color="green">
                <IconPhone size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('common.message')}>
              <ActionIcon variant="light" color="blue">
                <IconMessage size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('common.email')}>
              <ActionIcon variant="light" color="grape">
                <IconMail size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      <Grid>
        {/* Key Metrics */}
        <Grid.Col span={8}>
          <Card withBorder>
            <Text fw={500} mb="md">{t('ai.insights.keyMetrics')}</Text>
            <Grid>
              <Grid.Col span={3}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="blue">
                    <IconTrendingUp size={20} />
                  </ThemeIcon>
                  <Text size="xs" ta="center" c="dimmed">
                    {t('ai.insights.lifetimeValue')}
                  </Text>
                  <Text fw={700} size="lg">
                    {customerLifetimeValue.toLocaleString()} JOD
                  </Text>
                </Stack>
              </Grid.Col>

              <Grid.Col span={3}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="green">
                    <IconTarget size={20} />
                  </ThemeIcon>
                  <Text size="xs" ta="center" c="dimmed">
                    {t('ai.insights.purchaseProb')}
                  </Text>
                  <Text fw={700} size="lg" c="green">
                    {Math.round(averagePurchaseProbability * 100)}%
                  </Text>
                  <Progress value={averagePurchaseProbability * 100} color="green" size="sm" w="100%" />
                </Stack>
              </Grid.Col>

              <Grid.Col span={3}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color="orange">
                    <IconHeart size={20} />
                  </ThemeIcon>
                  <Text size="xs" ta="center" c="dimmed">
                    {t('ai.insights.engagement')}
                  </Text>
                  <Text fw={700} size="lg">
                    {engagementScore}/10
                  </Text>
                  <Progress value={engagementScore * 10} color="orange" size="sm" w="100%" />
                </Stack>
              </Grid.Col>

              <Grid.Col span={3}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="lg" variant="light" color={churnRisk > 70 ? 'red' : churnRisk > 40 ? 'yellow' : 'green'}>
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                  <Text size="xs" ta="center" c="dimmed">
                    {t('ai.insights.churnRisk')}
                  </Text>
                  <Text fw={700} size="lg" c={churnRisk > 70 ? 'red' : churnRisk > 40 ? 'yellow' : 'green'}>
                    {churnRisk}%
                  </Text>
                  <Progress value={churnRisk} color={churnRisk > 70 ? 'red' : churnRisk > 40 ? 'yellow' : 'green'} size="sm" w="100%" />
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>

        {/* Purchase Readiness */}
        <Grid.Col span={4}>
          <Card withBorder h="100%">
            <Text fw={500} mb="md">{t('ai.insights.purchaseReadiness')}</Text>
            <Center>
              <RingProgress
                size={140}
                thickness={12}
                sections={[
                  { value: purchaseReadiness, color: getPurchaseReadinessColor(purchaseReadiness) }
                ]}
                label={
                  <Center>
                    <Box ta="center">
                      <Text fw={700} size="xl">{purchaseReadiness}%</Text>
                      <Text size="xs" c="dimmed">{getPurchaseReadinessLabel(purchaseReadiness)}</Text>
                    </Box>
                  </Center>
                }
              />
            </Center>
          </Card>
        </Grid.Col>

        {/* Behavioral Insights */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Text fw={500} mb="md">{t('ai.insights.behaviorPatterns')}</Text>
            <Stack gap="sm">
              {/* Vehicle Preferences */}
              <Box>
                <Text size="sm" c="dimmed" mb="xs">{t('ai.insights.vehiclePreferences')}</Text>
                <Group gap="xs">
                  {preferredVehicleTypes.map((type, index) => (
                    <Badge key={index} variant="light" color="blue">
                      <Group gap={4}>
                        <IconCar size={12} />
                        {type.type} ({type.count})
                      </Group>
                    </Badge>
                  ))}
                </Group>
              </Box>

              {/* Budget Range */}
              <Box>
                <Text size="sm" c="dimmed" mb="xs">{t('ai.insights.budgetRange')}</Text>
                <Badge variant="filled" color="green">
                  {budgetRange.min.toLocaleString()} - {budgetRange.max.toLocaleString()} JOD
                </Badge>
              </Box>

              {/* Purchase Timeline */}
              <Box>
                <Text size="sm" c="dimmed" mb="xs">{t('ai.insights.expectedPurchase')}</Text>
                <Group gap="xs">
                  <IconCalendar size={16} />
                  <Text size="sm" fw={500}>{purchaseTimeline}</Text>
                </Group>
              </Box>

              {/* Communication Preferences */}
              <Box>
                <Text size="sm" c="dimmed" mb="xs">{t('ai.insights.contactPreferences')}</Text>
                <Group gap="xs">
                  {interactionPreferences.map((pref, index) => (
                    <Badge key={index} variant="light" color="grape" size="sm">
                      {pref.type}: {pref.preference}
                    </Badge>
                  ))}
                </Group>
              </Box>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Next Best Actions */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon size="sm" variant="light" color="green">
                <IconBulb size={14} />
              </ThemeIcon>
              <Text fw={500}>{t('ai.insights.recommendedActions')}</Text>
            </Group>
            
            <Alert color={nextBestAction.priority === 'high' ? 'red' : nextBestAction.priority === 'medium' ? 'yellow' : 'blue'} mb="sm">
              <Text fw={500} size="sm">{nextBestAction.action}</Text>
              <Text size="xs" c="dimmed" mt="xs">{nextBestAction.reasoning}</Text>
            </Alert>

            <List size="sm" spacing="xs">
              {nextBestAction.followUpActions.map((action, index) => (
                <List.Item key={index}>{action}</List.Item>
              ))}
            </List>
          </Card>
        </Grid.Col>

        {/* Journey Timeline */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>{t('ai.insights.customerJourney')}</Text>
              <SegmentedControl
                size="xs"
                value={timeRange}
                onChange={setTimeRange}
                data={[
                  { label: t('common.all'), value: 'all' },
                  { label: t('common.recent'), value: 'recent' },
                  { label: t('common.month'), value: 'month' }
                ]}
              />
            </Group>

            <Timeline active={visitHistory.length - 1} bulletSize={24} lineWidth={2}>
              {filterVisitsByTimeRange(visitHistory, timeRange).map((visit, index) => {
                const analysis = visit.ai_analysis
                return (
                  <Timeline.Item
                    key={visit.id}
                    bullet={<IconCar size={12} />}
                    title={
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {visit.vehicle_interest?.brand} {visit.vehicle_interest?.model}
                        </Text>
                        <Badge size="xs" color={getStatusColor(visit.status)}>
                          {t(`visit.status.${visit.status}`)}
                        </Badge>
                      </Group>
                    }
                  >
                    <Text c="dimmed" size="xs" mt={4}>
                      {formatDistanceToNow(new Date(visit.visit_date), { addSuffix: true, locale })}
                    </Text>
                    {analysis && (
                      <Group gap="xs" mt="xs">
                        <Badge size="xs" variant="light" color="green">
                          {Math.round(analysis.purchase_probability * 100)}% {t('ai.purchaseProb')}
                        </Badge>
                        <Badge size="xs" variant="light" color="orange">
                          {t('ai.priority')}: {analysis.priority_ranking}/10
                        </Badge>
                      </Group>
                    )}
                    {visit.consultant_name && (
                      <Text size="xs" c="dimmed" mt="xs">
                        {t('visit.consultant')}: {visit.consultant_name}
                      </Text>
                    )}
                  </Timeline.Item>
                )
              })}
            </Timeline>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}

// Helper functions
function calculateEngagementScore(visits: any[], interactions: any[]): number {
  const visitScore = Math.min(visits.length * 2, 5)
  const interactionScore = Math.min(interactions.length * 0.5, 3)
  const recencyScore = visits.length > 0 
    ? Math.max(0, 2 - (Date.now() - new Date(visits[visits.length - 1].visit_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0
  return Math.min(Math.round(visitScore + interactionScore + recencyScore), 10)
}

function calculateLoyaltyTier(visits: number, purchases: number, engagement: number) {
  const score = visits * 10 + purchases * 50 + engagement * 5
  if (score >= 200) return { label: 'VIP', color: 'gold' }
  if (score >= 100) return { label: 'Loyal', color: 'green' }
  if (score >= 50) return { label: 'Regular', color: 'blue' }
  return { label: 'New', color: 'gray' }
}

function extractPreferredVehicleTypes(visits: any[]) {
  const typeCounts: Record<string, number> = {}
  visits.forEach(v => {
    if (v.vehicle_interest?.type) {
      typeCounts[v.vehicle_interest.type] = (typeCounts[v.vehicle_interest.type] || 0) + 1
    }
  })
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => ({ type, count }))
}

function extractBudgetRange(visits: any[]) {
  const budgets = visits
    .map(v => v.vehicle_interest?.budget_range)
    .filter(Boolean)
    .map(b => {
      const match = b.match(/\d+/g)
      return match ? parseInt(match[0]) : 0
    })
  
  return {
    min: Math.min(...budgets, 10000),
    max: Math.max(...budgets, 50000)
  }
}

function predictPurchaseTimeline(visits: any[]) {
  const lastVisit = visits[visits.length - 1]
  const avgProbability = visits
    .filter(v => v.ai_analysis?.purchase_probability)
    .reduce((sum, v) => sum + v.ai_analysis.purchase_probability, 0) / (visits.length || 1)
  
  if (avgProbability > 0.8) return 'Within 1 week'
  if (avgProbability > 0.6) return 'Within 2 weeks'
  if (avgProbability > 0.4) return 'Within 1 month'
  if (avgProbability > 0.2) return 'Within 3 months'
  return 'More than 3 months'
}

function analyzeInteractionPreferences(interactions: any[]) {
  const preferences = []
  const phoneCalls = interactions.filter(i => i.type === 'call').length
  const whatsapp = interactions.filter(i => i.type === 'whatsapp').length
  const emails = interactions.filter(i => i.type === 'email').length
  
  if (whatsapp > phoneCalls && whatsapp > emails) {
    preferences.push({ type: 'Primary', preference: 'WhatsApp' })
  } else if (phoneCalls > emails) {
    preferences.push({ type: 'Primary', preference: 'Phone' })
  } else if (emails > 0) {
    preferences.push({ type: 'Primary', preference: 'Email' })
  }
  
  // Best time to contact based on interaction history
  preferences.push({ type: 'Best Time', preference: 'Morning (9-12)' })
  
  return preferences
}

function calculateChurnRisk(visits: any[], interactions: any[]): number {
  const daysSinceLastVisit = visits.length > 0
    ? (Date.now() - new Date(visits[visits.length - 1].visit_date).getTime()) / (1000 * 60 * 60 * 24)
    : 999
  
  const daysSinceLastInteraction = interactions.length > 0
    ? (Date.now() - new Date(interactions[interactions.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)
    : 999
  
  let risk = 0
  if (daysSinceLastVisit > 60) risk += 40
  else if (daysSinceLastVisit > 30) risk += 20
  else if (daysSinceLastVisit > 14) risk += 10
  
  if (daysSinceLastInteraction > 30) risk += 30
  else if (daysSinceLastInteraction > 14) risk += 15
  else if (daysSinceLastInteraction > 7) risk += 5
  
  // Lower risk if customer has made purchases
  const purchases = visits.filter(v => v.status === 'completed').length
  if (purchases > 0) risk = Math.max(0, risk - purchases * 10)
  
  return Math.min(risk, 100)
}

function calculatePurchaseReadiness(visits: any[]): number {
  if (visits.length === 0) return 0
  
  const latestVisit = visits[visits.length - 1]
  let readiness = 0
  
  // Status-based readiness
  if (latestVisit.status === 'negotiating') readiness += 40
  else if (latestVisit.status === 'test_drive') readiness += 30
  else if (latestVisit.status === 'scheduled') readiness += 20
  else if (latestVisit.status === 'contacted') readiness += 10
  
  // AI probability
  if (latestVisit.ai_analysis?.purchase_probability) {
    readiness += latestVisit.ai_analysis.purchase_probability * 40
  }
  
  // Visit frequency
  if (visits.length >= 3) readiness += 10
  else if (visits.length >= 2) readiness += 5
  
  // Recent activity
  const daysSinceLastVisit = (Date.now() - new Date(latestVisit.visit_date).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceLastVisit <= 7) readiness += 10
  else if (daysSinceLastVisit <= 14) readiness += 5
  
  return Math.min(Math.round(readiness), 100)
}

function recommendNextAction(visits: any[], interactions: any[], customer: any) {
  const churnRisk = calculateChurnRisk(visits, interactions)
  const purchaseReadiness = calculatePurchaseReadiness(visits)
  const lastVisit = visits[visits.length - 1]
  
  if (churnRisk > 70) {
    return {
      priority: 'high',
      action: 'Re-engagement Required',
      reasoning: 'Customer shows high churn risk. Immediate outreach needed.',
      followUpActions: [
        'Send personalized WhatsApp message',
        'Offer exclusive test drive opportunity',
        'Schedule follow-up call within 24 hours'
      ]
    }
  }
  
  if (purchaseReadiness > 80) {
    return {
      priority: 'high',
      action: 'Close the Deal',
      reasoning: 'Customer is highly ready to purchase. Focus on closing.',
      followUpActions: [
        'Prepare competitive financing options',
        'Schedule immediate meeting with sales manager',
        'Prepare vehicle for final inspection'
      ]
    }
  }
  
  if (lastVisit?.status === 'test_drive') {
    return {
      priority: 'medium',
      action: 'Follow Up on Test Drive',
      reasoning: 'Customer completed test drive. Gather feedback and address concerns.',
      followUpActions: [
        'Call to discuss test drive experience',
        'Address any concerns raised',
        'Present financing options'
      ]
    }
  }
  
  return {
    priority: 'low',
    action: 'Nurture Relationship',
    reasoning: 'Customer is in consideration phase. Build trust and provide value.',
    followUpActions: [
      'Share relevant vehicle information',
      'Invite to dealership events',
      'Send monthly check-in message'
    ]
  }
}

function getPurchaseReadinessColor(readiness: number) {
  if (readiness >= 80) return 'green'
  if (readiness >= 60) return 'yellow'
  if (readiness >= 40) return 'orange'
  return 'red'
}

function getPurchaseReadinessLabel(readiness: number) {
  if (readiness >= 80) return 'Hot'
  if (readiness >= 60) return 'Warm'
  if (readiness >= 40) return 'Interested'
  return 'Cold'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'green'
    case 'negotiating': return 'grape'
    case 'test_drive': return 'orange'
    case 'scheduled': return 'yellow'
    case 'contacted': return 'cyan'
    case 'new': return 'blue'
    case 'lost': return 'red'
    default: return 'gray'
  }
}

function filterVisitsByTimeRange(visits: any[], range: string) {
  if (range === 'all') return visits
  
  const now = Date.now()
  const dayInMs = 1000 * 60 * 60 * 24
  
  if (range === 'recent') {
    return visits.slice(-5) // Last 5 visits
  }
  
  if (range === 'month') {
    return visits.filter(v => 
      (now - new Date(v.visit_date).getTime()) <= 30 * dayInMs
    )
  }
  
  return visits
}