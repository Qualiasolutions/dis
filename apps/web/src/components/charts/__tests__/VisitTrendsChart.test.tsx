import { render, screen, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { VisitTrendsChart } from '../VisitTrendsChart'
import type { QueueVisit } from '../../../stores/queueStore'

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

const mockVisits: QueueVisit[] = [
  {
    id: '1',
    customer_id: 'cust1',
    consultant_id: 'cons1',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: 'John Doe',
    customer_phone: '0791234567',
    vehicle_interest: {
      type: 'SUV',
      brand: 'Toyota',
      budget_range: '20k-30k JD',
      purchase_timeline: 'within_month'
    },
    consultant_notes: 'Test visit 1'
  },
  {
    id: '2',
    customer_id: 'cust2',
    consultant_id: 'cons1',
    status: 'lost',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    customer_name: 'Jane Smith',
    customer_phone: '0791234568',
    vehicle_interest: {
      type: 'Sedan',
      brand: 'Honda',
      budget_range: '15k-20k JD',
      purchase_timeline: 'within_week'
    },
    consultant_notes: 'Test visit 2'
  }
]

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('VisitTrendsChart', () => {
  it('renders loading state correctly', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={[]} timeRange="week" loading={true} />
      </TestWrapper>
    )

    expect(screen.getByText('Visit Trends')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={[]} timeRange="week" loading={false} />
      </TestWrapper>
    )

    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('No visit data available for the selected time period.')).toBeInTheDocument()
  })

  it('renders chart with data', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="week" loading={false} />
      </TestWrapper>
    )

    expect(screen.getByText('Visit Trends')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('allows switching between chart types', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="week" loading={false} />
      </TestWrapper>
    )

    // Should render line chart by default
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()

    // Find and click the chart type selector
    const chartTypeSelect = screen.getByDisplayValue('Line Chart')
    fireEvent.click(chartTypeSelect)
    
    // Click Area Chart option
    const areaOption = screen.getByText('Area Chart')
    fireEvent.click(areaOption)

    // Should now render area chart
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('allows switching between metrics', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="week" loading={false} />
      </TestWrapper>
    )

    // Find metric selector
    const metricSelect = screen.getByDisplayValue('Total Visits')
    fireEvent.click(metricSelect)
    
    // Click Conversion Rate option
    const conversionOption = screen.getByText('Conversion Rate %')
    fireEvent.click(conversionOption)

    // Verify the metric changed
    expect(screen.getByDisplayValue('Conversion Rate %')).toBeInTheDocument()
  })

  it('displays summary statistics', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="week" loading={false} />
      </TestWrapper>
    )

    expect(screen.getByText('Total Visits')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Avg Conversion')).toBeInTheDocument()
  })

  it('calculates correct metrics from visit data', () => {
    render(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="week" loading={false} />
      </TestWrapper>
    )

    // Check total visits (2)
    const totalVisitsElements = screen.getAllByText('2')
    expect(totalVisitsElements.length).toBeGreaterThan(0)

    // Check completed visits (1)
    const completedVisitsElements = screen.getAllByText('1')
    expect(completedVisitsElements.length).toBeGreaterThan(0)
  })

  it('handles different time ranges', () => {
    const { rerender } = render(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="today" loading={false} />
      </TestWrapper>
    )

    expect(screen.getByText('Visit Trends')).toBeInTheDocument()

    // Re-render with different time range
    rerender(
      <TestWrapper>
        <VisitTrendsChart visits={mockVisits} timeRange="month" loading={false} />
      </TestWrapper>
    )

    expect(screen.getByText('Visit Trends')).toBeInTheDocument()
  })

  it('shows trend indicators when applicable', () => {
    const visitsWithTrend = [
      ...mockVisits,
      {
        id: '3',
        customer_id: 'cust3',
        consultant_id: 'cons1',
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        customer_name: 'Bob Johnson',
        customer_phone: '0791234569',
        vehicle_interest: {
          type: 'Hatchback',
          brand: 'Nissan',
          budget_range: '10k-15k JD',
          purchase_timeline: 'within_3months'
        },
        consultant_notes: 'Test visit 3'
      }
    ]

    render(
      <TestWrapper>
        <VisitTrendsChart visits={visitsWithTrend} timeRange="week" loading={false} />
      </TestWrapper>
    )

    // Should show trend information
    expect(screen.getByText('vs previous period')).toBeInTheDocument()
  })
})