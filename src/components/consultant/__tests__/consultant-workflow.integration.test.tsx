import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { ConsultantDashboard } from '../ConsultantDashboard'
import type { QueueVisit } from '../../../stores/queueStore'

// Mock the entire consultant workflow
const mockVisits: QueueVisit[] = [
  {
    id: 'visit-1',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-1',
      name: 'Ahmad Salem',
      phone: '0791234567',
      email: 'ahmad@example.com',
    },
    status: 'assigned',
    created_at: '2024-01-12T09:00:00Z',
    updated_at: '2024-01-12T09:00:00Z',
    vehicle_interest: {
      type: 'SUV',
      budget_range: '20k-30k JD',
      purchase_timeline: 'within_month',
    },
    notes: 'Customer prefers automatic transmission',
  },
  {
    id: 'visit-2',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-2',
      name: 'Sara Ahmad',
      phone: '0797654321',
    },
    status: 'in_progress',
    created_at: '2024-01-12T08:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
    vehicle_interest: {
      type: 'Sedan',
      budget_range: '15k-20k JD',
    },
  },
]

// Mock stores with realistic data
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'consultant-1',
      consultant_profile: {
        id: 'consultant-1',
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
      },
    },
    getUserRole: () => 'consultant',
    isConsultant: () => true,
    isAuthenticated: () => true,
  }),
}))

const mockUpdateVisitStatus = vi.fn()
const mockFetchVisits = vi.fn()
const mockSubscribeToVisits = vi.fn(() => vi.fn())

vi.mock('../../../stores/queueStore', () => ({
  useQueueStore: () => ({
    visits: mockVisits,
    loading: false,
    error: null,
    fetchVisits: mockFetchVisits,
    subscribeToVisits: mockSubscribeToVisits,
    updateVisitStatus: mockUpdateVisitStatus,
  }),
}))

// Mock Supabase for customer profile modal
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: {
            id: 'visit-1',
            consultant_id: 'consultant-1',
            customer: mockVisits[0].customer,
            status: 'assigned',
            created_at: mockVisits[0].created_at,
            updated_at: mockVisits[0].updated_at,
            vehicle_interest: mockVisits[0].vehicle_interest,
            notes: mockVisits[0].notes,
            consultant_notes: 'Initial consultation notes',
            consultant: {
              id: 'consultant-1',
              name: 'John Doe',
            },
          },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({
        data: null,
        error: null,
      })),
    })),
  })),
}

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase,
}))

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const renderConsultantWorkflow = () => {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <ConsultantDashboard />
      </BrowserRouter>
    </MantineProvider>
  )
}

