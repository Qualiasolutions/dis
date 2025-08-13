import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { CustomerProfileModal } from '../CustomerProfileModal'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
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
            notes: 'Customer is interested in Toyota models',
            consultant_notes: 'Prefers automatic transmission',
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
      eq: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
}

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase,
}))

// Mock auth store
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'consultant-1',
      consultant_profile: {
        id: 'consultant-1',
        name: 'John Doe',
      },
    },
  }),
}))

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}))

// Mock Mantine form
vi.mock('@mantine/form', () => ({
  useForm: () => ({
    values: {
      notes: 'Customer is interested in Toyota models',
      status: 'assigned',
      consultantNotes: 'Prefers automatic transmission',
    },
    setValues: vi.fn(),
    setFieldValue: vi.fn(),
    getInputProps: vi.fn((field) => ({
      value: field === 'consultantNotes' ? 'Prefers automatic transmission' : '',
      onChange: vi.fn(),
    })),
  }),
}))

const mockProps = {
  visitId: 'visit-1',
  opened: true,
  onClose: vi.fn(),
  onStatusUpdate: vi.fn(),
}

const renderCustomerProfileModal = (props = mockProps) => {
  return render(
    <MantineProvider>
      <CustomerProfileModal {...props} />
    </MantineProvider>
  )
}

describe('CustomerProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with customer information', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
      expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
      expect(screen.getByText('0791234567')).toBeInTheDocument()
      expect(screen.getByText('ahmad@example.com')).toBeInTheDocument()
    })
  })

  it('displays vehicle interest information', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Interest')).toBeInTheDocument()
      expect(screen.getByText('SUV')).toBeInTheDocument()
      expect(screen.getByText('20k-30k JD')).toBeInTheDocument()
      expect(screen.getByText('within_month')).toBeInTheDocument()
    })
  })

  it('shows status management section', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Status Management')).toBeInTheDocument()
      expect(screen.getByDisplayValue('assigned')).toBeInTheDocument()
    })
  })

  it('displays notes sections', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Notes & Follow-up')).toBeInTheDocument()
      expect(screen.getByText('Reception Notes:')).toBeInTheDocument()
      expect(screen.getByText('Customer is interested in Toyota models')).toBeInTheDocument()
      expect(screen.getByLabelText('Consultant Notes')).toBeInTheDocument()
    })
  })

  it('handles status change', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      // Find status select dropdown
      const statusSelect = screen.getByDisplayValue('assigned')
      fireEvent.click(statusSelect)
      
      // Select in_progress
      const inProgressOption = screen.getByText('In Progress')
      fireEvent.click(inProgressOption)
    })
    
    expect(mockProps.onStatusUpdate).toHaveBeenCalledWith('visit-1', 'in_progress')
  })

  it('handles quick status actions', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      // Should show "Start Service" button for assigned status
      const startButton = screen.getByText('Start Service')
      fireEvent.click(startButton)
    })
    
    expect(mockProps.onStatusUpdate).toHaveBeenCalledWith('visit-1', 'in_progress')
  })

  it('saves consultant notes', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      // Find save notes button
      const saveButton = screen.getByText('Save Notes')
      fireEvent.click(saveButton)
    })
    
    // Should call supabase update
    expect(mockSupabase.from).toHaveBeenCalledWith('visits')
  })

  it('handles save notes success', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save Notes')
      fireEvent.click(saveButton)
    })
    
    // Should show success notification
    const { notifications } = await import('@mantine/notifications')
    expect(notifications.show).toHaveBeenCalledWith({
      title: 'Saved',
      message: 'Notes updated successfully',
      color: 'green',
      icon: expect.any(Object),
    })
  })

  it('handles save notes error', async () => {
    // Mock error response
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: mockProps,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: new Error('Save failed'),
        })),
      })),
    })
    
    renderCustomerProfileModal()
    
    await waitFor(() => {
      const saveButton = screen.getByText('Save Notes')
      fireEvent.click(saveButton)
    })
    
    // Should show error notification
    const { notifications } = await import('@mantine/notifications')
    expect(notifications.show).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Failed to save notes',
      color: 'red',
      icon: expect.any(Object),
    })
  })

  it('shows loading state while fetching data', async () => {
    // Mock loading state
    const mockLoadingSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => new Promise(() => {})), // Never resolves
          })),
        })),
      })),
    }
    
    vi.mocked(mockSupabase.from).mockImplementation(mockLoadingSupabase.from)
    
    renderCustomerProfileModal()
    
    expect(screen.getByText('Customer Details')).toBeInTheDocument()
    // Should show loading overlay
  })

  it('handles modal close', () => {
    renderCustomerProfileModal()
    
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('formats dates correctly', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText(/Arrived:/)).toBeInTheDocument()
    })
  })

  it('shows correct status badges with colors', async () => {
    renderCustomerProfileModal()
    
    await waitFor(() => {
      const statusBadge = screen.getByText('ASSIGNED')
      expect(statusBadge).toBeInTheDocument()
    })
  })

  it('handles different visit statuses', async () => {
    // Mock in_progress status
    const inProgressData = {
      ...mockSupabase.from().select().eq().single().data,
      status: 'in_progress',
    }
    
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: inProgressData,
            error: null,
          })),
        })),
      })),
    })
    
    renderCustomerProfileModal()
    
    await waitFor(() => {
      // Should show "Complete" button for in_progress status
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  it('handles missing email gracefully', async () => {
    // Mock data without email
    const dataWithoutEmail = {
      ...mockSupabase.from().select().eq().single().data,
      customer: {
        ...mockSupabase.from().select().eq().single().data.customer,
        email: null,
      },
    }
    
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: dataWithoutEmail,
            error: null,
          })),
        })),
      })),
    })
    
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
      // Should not show email section
      expect(screen.queryByText('ahmad@example.com')).not.toBeInTheDocument()
    })
  })

  it('handles missing vehicle interest gracefully', async () => {
    // Mock data without vehicle interest
    const dataWithoutVehicleInterest = {
      ...mockSupabase.from().select().eq().single().data,
      vehicle_interest: null,
    }
    
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: dataWithoutVehicleInterest,
            error: null,
          })),
        })),
      })),
    })
    
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Ahmad Salem')).toBeInTheDocument()
      // Should not show vehicle interest section
      expect(screen.queryByText('Vehicle Interest')).not.toBeInTheDocument()
    })
  })

  it('handles string vehicle interest format', async () => {
    // Mock data with string vehicle interest
    const dataWithStringInterest = {
      ...mockSupabase.from().select().eq().single().data,
      vehicle_interest: 'Looking for a family car',
    }
    
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: dataWithStringInterest,
            error: null,
          })),
        })),
      })),
    })
    
    renderCustomerProfileModal()
    
    await waitFor(() => {
      expect(screen.getByText('Looking for a family car')).toBeInTheDocument()
    })
  })
})