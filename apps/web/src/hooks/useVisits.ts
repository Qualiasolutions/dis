import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys, queryPerformance } from '../lib/queryClient'
import type { QueueVisit } from '../stores/queueStore'

interface VisitFilters {
  status?: string[]
  consultantId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year'
}

// Custom hook for fetching visits with intelligent caching
export function useVisits(filters?: VisitFilters) {
  return useQuery({
    queryKey: queryKeys.visitsList(filters),
    queryFn: async (): Promise<QueueVisit[]> => {
      const startTime = performance.now()
      
      let query = supabase
        .from('visits')
        .select(`
          id,
          customer_id,
          consultant_id,
          status,
          created_at,
          updated_at,
          customer_name,
          customer_phone,
          vehicle_interest,
          consultant_notes,
          ai_analysis,
          customers:customer_id (
            id,
            name,
            phone,
            email,
            language_preference
          ),
          consultants:consultant_id (
            id,
            name,
            active
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      }
      
      if (filters?.consultantId) {
        query = query.eq('consultant_id', filters.consultantId)
      }
      
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString())
      }
      
      if (filters?.timeRange) {
        const now = new Date()
        let startDate: Date
        
        switch (filters.timeRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3
            startDate = new Date(now.getFullYear(), quarterStart, 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query.limit(1000) // Prevent excessive data loading
      
      if (error) {
        throw new Error(`Failed to fetch visits: ${error.message}`)
      }

      const duration = performance.now() - startTime
      queryPerformance.logSlowQueries(queryKeys.visitsList(filters), duration)

      // Transform data to match QueueVisit interface
      return (data || []).map(visit => ({
        id: visit.id,
        customer_id: visit.customer_id,
        consultant_id: visit.consultant_id,
        status: visit.status,
        created_at: visit.created_at,
        updated_at: visit.updated_at,
        customer_name: visit.customers?.name || 'Unknown',
        customer_phone: visit.customers?.phone || '',
        vehicle_interest: visit.vehicle_interest,
        consultant_notes: visit.consultant_notes,
        ai_analysis: visit.ai_analysis,
      }))
    },
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
  })
}

// Hook for single visit details
export function useVisit(visitId: string) {
  return useQuery({
    queryKey: queryKeys.visit(visitId),
    queryFn: async (): Promise<QueueVisit | null> => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          customer_id,
          consultant_id,
          status,
          created_at,
          updated_at,
          customer_name,
          customer_phone,
          vehicle_interest,
          consultant_notes,
          ai_analysis,
          customers:customer_id (
            id,
            name,
            phone,
            email,
            language_preference
          ),
          consultants:consultant_id (
            id,
            name,
            active
          )
        `)
        .eq('id', visitId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Visit not found
        }
        throw new Error(`Failed to fetch visit: ${error.message}`)
      }

      return {
        id: data.id,
        customer_id: data.customer_id,
        consultant_id: data.consultant_id,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        customer_name: data.customers?.name || 'Unknown',
        customer_phone: data.customers?.phone || '',
        vehicle_interest: data.vehicle_interest,
        consultant_notes: data.consultant_notes,
        ai_analysis: data.ai_analysis,
      }
    },
    enabled: !!visitId,
    staleTime: 2 * 60 * 1000, // 2 minutes for individual visits
  })
}

// Mutation for updating visit status
export function useUpdateVisitStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      visitId, 
      status, 
      notes 
    }: { 
      visitId: string
      status: string
      notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({ 
          status, 
          consultant_notes: notes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', visitId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update visit: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate and refetch visit lists
      queryClient.invalidateQueries({ queryKey: queryKeys.visits() })
      // Update specific visit cache
      queryClient.setQueryData(queryKeys.visit(data.id), data)
    },
  })
}

// Mutation for creating new visits
export function useCreateVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (visitData: Omit<QueueVisit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('visits')
        .insert({
          customer_id: visitData.customer_id,
          consultant_id: visitData.consultant_id,
          status: visitData.status,
          customer_name: visitData.customer_name,
          customer_phone: visitData.customer_phone,
          vehicle_interest: visitData.vehicle_interest,
          consultant_notes: visitData.consultant_notes,
          ai_analysis: visitData.ai_analysis || {},
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create visit: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      // Invalidate visit lists to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.visits() })
    },
  })
}

// Real-time subscription hook
export function useVisitsSubscription(filters?: VisitFilters) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['visits-subscription', filters],
    queryFn: () => {
      const channel = supabase
        .channel('visits-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'visits',
          },
          (payload) => {
            // Invalidate visits queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.visits() })
            
            // If it's an update/insert, optimistically update the cache
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const visitId = payload.new?.id
              if (visitId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.visit(visitId) })
              }
            }
          }
        )
        .subscribe()

      return channel
    },
    enabled: true,
    staleTime: Infinity, // Keep subscription alive
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}