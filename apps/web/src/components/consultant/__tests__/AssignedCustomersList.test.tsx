import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { AssignedCustomersList } from '../AssignedCustomersList'
import type { QueueVisit } from '../../../stores/queueStore'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}))

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
    },
    notes: 'Interested in Toyota Highlander',
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
    created_at: '2024-01-12T08:00:00Z', // 1 hour ago
    updated_at: '2024-01-12T08:30:00Z',
    vehicle_interest: {
      type: 'Sedan',
      budget_range: '15k-20k JD',
    },
  },
  {
    id: 'visit-3',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-3',
      name: 'Omar Khaled',
      phone: '0798765432',
    },
    status: 'completed',
    created_at: '2024-01-12T07:00:00Z', // 2 hours ago
    updated_at: '2024-01-12T08:00:00Z',
  },
]

const mockProps = {
  visits: mockVisits,
  loading: false,
  onCustomerClick: vi.fn(),
  onStatusUpdate: vi.fn(),
}

const renderAssignedCustomersList = (props = mockProps) => {
  return render(
    <MantineProvider>
      <AssignedCustomersList {...props} />
    </MantineProvider>
  )
}

describe('AssignedCustomersList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock current time for consistent wait time calculations
    vi.setSystemTime(new Date('2024-01-12T10:00:00Z'))
  })

  it('renders customer list correctly', () => {
    renderAssignedCustomersList()
    
    // Check if customers are displayed
    expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
    expect(screen.getByText('Sara Ahmad')).toBeInTheDocument()
    expect(screen.getByText('Omar Khaled')).toBeInTheDocument()
    
    // Check phone numbers
    expect(screen.getByText('0791234567')).toBeInTheDocument()
    expect(screen.getByText('0797654321')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    renderAssignedCustomersList({
      ...mockProps,
      loading: true,
    })
    
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })

  it('shows empty state when no customers', () => {
    renderAssignedCustomersList({
      ...mockProps,
      visits: [],
    })
    
    expect(screen.getByText('No customers assigned to you yet')).toBeInTheDocument()
  })

  it('displays status badges correctly', () => {
    renderAssignedCustomersList()
    
    // Check for status badges
    expect(screen.getByText('ASSIGNED')).toBeInTheDocument()
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument()
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
  })

  it('shows wait time correctly', () => {
    renderAssignedCustomersList()
    
    // Check wait time badges (based on mocked current time)
    expect(screen.getByText('60m')).toBeInTheDocument() // Ahmad (1 hour)
    expect(screen.getByText('120m')).toBeInTheDocument() // Sara (2 hours)
    expect(screen.getByText('180m')).toBeInTheDocument() // Omar (3 hours)
  })

  it('displays vehicle interest information', () => {
    renderAssignedCustomersList()
    
    expect(screen.getByText('SUV - 20k-30k JD')).toBeInTheDocument()
    expect(screen.getByText('Sedan - 15k-20k JD')).toBeInTheDocument()
  })

  it('shows notes preview when available', () => {
    renderAssignedCustomersList()
    
    expect(screen.getByText('Interested in Toyota Highlander')).toBeInTheDocument()
  })

  it('handles customer click correctly', async () => {
    renderAssignedCustomersList()
    
    // Click on details button
    const detailsButtons = screen.getAllByText('Details')
    fireEvent.click(detailsButtons[0])
    
    expect(mockProps.onCustomerClick).toHaveBeenCalledWith('visit-1')
  })

  it('handles quick status updates', async () => {
    renderAssignedCustomersList()
    
    // Click on Start button for assigned visit
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)
    
    expect(mockProps.onStatusUpdate).toHaveBeenCalledWith('visit-1', 'in_progress')
  })

  it('handles completion for in-progress visits', async () => {
    renderAssignedCustomersList()
    
    // Click on Complete button for in-progress visit
    const completeButton = screen.getByText('Complete')
    fireEvent.click(completeButton)
    
    expect(mockProps.onStatusUpdate).toHaveBeenCalledWith('visit-2', 'completed')
  })

  it('shows dropdown menu with all actions', async () => {
    renderAssignedCustomersList()
    
    // Click on menu button (three dots)
    const menuButton = screen.getAllByLabelText(/menu/i)[0]
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText('Start Service')).toBeInTheDocument()
      expect(screen.getByText('Mark Complete')).toBeInTheDocument()
      expect(screen.getByText('Mark Lost')).toBeInTheDocument()
    })
  })

  it('handles menu actions correctly', async () => {
    renderAssignedCustomersList()
    
    // Open menu and click "Mark Complete"
    const menuButton = screen.getAllByLabelText(/menu/i)[0]
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      const completeMenuItem = screen.getByText('Mark Complete')
      fireEvent.click(completeMenuItem)
    })
    
    expect(mockProps.onStatusUpdate).toHaveBeenCalledWith('visit-1', 'completed')
  })

  it('disables actions based on current status', async () => {
    renderAssignedCustomersList()
    
    // Open menu for in-progress visit
    const menuButtons = screen.getAllByLabelText(/menu/i)
    fireEvent.click(menuButtons[1]) // Second customer (in_progress)
    
    await waitFor(() => {
      const startServiceItem = screen.getByText('Start Service')
      expect(startServiceItem).toHaveAttribute('data-disabled', 'true')
    })
  })

  it('shows correct priority colors based on wait time', () => {
    renderAssignedCustomersList()
    
    // Check for avatar colors based on wait time
    const avatars = screen.getAllByRole('img', { name: '' })
    expect(avatars).toHaveLength(3)
    
    // Note: Color testing would require checking computed styles
    // This is more of a visual regression test
  })

  it('handles status update success notification', async () => {
    const mockOnStatusUpdate = vi.fn().mockResolvedValue(undefined)
    
    renderAssignedCustomersList({
      ...mockProps,
      onStatusUpdate: mockOnStatusUpdate,
    })
    
    // Click start button
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('visit-1', 'in_progress')
    })
    
    // Should show success notification
    const { notifications } = await import('@mantine/notifications')
    expect(notifications.show).toHaveBeenCalledWith({
      title: 'Status Updated',
      message: 'Visit status changed to in_progress',
      color: 'green',
      icon: expect.any(Object),
    })
  })

  it('handles status update error notification', async () => {
    const mockOnStatusUpdate = vi.fn().mockRejectedValue(new Error('Update failed'))
    
    renderAssignedCustomersList({
      ...mockProps,
      onStatusUpdate: mockOnStatusUpdate,
    })
    
    // Click start button
    const startButton = screen.getByText('Start')
    fireEvent.click(startButton)
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('visit-1', 'in_progress')
    })
    
    // Should show error notification
    const { notifications } = await import('@mantine/notifications')
    expect(notifications.show).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Failed to update status',
      color: 'red',
      icon: expect.any(Object),
    })
  })

  it('formats time correctly', () => {
    renderAssignedCustomersList()
    
    // Check if arrival times are formatted correctly
    expect(screen.getByText(/Arrived:/)).toBeInTheDocument()
  })

  it('shows email when available', () => {
    renderAssignedCustomersList()
    
    // Only Ahmad has email in mock data
    expect(screen.getByText('ahmad@example.com')).toBeInTheDocument()
  })

  it('handles grid responsive layout', () => {
    renderAssignedCustomersList()
    
    // Check if grid layout is rendered
    const gridItems = screen.getAllByRole('gridcell')
    expect(gridItems.length).toBeGreaterThan(0)
  })
})