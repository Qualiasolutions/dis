import React, { useState } from 'react'
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Grid,
  Select,
  LoadingOverlay,
  Alert,
  Progress,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Box,
  Divider,
  RingProgress,
  Center
} from '@mantine/core'
import {
  IconBrain,
  IconChartLine,
  IconClock,
  IconTarget,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { useAIPerformanceMetrics, useAIPredictionAccuracy } from '../../hooks/useAIAnalysis'
import { useTranslation } from 'react-i18next'

const COLORS = ['#228be6', '#40c057', '#fd7e14', '#fa5252', '#be4bdb']

export function AIPerformanceMetrics() {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [accuracyRange, setAccuracyRange] = useState<'week' | 'month' | 'quarter'>('month')
  
  const { data: performanceData, isLoading: perfLoading, refetch: refetchPerf } = useAIPerformanceMetrics(timeRange)
  const { data: accuracyData, isLoading: accLoading, refetch: refetchAcc } = useAIPredictionAccuracy(accuracyRange)

  const chartData = performanceData?.map(item => ({
    date: new Date(item.analysis_date).toLocaleDateString(),
    success_rate: item.success_rate,
    avg_processing_time: item.avg_processing_time_ms,
    total_analyses: item.total_analyses,
    openai: item.method === 'openai' ? item.total_analyses : 0,
    fallback: item.method === 'fallback' ? item.total_analyses : 0,
    avg_confidence: item.avg_confidence_score * 100
  })) || []

  const accuracyChartData = accuracyData?.map(item => ({
    week: new Date(item.prediction_week).toLocaleDateString(),
    accuracy: item.avg_accuracy * 100,
    precision: item.precision_high_probability,
    recall: item.recall_rate,
    total_predictions: item.total_predictions,
    completed_predictions: item.completed_predictions,
    avg_confidence: item.avg_confidence * 100
  })) || []

  // Calculate summary statistics
  const totalAnalyses = performanceData?.reduce((sum, item) => sum + item.total_analyses, 0) || 0
  const avgSuccessRate = performanceData?.length > 0 
    ? performanceData.reduce((sum, item) => sum + item.success_rate, 0) / performanceData.length 
    : 0
  const avgProcessingTime = performanceData?.length > 0
    ? performanceData.reduce((sum, item) => sum + item.avg_processing_time_ms, 0) / performanceData.length
    : 0
  const avgConfidence = performanceData?.length > 0
    ? performanceData.reduce((sum, item) => sum + item.avg_confidence_score, 0) / performanceData.length * 100
    : 0

  const openAIUsage = performanceData?.filter(item => item.method === 'openai')
    .reduce((sum, item) => sum + item.total_analyses, 0) || 0
  const fallbackUsage = performanceData?.filter(item => item.method === 'fallback')
    .reduce((sum, item) => sum + item.total_analyses, 0) || 0

  const avgAccuracy = accuracyData?.length > 0
    ? accuracyData.reduce((sum, item) => sum + (item.avg_accuracy || 0), 0) / accuracyData.length * 100
    : 0
  const avgPrecision = accuracyData?.length > 0
    ? accuracyData.reduce((sum, item) => sum + (item.precision_high_probability || 0), 0) / accuracyData.length
    : 0
  const avgRecall = accuracyData?.length > 0
    ? accuracyData.reduce((sum, item) => sum + (item.recall_rate || 0), 0) / accuracyData.length
    : 0

  const isLoading = perfLoading || accLoading

  return (
    <Stack gap="md">
      {/* Header */}
      <Card withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue">
              <IconBrain size={16} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('ai.performance.title')}</Text>
          </Group>
          
          <Group gap="xs">
            <Select
              size="xs"
              value={timeRange}
              onChange={(value) => setTimeRange(value as any)}
              data={[
                { value: 'day', label: t('common.today') },
                { value: 'week', label: t('common.week') },
                { value: 'month', label: t('common.month') }
              ]}
              w={100}
            />
            <Tooltip label={t('common.refresh')}>
              <ActionIcon size="sm" variant="light" onClick={() => { refetchPerf(); refetchAcc(); }}>
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      <Grid>
        {/* Performance Summary Cards */}
        <Grid.Col span={12}>
          <Grid>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed">{t('ai.performance.totalAnalyses')}</Text>
                    <Text fw={700} size="xl">{totalAnalyses.toLocaleString()}</Text>
                    <Group gap="xs" mt="xs">
                      <Badge size="xs" color="blue" variant="light">
                        GPT-4: {openAIUsage}
                      </Badge>
                      <Badge size="xs" color="orange" variant="light">
                        {t('ai.fallback')}: {fallbackUsage}
                      </Badge>
                    </Group>
                  </Box>
                  <ThemeIcon size="lg" variant="light" color="blue">
                    <IconChartLine size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed">{t('ai.performance.successRate')}</Text>
                    <Text fw={700} size="xl" c={avgSuccessRate >= 95 ? 'green' : avgSuccessRate >= 90 ? 'yellow' : 'red'}>
                      {avgSuccessRate.toFixed(1)}%
                    </Text>
                    <Progress 
                      value={avgSuccessRate} 
                      color={avgSuccessRate >= 95 ? 'green' : avgSuccessRate >= 90 ? 'yellow' : 'red'} 
                      size="sm" 
                      mt="xs" 
                    />
                  </Box>
                  <ThemeIcon 
                    size="lg" 
                    variant="light" 
                    color={avgSuccessRate >= 95 ? 'green' : avgSuccessRate >= 90 ? 'yellow' : 'red'}
                  >
                    {avgSuccessRate >= 95 ? <IconCheck size={24} /> : <IconX size={24} />}
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed">{t('ai.performance.avgTime')}</Text>
                    <Text fw={700} size="xl" c={avgProcessingTime <= 2000 ? 'green' : avgProcessingTime <= 5000 ? 'yellow' : 'red'}>
                      {(avgProcessingTime / 1000).toFixed(1)}s
                    </Text>
                    <Text size="xs" c="dimmed">
                      {avgProcessingTime.toFixed(0)}ms
                    </Text>
                  </Box>
                  <ThemeIcon 
                    size="lg" 
                    variant="light" 
                    color={avgProcessingTime <= 2000 ? 'green' : avgProcessingTime <= 5000 ? 'yellow' : 'red'}
                  >
                    <IconClock size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={3}>
              <Card withBorder>
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed">{t('ai.performance.avgConfidence')}</Text>
                    <Text fw={700} size="xl" c={avgConfidence >= 80 ? 'green' : avgConfidence >= 60 ? 'yellow' : 'red'}>
                      {avgConfidence.toFixed(1)}%
                    </Text>
                    <Progress 
                      value={avgConfidence} 
                      color={avgConfidence >= 80 ? 'green' : avgConfidence >= 60 ? 'yellow' : 'red'} 
                      size="sm" 
                      mt="xs" 
                    />
                  </Box>
                  <ThemeIcon 
                    size="lg" 
                    variant="light" 
                    color={avgConfidence >= 80 ? 'green' : avgConfidence >= 60 ? 'yellow' : 'red'}
                  >
                    <IconTarget size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Grid.Col>

        {/* Performance Charts */}
        <Grid.Col span={8}>
          <Card withBorder h={350}>
            <LoadingOverlay visible={isLoading} />
            <Stack gap="sm">
              <Text fw={500}>{t('ai.performance.trendsTitle')}</Text>
              
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Line 
                      type="monotone" 
                      dataKey="success_rate" 
                      stroke="#228be6" 
                      strokeWidth={2}
                      name={t('ai.performance.successRate')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_confidence" 
                      stroke="#40c057" 
                      strokeWidth={2}
                      name={t('ai.performance.confidence')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Alert icon={<IconAlertTriangle size={16} />}>
                  {t('ai.performance.noData')}
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Method Usage Distribution */}
        <Grid.Col span={4}>
          <Card withBorder h={350}>
            <Stack gap="sm">
              <Text fw={500}>{t('ai.performance.methodUsage')}</Text>
              
              <Center>
                <RingProgress
                  size={200}
                  thickness={20}
                  sections={[
                    { 
                      value: totalAnalyses > 0 ? (openAIUsage / totalAnalyses) * 100 : 0, 
                      color: 'blue', 
                      tooltip: `GPT-4: ${openAIUsage}` 
                    },
                    { 
                      value: totalAnalyses > 0 ? (fallbackUsage / totalAnalyses) * 100 : 0, 
                      color: 'orange', 
                      tooltip: `${t('ai.fallback')}: ${fallbackUsage}` 
                    }
                  ]}
                  label={
                    <Text ta="center" fw={700}>
                      {totalAnalyses.toLocaleString()}
                      <br />
                      <Text size="xs" c="dimmed">{t('ai.performance.total')}</Text>
                    </Text>
                  }
                />
              </Center>

              <Group justify="center" gap="xl">
                <Group gap="xs">
                  <Box w={12} h={12} bg="blue" style={{ borderRadius: 2 }} />
                  <Text size="sm">GPT-4 ({Math.round(totalAnalyses > 0 ? (openAIUsage / totalAnalyses) * 100 : 0)}%)</Text>
                </Group>
                <Group gap="xs">
                  <Box w={12} h={12} bg="orange" style={{ borderRadius: 2 }} />
                  <Text size="sm">{t('ai.fallback')} ({Math.round(totalAnalyses > 0 ? (fallbackUsage / totalAnalyses) * 100 : 0)}%)</Text>
                </Group>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Prediction Accuracy */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>{t('ai.performance.accuracy.title')}</Text>
                <Select
                  size="xs"
                  value={accuracyRange}
                  onChange={(value) => setAccuracyRange(value as any)}
                  data={[
                    { value: 'week', label: t('common.week') },
                    { value: 'month', label: t('common.month') },
                    { value: 'quarter', label: t('common.quarter') }
                  ]}
                  w={100}
                />
              </Group>

              {/* Accuracy Summary */}
              <Grid>
                <Grid.Col span={3}>
                  <Card withBorder bg="gray.0">
                    <Text ta="center" size="sm" c="dimmed">{t('ai.performance.accuracy.overall')}</Text>
                    <Text ta="center" fw={700} size="xl" c={avgAccuracy >= 70 ? 'green' : avgAccuracy >= 50 ? 'yellow' : 'red'}>
                      {avgAccuracy.toFixed(1)}%
                    </Text>
                  </Card>
                </Grid.Col>

                <Grid.Col span={3}>
                  <Card withBorder bg="gray.0">
                    <Text ta="center" size="sm" c="dimmed">{t('ai.performance.accuracy.precision')}</Text>
                    <Text ta="center" fw={700} size="xl" c={avgPrecision >= 70 ? 'green' : avgPrecision >= 50 ? 'yellow' : 'red'}>
                      {avgPrecision.toFixed(1)}%
                    </Text>
                  </Card>
                </Grid.Col>

                <Grid.Col span={3}>
                  <Card withBorder bg="gray.0">
                    <Text ta="center" size="sm" c="dimmed">{t('ai.performance.accuracy.recall')}</Text>
                    <Text ta="center" fw={700} size="xl" c={avgRecall >= 70 ? 'green' : avgRecall >= 50 ? 'yellow' : 'red'}>
                      {avgRecall.toFixed(1)}%
                    </Text>
                  </Card>
                </Grid.Col>

                <Grid.Col span={3}>
                  <Card withBorder bg="gray.0">
                    <Text ta="center" size="sm" c="dimmed">{t('ai.performance.accuracy.predictions')}</Text>
                    <Text ta="center" fw={700} size="xl">
                      {accuracyData?.reduce((sum, item) => sum + item.total_predictions, 0) || 0}
                    </Text>
                  </Card>
                </Grid.Col>
              </Grid>

              {/* Accuracy Chart */}
              {accuracyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={accuracyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Area 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#228be6" 
                      fill="#228be6" 
                      fillOpacity={0.3}
                      name={t('ai.performance.accuracy.overall')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="precision" 
                      stroke="#40c057" 
                      fill="#40c057" 
                      fillOpacity={0.3}
                      name={t('ai.performance.accuracy.precision')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recall" 
                      stroke="#fd7e14" 
                      fill="#fd7e14" 
                      fillOpacity={0.3}
                      name={t('ai.performance.accuracy.recall')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Alert icon={<IconAlertTriangle size={16} />}>
                  {t('ai.performance.accuracy.noData')}
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}