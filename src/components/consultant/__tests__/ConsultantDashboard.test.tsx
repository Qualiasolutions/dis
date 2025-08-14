import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { ConsultantDashboard } from '../ConsultantDashboard'

// Mock stores
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'consultant-1',
      consultant_profile: {
        id: 'consultant-1',
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
      }
    },
    getUserRole: () => 'consultant',
    isConsultant: () => true,
  })
}))

vi.mock('../../../stores/queueStore', () => ({
  useQueueStore: () => ({
    visits: [
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
          purchase_timeline: 'within_month'
        },
        notes: 'Interested in Toyota Highlander'
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
        created_at: '2024-01-12T10:30:00Z',
        updated_at: '2024-01-12T11:00:00Z',
        vehicle_interest: {
          type: 'Sedan',
          budget_range: '15k-20k JD'
        }
      }
    ],
    loading: false,
    error: null,
    fetchVisits: vi.fn(),
    subscribeToVisits: vi.fn(() => vi.fn()),
    updateVisitStatus: vi.fn(),
  })
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const renderConsultantDashboard = () => {
  return render(
    <MantineProvider>
      <BrowserRouter>
        <ConsultantDashboard />
      </BrowserRouter>
    </MantineProvider>
  )
}

describe('ConsultantDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders consultant dashboard correctly', async () => {
    renderConsultantDashboard()
    
    // Check if main elements are rendered
    expect(screen.getByText('Consultant Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument()
    
    // Check quick stats cards
    expect(screen.getByText("Today's Visits")).toBeInTheDocument()
    expect(screen.getByText('Active Now')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Avg. Time')).toBeInTheDocument()
  })

  it('displays correct visit statistics', async () => {
    renderConsultantDashboard()
    
    await waitFor(() => {
      // Should show 2 visits for today (both visits are from today in mock)
      expect(screen.getByDisplayValue('2')).toBeInTheDocument() // Today's visits count
      expect(screen.getByDisplayValue('2')).toBeInTheDocument() // Active visits count (assigned + in_progress)
    })
  })

  it('shows my customers tab with visit list', async () => {
    renderConsultantDashboard()
    
    // Check if customers tab is active by default
    expect(screen.getByText('My Customers (2)')).toBeInTheDocument()
    
    // Check if customer names are displayed
    expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
    expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()
  })

  it('allows filtering visits by status', async () => {
    renderConsultantDashboard()
    
    // Find and click the status filter
    const filterSelect = screen.getByDisplayValue('Filter by status')
    fireEvent.click(filterSelect)
    
    // Should show filter options
    await waitFor(() => {
      expect(screen.getByText('Assigned to Me')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  it('switches between customer list and performance tabs', async () => {
    renderConsultantDashboard()
    
    // Click on performance tab
    const performanceTab = screen.getByText('Performance')
    fireEvent.click(performanceTab)
    
    await waitFor(() => {
      // Should show performance metrics
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument()
    })
  })

  it('handles customer selection for modal', async () => {
    renderConsultantDashboard()
    
    // Find a customer card and click details
    const detailsButton = screen.getAllByText('Details')[0]
    fireEvent.click(detailsButton)
    
    // Should open customer profile modal
    await waitFor(() => {
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
    })
  })

  it('handles refresh functionality', async () => {
    renderConsultantDashboard()
    
    // Find and click refresh button
    const refreshButton = screen.getByLabelText(/refresh/i)
    fireEvent.click(refreshButton)
    
    // Should call fetchVisits
    // This would be tested with proper store mocking
  })

  it('shows access denied for non-consultant users', async () => {
    // Mock non-consultant user
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      getUserRole: () => 'reception',
      isConsultant: () => false,
    })
    
    renderConsultantDashboard()
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You need consultant permissions to access this dashboard.')).toBeInTheDocument()
  })

  it('displays error state when loading fails', async () => {
    // Mock error state
    vi.mocked(useQueueStore).mockReturnValue({
      visits: [],
      loading: false,
      error: 'Failed to load visits',
      fetchVisits: vi.fn(),
      subscribeToVisits: vi.fn(() => vi.fn()),
      updateVisitStatus: vi.fn(),
    })
    
    renderConsultantDashboard()
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Failed to load visits')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('calculates performance metrics correctly', async () => {
    renderConsultantDashboard()
    
    // Switch to performance tab to check metrics calculation
    const performanceTab = screen.getByText('Performance')
    fireEvent.click(performanceTab)
    
    await waitFor(() => {
      // Should display total visits
      expect(screen.getByText('2')).toBeInTheDocument() // Total visits
      
      // Conversion rate should be calculated (0% since no completed visits in mock)
      expect(screen.getByText('0.0%')).toBeInTheDocument()
    })
  })
})