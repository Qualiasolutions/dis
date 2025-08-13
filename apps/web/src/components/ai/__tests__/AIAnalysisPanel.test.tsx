import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { AIAnalysisPanel } from '../AIAnalysisPanel'
import { useVisitWithAI, useAIAnalysis } from '../../../hooks/useAIAnalysis'

// Mock the hooks
vi.mock('../../../hooks/useAIAnalysis', () => ({
  useVisitWithAI: vi.fn(),
  useAIAnalysis: vi.fn()
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}))

const mockVisitData = {
  id: 'test-visit-id',
  customers: {
    name: 'Ahmad Al-Masri',
    phone: '0791234567',
    language_preference: 'ar' as const
  },
  vehicle_interest: {
    type: 'SUV',
    brand: 'Toyota',
    model: 'RAV4',
    budget_range: '25000-35000'
  },
  status: 'new',
  consultant_notes: 'Customer is interested in family vehicle',
  source: 'walk-in',
  visit_duration: 45,
  interaction_quality: 'good',
  ai_analysis: {
    purchase_probability: 0.75,
    sentiment_score: 0.6,
    priority_ranking: 8,
    confidence_score: 0.85,
    recommended_actions: [
      'Schedule test drive within 2 days',
      'Present financing options',
      'Follow up via WhatsApp'
    ],
    concerns: [
      'Budget constraints',
      'Comparing with competitor offers'
    ],
    opportunities: [
      'First-time buyer incentives applicable',
      'Trade-in value can reduce cost'
    ],
    next_contact_timing: 'Within 24-48 hours',
    cultural_considerations: 'Prefer family decision-making, schedule meeting when spouse available',
    reasoning: 'High purchase intent with budget concerns that can be addressed through financing',
    generated_at: new Date().toISOString(),
    method: 'openai'
  }
}

describe('AIAnalysisPanel', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <AIAnalysisPanel visitId="test-visit-id" {...props} />
        </MantineProvider>
      </QueryClientProvider>
    )
  }

  it('should render loading state initially', () => {
    ;(useVisitWithAI as any).mockReturnValue({
      data: null,
      isLoading: true
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent()
    expect(screen.getByText('ai.loading')).toBeInTheDocument()
  })

  it('should display AI analysis data when available', async () => {
    ;(useVisitWithAI as any).mockReturnValue({
      data: mockVisitData,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent()

    await waitFor(() => {
      // Check key metrics are displayed
      expect(screen.getByText('75%')).toBeInTheDocument() // Purchase probability
      expect(screen.getByText('8/10')).toBeInTheDocument() // Priority ranking
      expect(screen.getByText('85%')).toBeInTheDocument() // Confidence score
      
      // Check recommendations are displayed
      expect(screen.getByText('Schedule test drive within 2 days')).toBeInTheDocument()
      expect(screen.getByText('Present financing options')).toBeInTheDocument()
      
      // Check concerns are displayed
      expect(screen.getByText('Budget constraints')).toBeInTheDocument()
      
      // Check opportunities are displayed
      expect(screen.getByText('First-time buyer incentives applicable')).toBeInTheDocument()
    })
  })

  it('should show prompt to analyze when no analysis exists', () => {
    const visitWithoutAnalysis = {
      ...mockVisitData,
      ai_analysis: null
    }

    ;(useVisitWithAI as any).mockReturnValue({
      data: visitWithoutAnalysis,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent()

    expect(screen.getByText('ai.noAnalysisYet')).toBeInTheDocument()
    expect(screen.getByText('ai.analyzeNow')).toBeInTheDocument()
  })

  it('should trigger reanalysis when button is clicked', async () => {
    const mockMutate = vi.fn()
    ;(useVisitWithAI as any).mockReturnValue({
      data: mockVisitData,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false
    })

    renderComponent()

    const reanalyzeButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(reanalyzeButton)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        visit_id: 'test-visit-id',
        customer_data: {
          name: 'Ahmad Al-Masri',
          phone: '0791234567',
          language_preference: 'ar',
          visit_history: 1
        },
        visit_data: {
          vehicle_interest: mockVisitData.vehicle_interest,
          consultant_notes: mockVisitData.consultant_notes,
          source: mockVisitData.source,
          visit_duration: mockVisitData.visit_duration,
          interaction_quality: mockVisitData.interaction_quality
        },
        force_reanalysis: true
      })
    })
  })

  it('should render compact view when compact prop is true', () => {
    ;(useVisitWithAI as any).mockReturnValue({
      data: mockVisitData,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent({ compact: true })

    // In compact mode, should show badges but not full details
    expect(screen.getByText('75% ai.purchaseProb')).toBeInTheDocument()
    expect(screen.getByText('ai.priority: 8/10')).toBeInTheDocument()
    
    // Should not show detailed sections
    expect(screen.queryByText('ai.recommendedActions')).not.toBeInTheDocument()
  })

  it('should handle visit not found error', () => {
    ;(useVisitWithAI as any).mockReturnValue({
      data: null,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent()
    expect(screen.getByText('ai.visitNotFound')).toBeInTheDocument()
  })

  it('should display cultural considerations for Jordan market', () => {
    ;(useVisitWithAI as any).mockReturnValue({
      data: mockVisitData,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent()

    expect(screen.getByText('ai.culturalConsiderations:')).toBeInTheDocument()
    expect(screen.getByText('Prefer family decision-making, schedule meeting when spouse available')).toBeInTheDocument()
  })

  it('should show loading state when reanalyzing', () => {
    ;(useVisitWithAI as any).mockReturnValue({
      data: mockVisitData,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: true
    })

    renderComponent()

    // The refresh button should show loading state
    const reanalyzeButton = screen.getByRole('button', { name: /refresh/i })
    expect(reanalyzeButton).toHaveAttribute('data-loading', 'true')
  })

  it('should display fallback method indicator', () => {
    const visitWithFallback = {
      ...mockVisitData,
      ai_analysis: {
        ...mockVisitData.ai_analysis,
        method: 'fallback'
      }
    }

    ;(useVisitWithAI as any).mockReturnValue({
      data: visitWithFallback,
      isLoading: false
    })
    ;(useAIAnalysis as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    renderComponent()
    expect(screen.getByText('ai.fallback')).toBeInTheDocument()
  })
})