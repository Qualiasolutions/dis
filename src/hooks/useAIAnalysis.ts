import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { notifications } from '@mantine/notifications'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

interface AIAnalysisRequest {
  visit_id: string
  customer_data?: {
    name: string
    phone: string
    email?: string
    language_preference: 'ar' | 'en'
    visit_history?: number
  }
  visit_data: {
    vehicle_interest: any
    consultant_notes?: string
    source?: string
    visit_duration?: number
    interaction_quality?: string
  }
  force_reanalysis?: boolean
}

interface AIAnalysisResult {
  purchase_probability: number
  sentiment_score: number
  priority_ranking: number
  confidence_score: number
  recommended_actions: string[]
  concerns: string[]
  opportunities: string[]
  next_contact_timing: string
  reasoning: string
  cultural_considerations?: string
  generated_at: string
}

interface AIAnalysisResponse {
  success: boolean
  data: AIAnalysisResult
  cached: boolean
  method: 'openai' | 'fallback'
  message: string
}

// Hook for triggering AI analysis
export function useAIAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: AIAnalysisRequest): Promise<AIAnalysisResponse> => {
      const { data, error } = await supabase.functions.invoke('ai-visit-analysis', {
        body: request
      })

      if (error) {
        throw new Error(error.message || 'Failed to analyze visit')
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['visit', variables.visit_id] })
      queryClient.invalidateQueries({ queryKey: ['ai-predictions'] })

      // Show success notification
      notifications.show({
        title: 'AI Analysis Complete',
        message: data.cached 
          ? 'Using cached analysis results'
          : `Analysis completed using ${data.method === 'openai' ? 'OpenAI GPT-4' : 'fallback method'}`,
        color: data.method === 'openai' ? 'green' : 'yellow',
        autoClose: 3000
      })
    },
    onError: (error: Error) => {
      console.error('AI analysis failed:', error)
      notifications.show({
        title: 'Analysis Failed',
        message: error.message || 'Failed to analyze visit. Please try again.',
        color: 'red',
        autoClose: 5000
      })
    }
  })
}

// Hook for fetching AI performance metrics
export function useAIPerformanceMetrics(timeRange: 'day' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ['ai-performance-metrics', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_performance_metrics')
        .select('*')
        .gte('analysis_date', getDateRange(timeRange))
        .order('analysis_date', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

// Hook for fetching AI prediction accuracy
export function useAIPredictionAccuracy(timeRange: 'week' | 'month' | 'quarter' = 'month') {
  return useQuery({
    queryKey: ['ai-prediction-accuracy', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prediction_accuracy')
        .select('*')
        .gte('prediction_week', getDateRange(timeRange))
        .order('prediction_week', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // 1 minute
  })
}

// Hook for fetching visit with AI analysis
export function useVisitWithAI(visitId: string) {
  return useQuery({
    queryKey: ['visit-ai', visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          customers!inner(name, phone, language_preference),
          consultants!inner(name, active)
        `)
        .eq('id', visitId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!visitId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook for fetching high-priority visits based on AI analysis
export function useHighPriorityVisits(limit: number = 10) {
  return useQuery({
    queryKey: ['high-priority-visits', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          customers!inner(name, phone, language_preference),
          consultants!inner(name, active)
        `)
        .not('ai_priority_ranking', 'is', null)
        .gte('ai_priority_ranking', 7) // High priority (7-10)
        .neq('status', 'completed')
        .neq('status', 'lost')
        .order('ai_priority_ranking', { ascending: false })
        .order('ai_purchase_probability', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
}

// Hook for fetching AI analysis logs for monitoring
export function useAIAnalysisLogs(limit: number = 50) {
  return useQuery({
    queryKey: ['ai-analysis-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analysis_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 15 * 1000, // 15 seconds for real-time monitoring
  })
}

// Utility function to calculate date ranges
function getDateRange(timeRange: string): string {
  const now = new Date()
  let days = 7

  switch (timeRange) {
    case 'day': days = 1; break
    case 'week': days = 7; break
    case 'month': days = 30; break
    case 'quarter': days = 90; break
    case 'year': days = 365; break
  }

  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

// Hook for real-time AI insights subscription
export function useAIInsightsSubscription() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['ai-insights-subscription'],
    queryFn: () => {
      // Set up real-time subscription for AI analysis updates
      const subscription = supabase
        .channel('ai-analysis-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'visits',
            filter: 'ai_analysis=not.is.null'
          },
          (payload) => {
            console.log('AI analysis updated:', payload)
            
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['visits'] })
            queryClient.invalidateQueries({ queryKey: ['high-priority-visits'] })
            queryClient.invalidateQueries({ queryKey: ['visit-ai', payload.new.id] })
            
            // Show notification for high-priority updates
            if (payload.new.ai_priority_ranking >= 8) {
              notifications.show({
                title: 'High Priority Customer',
                message: `New high-priority customer analysis completed (Priority: ${payload.new.ai_priority_ranking}/10)`,
                color: 'orange',
                autoClose: 8000
              })
            }
          }
        )
        .subscribe()

      return subscription
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}