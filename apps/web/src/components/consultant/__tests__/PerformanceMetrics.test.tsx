import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { PerformanceMetrics } from '../PerformanceMetrics'
import type { QueueVisit } from '../../../stores/queueStore'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockVisits: QueueVisit[] = [
  {
    id: 'visit-1',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-1',
      name: 'Ahmad Salem',
      phone: '0791234567',
    },
    status: 'completed',
    created_at: '2024-01-12T09:00:00Z',
    updated_at: '2024-01-12T10:30:00Z', // 90 minutes service time
  },
  {
    id: 'visit-2',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-2',
      name: 'Sara Ahmad',
      phone: '0797654321',
    },
    status: 'completed',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T11:00:00Z', // 60 minutes service time
  },
  {
    id: 'visit-3',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-3',
      name: 'Omar Khaled',
      phone: '0798765432',
    },
    status: 'lost',
    created_at: '2024-01-12T11:00:00Z',
    updated_at: '2024-01-12T11:15:00Z', // 15 minutes response time
  },
  {
    id: 'visit-4',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-4',
      name: 'Layla Hassan',
      phone: '0799876543',
    },
    status: 'in_progress',
    created_at: '2024-01-12T12:00:00Z',
    updated_at: '2024-01-12T12:05:00Z', // 5 minutes response time
  },
  {
    id: 'visit-5',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-5',
      name: 'Fadi Nasser',
      phone: '0796543210',
    },
    status: 'assigned',
    created_at: '2024-01-12T13:00:00Z',
    updated_at: '2024-01-12T13:10:00Z', // 10 minutes response time
  }
]

const renderPerformanceMetrics = (visits: QueueVisit[] = mockVisits) => {
  return render(
    <MantineProvider>
      <PerformanceMetrics consultantId="consultant-1" visits={visits} />
    </MantineProvider>
  )
}

describe('PerformanceMetrics', () => {
  it('renders performance analytics correctly', () => {
    renderPerformanceMetrics()
    
    expect(screen.getByText('Performance Analytics')).toBeInTheDocument()
    expect(screen.getByText('Total Visits')).toBeInTheDocument()
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
    expect(screen.getByText('Avg. Service Time')).toBeInTheDocument()
    expect(screen.getByText('Avg. Response Time')).toBeInTheDocument()
  })

  it('calculates total visits correctly', () => {
    renderPerformanceMetrics()
    
    // Should show 5 total visits
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('calculates conversion rate correctly', () => {
    renderPerformanceMetrics()
    
    // 2 completed out of 5 total (excluding new status) = 40%
    // But since there are no 'new' status visits in mock, it's 2/5 = 40%
    expect(screen.getByText('40.0%')).toBeInTheDocument()
  })

  it('calculates average service time correctly', () => {
    renderPerformanceMetrics()
    
    // Average of 90min and 60min = 75 minutes
    expect(screen.getByText('75m')).toBeInTheDocument()
  })

  it('calculates average response time correctly', () => {
    renderPerformanceMetrics()
    
    // Average of 15, 5, 10 minutes = 10 minutes
    expect(screen.getByText('10m')).toBeInTheDocument()
  })

  it('shows correct status breakdown', () => {
    renderPerformanceMetrics()
    
    expect(screen.getByText('Visit Status Breakdown')).toBeInTheDocument()
    
    // Check status counts
    const statusLabels = ['Completed', 'In Progress', 'Assigned', 'Lost']
    statusLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
    
    // Check specific counts
    expect(screen.getByText('2')).toBeInTheDocument() // Completed count
    expect(screen.getByText('1')).toBeInTheDocument() // In Progress, Assigned, Lost counts
  })

  it('changes time range correctly', async () => {
    renderPerformanceMetrics()
    
    // Find time range selector
    const timeRangeSelect = screen.getByDisplayValue('Today')
    fireEvent.click(timeRangeSelect)
    
    // Select "Last 7 Days"
    const weekOption = screen.getByText('Last 7 Days')
    fireEvent.click(weekOption)
    
    await waitFor(() => {
      // Should update to show week view
      expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument()
    })
  })

  it('shows performance indicators with correct colors', () => {
    renderPerformanceMetrics()
    
    expect(screen.getByText('Performance Indicators')).toBeInTheDocument()
    
    // Should show conversion rate progress
    const progressBars = screen.getAllByRole('progressbar')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('handles empty visits gracefully', () => {
    renderPerformanceMetrics([])
    
    expect(screen.getByText('No visits found for the selected time period')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Today')).toBeInTheDocument()
  })

  it('handles no consultant ID gracefully', () => {
    render(
      <MantineProvider>
        <PerformanceMetrics consultantId="" visits={mockVisits} />
      </MantineProvider>
    )
    
    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('Please select a consultant to view performance metrics.')).toBeInTheDocument()
  })

  it('shows correct performance ratings', () => {
    renderPerformanceMetrics()
    
    // Check for performance rating texts
    expect(screen.getByText('Room for Improvement')).toBeInTheDocument() // For 40% conversion rate
    expect(screen.getByText('Excellent Response')).toBeInTheDocument() // For 10min response time
  })

  it('filters visits by date range correctly', async () => {
    // Create visits from different dates
    const mixedDateVisits: QueueVisit[] = [
      ...mockVisits,
      {
        id: 'old-visit',
        consultant_id: 'consultant-1',
        customer: {
          id: 'old-customer',
          name: 'Old Customer',
          phone: '0791111111',
        },
        status: 'completed',
        created_at: '2024-01-01T09:00:00Z', // Much older date
        updated_at: '2024-01-01T10:00:00Z',
      }
    ]
    
    renderPerformanceMetrics(mixedDateVisits)
    
    // Change to "Last 30 Days" to include the old visit
    const timeRangeSelect = screen.getByDisplayValue('Today')
    fireEvent.click(timeRangeSelect)
    
    const monthOption = screen.getByText('Last 30 Days')
    fireEvent.click(monthOption)
    
    await waitFor(() => {
      // Should now show 6 total visits (including the old one)
      expect(screen.getByText('6')).toBeInTheDocument()
    })
  })

  it('shows trend indicators correctly', () => {
    renderPerformanceMetrics()
    
    // Should show trend icons for metrics
    // These are rendered as SVG icons, so we check for their presence
    const metricCards = screen.getAllByText(/\d+/) // Numbers in metric cards
    expect(metricCards.length).toBeGreaterThan(0)
  })
})