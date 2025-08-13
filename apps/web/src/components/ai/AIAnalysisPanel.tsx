import React from 'react'
import {
  Card,
  Text,
  Badge,
  Group,
  Progress,
  Stack,
  Grid,
  ActionIcon,
  Tooltip,
  Alert,
  LoadingOverlay,
  ThemeIcon,
  List,
  Divider,
  Button,
  Box
} from '@mantine/core'
import {
  IconBrain,
  IconTrendingUp,
  IconAlertTriangle,
  IconBulb,
  IconClock,
  IconRefresh,
  IconHeart,
  IconTarget,
  IconMessageCircle
} from '@tabler/icons-react'
import { useAIAnalysis, useVisitWithAI } from '../../hooks/useAIAnalysis'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

interface AIAnalysisPanelProps {
  visitId: string
  showActions?: boolean
  compact?: boolean
}

export function AIAnalysisPanel({ visitId, showActions = true, compact = false }: AIAnalysisPanelProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const locale = isRTL ? ar : enUS
  
  const { data: visit, isLoading: visitLoading } = useVisitWithAI(visitId)
  const aiAnalysisMutation = useAIAnalysis()

  const aiAnalysis = visit?.ai_analysis
  const hasAnalysis = aiAnalysis && typeof aiAnalysis === 'object' && aiAnalysis.generated_at

  const handleReanalyze = async () => {
    if (!visit) return

    const requestData = {
      visit_id: visitId,
      customer_data: {
        name: visit.customers.name,
        phone: visit.customers.phone,
        language_preference: visit.customers.language_preference,
        visit_history: 1 // Would need to calculate actual history
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

  const getPriorityColor = (ranking: number) => {
    if (ranking >= 8) return 'red'
    if (ranking >= 6) return 'orange'
    if (ranking >= 4) return 'yellow'
    return 'blue'
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'green'
    if (score > -0.3) return 'yellow'
    return 'red'
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'green'
    if (probability >= 0.4) return 'yellow'
    return 'red'
  }

  if (visitLoading) {
    return (
      <Card withBorder>
        <LoadingOverlay visible />
        <Stack gap="md">
          <Text>{t('ai.loading')}</Text>
        </Stack>
      </Card>
    )
  }

  if (!visit) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={16} />}>
        {t('ai.visitNotFound')}
      </Alert>
    )
  }

  if (!hasAnalysis) {
    return (
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                <IconBrain size={14} />
              </ThemeIcon>
              <Text fw={500}>{t('ai.analysisTitle')}</Text>
            </Group>
            {showActions && (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconBrain size={14} />}
                loading={aiAnalysisMutation.isPending}
                onClick={handleReanalyze}
              >
                {t('ai.analyzeNow')}
              </Button>
            )}
          </Group>
          
          <Alert color="yellow" icon={<IconBulb size={16} />}>
            {t('ai.noAnalysisYet')}
          </Alert>
        </Stack>
      </Card>
    )
  }

  const analysis = aiAnalysis as any

  if (compact) {
    return (
      <Card withBorder size="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge 
              color={getProbabilityColor(analysis.purchase_probability)}
              variant="light"
              size="sm"
            >
              {Math.round(analysis.purchase_probability * 100)}% {t('ai.purchaseProb')}
            </Badge>
            <Badge 
              color={getPriorityColor(analysis.priority_ranking)}
              variant="light"
              size="sm"
            >
              {t('ai.priority')}: {analysis.priority_ranking}/10
            </Badge>
          </Group>
          {showActions && (
            <Tooltip label={t('ai.reanalyze')}>
              <ActionIcon
                size="sm"
                variant="light"
                loading={aiAnalysisMutation.isPending}
                onClick={handleReanalyze}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Card>
    )
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue">
              <IconBrain size={14} />
            </ThemeIcon>
            <Text fw={500}>{t('ai.analysisTitle')}</Text>
            <Badge size="xs" variant="light">
              {analysis.method === 'openai' ? 'GPT-4' : t('ai.fallback')}
            </Badge>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {formatDistanceToNow(new Date(analysis.generated_at), { 
                addSuffix: true, 
                locale 
              })}
            </Text>
            {showActions && (
              <Tooltip label={t('ai.reanalyze')}>
                <ActionIcon
                  size="sm"
                  variant="light"
                  loading={aiAnalysisMutation.isPending}
                  onClick={handleReanalyze}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Key Metrics */}
        <Grid>
          <Grid.Col span={4}>
            <Stack gap="xs" align="center">
              <ThemeIcon 
                size="lg" 
                variant="light" 
                color={getProbabilityColor(analysis.purchase_probability)}
              >
                <IconTarget size={20} />
              </ThemeIcon>
              <Text size="xs" ta="center" c="dimmed">
                {t('ai.purchaseProb')}
              </Text>
              <Text fw={700} size="lg">
                {Math.round(analysis.purchase_probability * 100)}%
              </Text>
              <Progress
                value={analysis.purchase_probability * 100}
                color={getProbabilityColor(analysis.purchase_probability)}
                size="sm"
                w="100%"
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap="xs" align="center">
              <ThemeIcon 
                size="lg" 
                variant="light" 
                color={getSentimentColor(analysis.sentiment_score)}
              >
                <IconHeart size={20} />
              </ThemeIcon>
              <Text size="xs" ta="center" c="dimmed">
                {t('ai.sentiment')}
              </Text>
              <Text fw={700} size="lg">
                {analysis.sentiment_score > 0 ? '+' : ''}{(analysis.sentiment_score * 100).toFixed(0)}
              </Text>
              <Progress
                value={((analysis.sentiment_score + 1) / 2) * 100}
                color={getSentimentColor(analysis.sentiment_score)}
                size="sm"
                w="100%"
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap="xs" align="center">
              <ThemeIcon 
                size="lg" 
                variant="light" 
                color={getPriorityColor(analysis.priority_ranking)}
              >
                <IconTrendingUp size={20} />
              </ThemeIcon>
              <Text size="xs" ta="center" c="dimmed">
                {t('ai.priority')}
              </Text>
              <Text fw={700} size="lg">
                {analysis.priority_ranking}/10
              </Text>
              <Progress
                value={(analysis.priority_ranking / 10) * 100}
                color={getPriorityColor(analysis.priority_ranking)}
                size="sm"
                w="100%"
              />
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Confidence Score */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">{t('ai.confidence')}</Text>
          <Group gap="xs">
            <Progress
              value={analysis.confidence_score * 100}
              color="blue"
              size="sm"
              w={100}
            />
            <Text size="sm" fw={500}>
              {Math.round(analysis.confidence_score * 100)}%
            </Text>
          </Group>
        </Group>

        <Divider />

        {/* Recommended Actions */}
        {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
          <Box>
            <Group gap="xs" mb="xs">
              <ThemeIcon size="sm" variant="light" color="green">
                <IconBulb size={14} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('ai.recommendedActions')}</Text>
            </Group>
            <List size="sm" spacing="xs">
              {analysis.recommended_actions.map((action: string, index: number) => (
                <List.Item key={index}>{action}</List.Item>
              ))}
            </List>
          </Box>
        )}

        {/* Concerns */}
        {analysis.concerns && analysis.concerns.length > 0 && (
          <Box>
            <Group gap="xs" mb="xs">
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconAlertTriangle size={14} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('ai.concerns')}</Text>
            </Group>
            <List size="sm" spacing="xs">
              {analysis.concerns.map((concern: string, index: number) => (
                <List.Item key={index}>{concern}</List.Item>
              ))}
            </List>
          </Box>
        )}

        {/* Opportunities */}
        {analysis.opportunities && analysis.opportunities.length > 0 && (
          <Box>
            <Group gap="xs" mb="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                <IconTrendingUp size={14} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('ai.opportunities')}</Text>
            </Group>
            <List size="sm" spacing="xs">
              {analysis.opportunities.map((opportunity: string, index: number) => (
                <List.Item key={index}>{opportunity}</List.Item>
              ))}
            </List>
          </Box>
        )}

        {/* Next Contact Timing */}
        {analysis.next_contact_timing && (
          <Alert color="blue" icon={<IconClock size={16} />}>
            <Text fw={500}>{t('ai.nextContact')}: {analysis.next_contact_timing}</Text>
          </Alert>
        )}

        {/* Cultural Considerations for Jordan */}
        {analysis.cultural_considerations && (
          <Alert color="grape" icon={<IconMessageCircle size={16} />}>
            <Text fw={500}>{t('ai.culturalConsiderations')}:</Text>
            <Text size="sm">{analysis.cultural_considerations}</Text>
          </Alert>
        )}

        {/* AI Reasoning */}
        {analysis.reasoning && (
          <Box>
            <Text fw={500} size="sm" mb="xs">{t('ai.reasoning')}:</Text>
            <Text size="sm" c="dimmed">{analysis.reasoning}</Text>
          </Box>
        )}
      </Stack>
    </Card>
  )
}