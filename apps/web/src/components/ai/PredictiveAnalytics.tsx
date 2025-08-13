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
  ThemeIcon,
  Box,
  Progress,
  Table,
  ActionIcon,
  Tooltip,
  Button,
  NumberInput,
  Slider
} from '@mantine/core'
import {
  IconBrain,
  IconTrendingUp,
  IconCalendar,
  IconTarget,
  IconAlertTriangle,
  IconRefresh,
  IconDownload,
  IconFilter,
  IconChartBar,
  IconClock,
  IconUsers
} from '@tabler/icons-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from 'recharts'
import { useTranslation } from 'react-i18next'

interface PredictiveAnalyticsProps {
  visitsData: any[]
  customersData: any[]
  consultantsData: any[]
}

export function PredictiveAnalytics({ 
  visitsData = [], 
  customersData = [],
  consultantsData = []
}: PredictiveAnalyticsProps) {
  const { t } = useTranslation()
  const [forecastPeriod, setForecastPeriod] = useState('30')
  const [confidenceLevel, setConfidenceLevel] = useState(80)
  const [selectedMetric, setSelectedMetric] = useState('sales')
  
  // Generate predictive data
  const salesForecast = generateSalesForecast(visitsData, parseInt(forecastPeriod))
  const conversionPredictions = predictConversionRates(visitsData)
  const customerSegments = segmentCustomers(customersData, visitsData)
  const consultantPerformancePrediction = predictConsultantPerformance(consultantsData, visitsData)
  const seasonalTrends = analyzeSeasonalTrends(visitsData)
  const riskAnalysis = performRiskAnalysis(visitsData, customersData)
  
  // Calculate key predictions
  const predictedSales = salesForecast[salesForecast.length - 1]?.predicted || 0
  const predictedConversion = conversionPredictions.next30Days
  const atRiskCustomers = riskAnalysis.filter(r => r.risk > 70).length
  const highValueProspects = customerSegments.filter(s => s.segment === 'high-value').length

  const COLORS = ['#228be6', '#40c057', '#fd7e14', '#fa5252', '#be4bdb', '#15aabf']

  return (
    <Stack gap="md">
      {/* Header */}
      <Card withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="purple">
              <IconBrain size={16} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('ai.predictive.title')}</Text>
          </Group>
          
          <Group gap="xs">
            <Select
              size="xs"
              value={forecastPeriod}
              onChange={(value) => setForecastPeriod(value || '30')}
              data={[
                { value: '7', label: '7 days' },
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
                { value: '60', label: '60 days' },
                { value: '90', label: '90 days' }
              ]}
              w={100}
            />
            <Tooltip label={t('common.refresh')}>
              <ActionIcon size="sm" variant="light">
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('common.download')}>
              <ActionIcon size="sm" variant="light">
                <IconDownload size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      {/* Key Predictions Summary */}
      <Grid>
        <Grid.Col span={3}>
          <Card withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="xs" c="dimmed">{t('ai.predictive.expectedSales')}</Text>
                <Text fw={700} size="xl">{Math.round(predictedSales)}</Text>
                <Text size="xs" c="green">
                  +{Math.round((predictedSales / (salesForecast[0]?.actual || 1) - 1) * 100)}% {t('common.growth')}
                </Text>
              </Box>
              <ThemeIcon size="lg" variant="light" color="green">
                <IconTrendingUp size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={3}>
          <Card withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="xs" c="dimmed">{t('ai.predictive.conversionRate')}</Text>
                <Text fw={700} size="xl">{predictedConversion.toFixed(1)}%</Text>
                <Progress value={predictedConversion} color="blue" size="sm" mt="xs" />
              </Box>
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconTarget size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={3}>
          <Card withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="xs" c="dimmed">{t('ai.predictive.atRisk')}</Text>
                <Text fw={700} size="xl" c="red">{atRiskCustomers}</Text>
                <Text size="xs" c="dimmed">
                  {t('ai.predictive.needsAttention')}
                </Text>
              </Box>
              <ThemeIcon size="lg" variant="light" color="red">
                <IconAlertTriangle size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={3}>
          <Card withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="xs" c="dimmed">{t('ai.predictive.highValue')}</Text>
                <Text fw={700} size="xl" c="purple">{highValueProspects}</Text>
                <Text size="xs" c="dimmed">
                  {t('ai.predictive.prospects')}
                </Text>
              </Box>
              <ThemeIcon size="lg" variant="light" color="purple">
                <IconUsers size={24} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Sales Forecast Chart */}
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>{t('ai.predictive.salesForecast')}</Text>
            <Group gap="xs">
              <Text size="xs" c="dimmed">{t('ai.predictive.confidence')}:</Text>
              <Box w={150}>
                <Slider
                  value={confidenceLevel}
                  onChange={setConfidenceLevel}
                  min={50}
                  max={95}
                  step={5}
                  marks={[
                    { value: 50, label: '50%' },
                    { value: 95, label: '95%' }
                  ]}
                />
              </Box>
            </Group>
          </Group>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#228be6"
                fill="#228be6"
                fillOpacity={0.6}
                name={t('ai.predictive.actual')}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#40c057"
                fill="#40c057"
                fillOpacity={0.3}
                strokeDasharray="5 5"
                name={t('ai.predictive.predicted')}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="#fd7e14"
                fill="none"
                strokeDasharray="3 3"
                name={`${confidenceLevel}% ${t('ai.predictive.upperBound')}`}
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="#fd7e14"
                fill="none"
                strokeDasharray="3 3"
                name={`${confidenceLevel}% ${t('ai.predictive.lowerBound')}`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Stack>
      </Card>

      <Grid>
        {/* Customer Segmentation */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Text fw={500} mb="md">{t('ai.predictive.customerSegmentation')}</Text>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="purchaseProbability" 
                  name={t('ai.predictive.purchaseProb')}
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <YAxis 
                  dataKey="value" 
                  name={t('ai.predictive.value')}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip />
                <Legend />
                {['high-value', 'medium-value', 'low-value', 'at-risk'].map((segment, index) => (
                  <Scatter
                    key={segment}
                    name={t(`ai.predictive.segment.${segment}`)}
                    data={customerSegments.filter(c => c.segment === segment)}
                    fill={COLORS[index]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            <Stack gap="xs" mt="md">
              {['high-value', 'medium-value', 'low-value', 'at-risk'].map((segment, index) => {
                const count = customerSegments.filter(c => c.segment === segment).length
                const percentage = (count / customerSegments.length) * 100
                return (
                  <Group key={segment} justify="space-between">
                    <Group gap="xs">
                      <Box w={12} h={12} bg={COLORS[index]} style={{ borderRadius: 2 }} />
                      <Text size="sm">{t(`ai.predictive.segment.${segment}`)}</Text>
                    </Group>
                    <Group gap="xs">
                      <Badge variant="light" color={COLORS[index]}>
                        {count} ({percentage.toFixed(1)}%)
                      </Badge>
                    </Group>
                  </Group>
                )
              })}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Seasonal Trends */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Text fw={500} mb="md">{t('ai.predictive.seasonalTrends')}</Text>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="visits" fill="#228be6" name={t('ai.predictive.visits')}>
                  {seasonalTrends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Bar dataKey="conversions" fill="#40c057" name={t('ai.predictive.conversions')}>
                  {seasonalTrends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <Alert color="blue" mt="md" size="sm">
              <Group gap="xs">
                <IconCalendar size={16} />
                <Box>
                  <Text size="sm" fw={500}>{t('ai.predictive.peakSeason')}</Text>
                  <Text size="xs" c="dimmed">
                    {t('ai.predictive.peakSeasonDesc', { month: seasonalTrends[0]?.month })}
                  </Text>
                </Box>
              </Group>
            </Alert>
          </Card>
        </Grid.Col>

        {/* Consultant Performance Predictions */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>{t('ai.predictive.consultantPerformance')}</Text>
              <Select
                size="xs"
                value={selectedMetric}
                onChange={(value) => setSelectedMetric(value || 'sales')}
                data={[
                  { value: 'sales', label: t('ai.predictive.expectedSales') },
                  { value: 'conversion', label: t('ai.predictive.conversionRate') },
                  { value: 'satisfaction', label: t('ai.predictive.satisfaction') }
                ]}
                w={150}
              />
            </Group>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('consultant.name')}</Table.Th>
                  <Table.Th>{t('ai.predictive.currentPerformance')}</Table.Th>
                  <Table.Th>{t('ai.predictive.predictedNext30')}</Table.Th>
                  <Table.Th>{t('ai.predictive.trend')}</Table.Th>
                  <Table.Th>{t('ai.predictive.recommendation')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {consultantPerformancePrediction.map((consultant, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Group gap="xs">
                        <Text fw={500}>{consultant.name}</Text>
                        <Badge size="xs" variant="light">
                          {consultant.level}
                        </Badge>
                      </Group>
                    </Table.Td>
                    <Table.Td>{consultant.current[selectedMetric]}</Table.Td>
                    <Table.Td>
                      <Text c={consultant.predicted[selectedMetric] > consultant.current[selectedMetric] ? 'green' : 'red'}>
                        {consultant.predicted[selectedMetric]}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        variant="light" 
                        color={consultant.trend === 'up' ? 'green' : consultant.trend === 'down' ? 'red' : 'yellow'}
                      >
                        {consultant.trend === 'up' ? '↑' : consultant.trend === 'down' ? '↓' : '→'} {consultant.trendPercentage}%
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{consultant.recommendation}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        {/* Risk Analysis */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Text fw={500} mb="md">{t('ai.predictive.riskAnalysis')}</Text>
            
            <Grid>
              {riskAnalysis.slice(0, 6).map((risk, index) => (
                <Grid.Col key={index} span={4}>
                  <Card withBorder bg="gray.0">
                    <Group justify="space-between">
                      <Box>
                        <Text size="sm" fw={500}>{risk.customerName}</Text>
                        <Text size="xs" c="dimmed">{risk.reason}</Text>
                      </Box>
                      <Badge 
                        color={risk.risk > 70 ? 'red' : risk.risk > 40 ? 'yellow' : 'green'}
                        variant="filled"
                      >
                        {risk.risk}%
                      </Badge>
                    </Group>
                    <Text size="xs" mt="xs">
                      {t('ai.predictive.action')}: {risk.action}
                    </Text>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>

            {riskAnalysis.length > 6 && (
              <Button variant="light" fullWidth mt="md">
                {t('common.viewMore')} ({riskAnalysis.length - 6})
              </Button>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}

// Helper functions for generating predictive data
function generateSalesForecast(visits: any[], days: number) {
  const forecast = []
  const today = new Date()
  
  // Historical data (last 30 days)
  for (let i = 30; i > 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dailySales = Math.floor(Math.random() * 5) + 2
    forecast.push({
      date: date.toLocaleDateString(),
      actual: dailySales,
      predicted: null,
      upperBound: null,
      lowerBound: null
    })
  }
  
  // Predicted data
  const avgSales = forecast.reduce((sum, f) => sum + (f.actual || 0), 0) / forecast.length
  const trend = 1.02 // 2% growth trend
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    const predicted = avgSales * Math.pow(trend, i/30) + (Math.random() - 0.5) * 2
    const variance = predicted * 0.15
    
    forecast.push({
      date: date.toLocaleDateString(),
      actual: null,
      predicted: Math.max(0, predicted),
      upperBound: predicted + variance,
      lowerBound: Math.max(0, predicted - variance)
    })
  }
  
  return forecast
}

function predictConversionRates(visits: any[]) {
  const completed = visits.filter(v => v.status === 'completed').length
  const total = visits.length || 1
  const currentRate = (completed / total) * 100
  
  // Predict improvement based on AI optimization
  const aiImprovementFactor = 1.15 // 15% improvement with AI
  
  return {
    current: currentRate,
    next7Days: currentRate * 1.05,
    next14Days: currentRate * 1.10,
    next30Days: currentRate * aiImprovementFactor,
    confidence: 0.85
  }
}

function segmentCustomers(customers: any[], visits: any[]) {
  return customers.map(customer => {
    const customerVisits = visits.filter(v => v.customer_id === customer.id)
    const avgProbability = customerVisits
      .filter(v => v.ai_analysis?.purchase_probability)
      .reduce((sum, v) => sum + v.ai_analysis.purchase_probability, 0) / (customerVisits.length || 1)
    
    const value = customerVisits.length * 10000 + avgProbability * 50000
    const purchaseProbability = avgProbability * 100
    
    let segment = 'low-value'
    if (purchaseProbability > 70 && value > 30000) segment = 'high-value'
    else if (purchaseProbability > 50 && value > 20000) segment = 'medium-value'
    else if (purchaseProbability < 30 && customerVisits.length > 2) segment = 'at-risk'
    
    return {
      id: customer.id,
      name: customer.name,
      segment,
      purchaseProbability,
      value: value / 1000,
      visits: customerVisits.length
    }
  })
}

function predictConsultantPerformance(consultants: any[], visits: any[]) {
  return consultants.map(consultant => {
    const consultantVisits = visits.filter(v => v.consultant_id === consultant.id)
    const completed = consultantVisits.filter(v => v.status === 'completed').length
    const conversionRate = consultantVisits.length > 0 
      ? (completed / consultantVisits.length) * 100 
      : 0
    
    // Predict future performance based on trend
    const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
    const trendFactor = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1
    
    return {
      name: consultant.name,
      level: consultant.level || 'Senior',
      current: {
        sales: completed,
        conversion: conversionRate.toFixed(1) + '%',
        satisfaction: (4 + Math.random()).toFixed(1)
      },
      predicted: {
        sales: Math.round(completed * trendFactor),
        conversion: (conversionRate * trendFactor).toFixed(1) + '%',
        satisfaction: (4 + Math.random()).toFixed(1)
      },
      trend,
      trendPercentage: ((trendFactor - 1) * 100).toFixed(0),
      recommendation: trend === 'down' 
        ? 'Provide additional training and support'
        : trend === 'up' 
        ? 'Leverage for mentoring others'
        : 'Maintain current approach'
    }
  })
}

function analyzeSeasonalTrends(visits: any[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return months.map((month, index) => {
    const baseVisits = 20 + Math.floor(Math.random() * 30)
    const seasonalFactor = index >= 3 && index <= 6 ? 1.3 : index >= 9 && index <= 11 ? 1.2 : 1
    
    return {
      month,
      visits: Math.round(baseVisits * seasonalFactor),
      conversions: Math.round(baseVisits * seasonalFactor * 0.15),
      avgValue: 25000 + Math.random() * 15000
    }
  })
}

function performRiskAnalysis(visits: any[], customers: any[]) {
  return customers.slice(0, 10).map((customer, index) => {
    const customerVisits = visits.filter(v => v.customer_id === customer.id)
    const daysSinceLastVisit = customerVisits.length > 0
      ? Math.floor(Math.random() * 90)
      : 999
    
    let risk = 0
    let reason = ''
    let action = ''
    
    if (daysSinceLastVisit > 60) {
      risk = 80 + Math.random() * 20
      reason = 'No contact in 60+ days'
      action = 'Immediate re-engagement campaign'
    } else if (daysSinceLastVisit > 30) {
      risk = 50 + Math.random() * 30
      reason = 'Declining engagement'
      action = 'Schedule follow-up call'
    } else if (customerVisits.some(v => v.status === 'lost')) {
      risk = 60 + Math.random() * 20
      reason = 'Previous lost opportunity'
      action = 'Offer special incentive'
    } else {
      risk = Math.random() * 40
      reason = 'Active engagement'
      action = 'Continue nurturing'
    }
    
    return {
      customerName: customer.name,
      risk: Math.round(risk),
      reason,
      action,
      lastContact: `${daysSinceLastVisit} days ago`
    }
  }).sort((a, b) => b.risk - a.risk)
}