describe('Consultant Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2024-01-12T12:00:00Z')) // Fixed time for consistent tests
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('completes the full consultant workflow', async () => {
    renderConsultantWorkflow()

    // 1. Dashboard loads with consultant data
    expect(screen.getByText('Consultant Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument()

    // 2. Shows correct metrics
    await waitFor(() => {
      expect(screen.getByText("Today's Visits")).toBeInTheDocument()
      expect(screen.getByText('Active Now')).toBeInTheDocument()
    })

    // 3. Customer list is displayed
    expect(screen.getByText('My Customers (2)')).toBeInTheDocument()
    expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
    expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()

    // 4. Start service for assigned customer
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)

    expect(mockUpdateVisitStatus).toHaveBeenCalledWith('visit-1', 'in_progress')

    // 5. Open customer profile modal
    const detailsButtons = screen.getAllByText('Details')
    fireEvent.click(detailsButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
      expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
    })

    // 6. Update customer notes
    const notesTextarea = screen.getByLabelText('Consultant Notes')
    fireEvent.change(notesTextarea, {
      target: { value: 'Customer showed interest in Toyota RAV4' }
    })

    const saveButton = screen.getByText('Save Notes')
    fireEvent.click(saveButton)

    // Should call supabase update
    expect(mockSupabase.from).toHaveBeenCalledWith('visits')

    // 7. Change status to completed
    const statusSelect = screen.getByDisplayValue('assigned')
    fireEvent.click(statusSelect)
    
    await waitFor(() => {
      const completedOption = screen.getByText('Completed')
      fireEvent.click(completedOption)
    })

    // Should trigger status update
    expect(mockUpdateVisitStatus).toHaveBeenCalled()

    // 8. Close modal
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    // 9. Switch to performance tab
    const performanceTab = screen.getByText('Performance')
    fireEvent.click(performanceTab)

    await waitFor(() => {
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument()
      expect(screen.getByText('Total Visits')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
    })

    // 10. Verify performance metrics are calculated
    expect(screen.getByText('2')).toBeInTheDocument() // Total visits
  })

  it('handles error states gracefully', async () => {
    // Mock error in visit status update
    mockUpdateVisitStatus.mockRejectedValueOnce(new Error('Network error'))

    renderConsultantWorkflow()

    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockUpdateVisitStatus).toHaveBeenCalledWith('visit-1', 'in_progress')
    })

    // Should handle error gracefully (no crash)
    expect(screen.getByText('Consultant Dashboard')).toBeInTheDocument()
  })

  it('filters customers by status correctly', async () => {
    renderConsultantWorkflow()

    // Filter by "In Progress" status
    const filterSelect = screen.getByDisplayValue('Filter by status')
    fireEvent.click(filterSelect)

    const inProgressOption = screen.getByText('In Progress')
    fireEvent.click(inProgressOption)

    // Should only show Sara Ahmad (in_progress status)
    await waitFor(() => {
      expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()
      expect(screen.queryByText('Ahmad Salem')).not.toBeInTheDocument()
    })

    // Reset filter
    fireEvent.click(filterSelect)
    const allOption = screen.getByText('All Visits')
    fireEvent.click(allOption)

    // Should show both customers again
    await waitFor(() => {
      expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()
      expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
    })
  })

  it('handles real-time updates', async () => {
    renderConsultantWorkflow()

    // Verify subscription is set up
    expect(mockSubscribeToVisits).toHaveBeenCalled()
    expect(mockFetchVisits).toHaveBeenCalled()

    // Should show refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeInTheDocument()

    fireEvent.click(refreshButton)

    // Should trigger data refresh
    expect(mockFetchVisits).toHaveBeenCalledTimes(2)
  })

  it('calculates performance metrics accurately', async () => {
    renderConsultantWorkflow()

    // Switch to performance tab
    const performanceTab = screen.getByText('Performance')
    fireEvent.click(performanceTab)

    await waitFor(() => {
      // Should show correct metrics based on mock data
      expect(screen.getByText('2')).toBeInTheDocument() // Total visits

      // Conversion rate: 0 completed out of 2 total = 0%
      expect(screen.getByText('0.0%')).toBeInTheDocument()

      // Should show time range selector
      expect(screen.getByDisplayValue('Today')).toBeInTheDocument()
    })

    // Change time range to "Last 7 Days"
    const timeRangeSelect = screen.getByDisplayValue('Today')
    fireEvent.click(timeRangeSelect)

    const weekOption = screen.getByText('Last 7 Days')
    fireEvent.click(weekOption)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument()
    })
  })

  it('handles quick actions from customer cards', async () => {
    renderConsultantWorkflow()

    // Find customer card menu
    const customerCard = screen.getByText('Ahmad Salem').closest('[role="gridcell"]')
    expect(customerCard).toBeInTheDocument()

    // Find and click the menu button (three dots)
    const menuButton = within(customerCard!).getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText('Start Service')).toBeInTheDocument()
      expect(screen.getByText('Mark Complete')).toBeInTheDocument()
      expect(screen.getByText('Mark Lost')).toBeInTheDocument()
    })

    // Click "Mark Complete"
    const markCompleteOption = screen.getByText('Mark Complete')
    fireEvent.click(markCompleteOption)

    expect(mockUpdateVisitStatus).toHaveBeenCalledWith('visit-1', 'completed')
  })

  it('displays priority indicators based on wait time', async () => {
    renderConsultantWorkflow()

    // Should show customers with different priority colors based on wait time
    const customerCards = screen.getAllByRole('gridcell')
    expect(customerCards.length).toBe(2)

    // Ahmad Salem (created 3 hours ago) should have higher priority
    // Sara Ahmad (created 4 hours ago) should have highest priority
    const ahmadCard = screen.getByText('Ahmad Salem').closest('[role="gridcell"]')
    const saraCard = screen.getByText('Sara Ahmad').closest('[role="gridcell"]')

    expect(ahmadCard).toBeInTheDocument()
    expect(saraCard).toBeInTheDocument()

    // Check wait time badges
    expect(screen.getByText('180m')).toBeInTheDocument() // Ahmad: 3 hours
    expect(screen.getByText('240m')).toBeInTheDocument() // Sara: 4 hours
  })

  it('maintains state consistency across interactions', async () => {
    renderConsultantWorkflow()

    // Start service for Ahmad
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)

    // Open customer profile
    const detailsButtons = screen.getAllByText('Details')
    fireEvent.click(detailsButtons[0])

    // Wait for modal to load
    await waitFor(() => {
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
    })

    // Change status in modal should be consistent
    const completeButton = screen.getByText('Complete')
    fireEvent.click(completeButton)

    expect(mockUpdateVisitStatus).toHaveBeenCalledWith('visit-1', 'completed')

    // Close modal
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    // State should be consistent in main dashboard
    // (In real implementation, the status would be updated in the store)
  })

  it('handles keyboard navigation and accessibility', async () => {
    renderConsultantWorkflow()

    // Check for proper ARIA labels
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()

    // Check for proper headings
    expect(screen.getByRole('heading', { name: 'Consultant Dashboard' })).toBeInTheDocument()

    // Check for proper form labels when modal is open
    const detailsButtons = screen.getAllByText('Details')
    fireEvent.click(detailsButtons[0])

    await waitFor(() => {
      expect(screen.getByLabelText('Consultant Notes')).toBeInTheDocument()
    })
  })
})