import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'

interface Consultant {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

interface ConsultantWithStats extends Consultant {
  activeVisitsCount: number
  totalVisitsToday: number
  isAvailable: boolean
  conversionRate: number
  avgResponseTime: number
}

// Hook for fetching all consultants
export function useConsultants() {
  return useQuery({
    queryKey: queryKeys.consultantsList(),
    queryFn: async (): Promise<Consultant[]> => {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch consultants: ${error.message}`)
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - consultants don't change often
  })
}

// Hook for consultants with performance statistics
export function useConsultantsWithStats(timeRange: string = 'today') {
  return useQuery({
    queryKey: [...queryKeys.consultantsList(), 'stats', timeRange],
    queryFn: async (): Promise<ConsultantWithStats[]> => {
      // Get date range for statistics
      const now = new Date()
      let startDate: Date
      
      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }

      // Fetch consultants with visit statistics
      const { data, error } = await supabase
        .from('consultants')
        .select(`
          id,
          name,
          active,
          created_at,
          updated_at,
          visits!inner(
            id,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('active', true)
        .gte('visits.created_at', startDate.toISOString())

      if (error) {
        throw new Error(`Failed to fetch consultant stats: ${error.message}`)
      }

      // Calculate statistics for each consultant
      return (data || []).map(consultant => {
        const visits = consultant.visits || []
        const activeVisits = visits.filter(v => 
          v.status === 'assigned' || v.status === 'in_progress'
        )
        const completedVisits = visits.filter(v => v.status === 'completed')
        const totalVisits = visits.length
        
        // Calculate conversion rate
        const conversionRate = totalVisits > 0 ? (completedVisits.length / totalVisits) * 100 : 0
        
        // Simulate response time (in production, this would be calculated from actual data)
        const avgResponseTime = Math.random() * 30 + 5 // 5-35 minutes
        
        // Determine availability (simplified logic)
        const isAvailable = activeVisits.length < 3 // Max 3 concurrent visits

        return {
          id: consultant.id,
          name: consultant.name,
          active: consultant.active,
          created_at: consultant.created_at,
          updated_at: consultant.updated_at,
          activeVisitsCount: activeVisits.length,
          totalVisitsToday: totalVisits,
          isAvailable,
          conversionRate,
          avgResponseTime,
        }
      })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
    refetchInterval: 2 * 60 * 1000, // Update every 2 minutes
  })
}

// Hook for individual consultant details
export function useConsultant(consultantId: string) {
  return useQuery({
    queryKey: queryKeys.consultant(consultantId),
    queryFn: async (): Promise<Consultant | null> => {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', consultantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Consultant not found
        }
        throw new Error(`Failed to fetch consultant: ${error.message}`)
      }

      return data
    },
    enabled: !!consultantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation for updating consultant availability
export function useUpdateConsultantAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      consultantId, 
      active 
    }: { 
      consultantId: string
      active: boolean 
    }) => {
      const { data, error } = await supabase
        .from('consultants')
        .update({ 
          active,
          updated_at: new Date().toISOString() 
        })
        .eq('id', consultantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update consultant: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      // Update consultant cache
      queryClient.setQueryData(queryKeys.consultant(data.id), data)
      // Invalidate consultant lists
      queryClient.invalidateQueries({ queryKey: queryKeys.consultants() })
    },
  })
}

// Hook for consultant performance metrics
export function useConsultantPerformance(consultantId: string, timeRange: string = 'month') {
  return useQuery({
    queryKey: [...queryKeys.consultant(consultantId), 'performance', timeRange],
    queryFn: async () => {
      const now = new Date()
      let startDate: Date
      
      switch (timeRange) {
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
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data, error } = await supabase
        .from('visits')
        .select('id, status, created_at, updated_at, vehicle_interest')
        .eq('consultant_id', consultantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch consultant performance: ${error.message}`)
      }

      const visits = data || []
      const totalVisits = visits.length
      const completedVisits = visits.filter(v => v.status === 'completed')
      const lostVisits = visits.filter(v => v.status === 'lost')
      const activeVisits = visits.filter(v => 
        v.status === 'assigned' || v.status === 'in_progress'
      )

      return {
        totalVisits,
        completedVisits: completedVisits.length,
        lostVisits: lostVisits.length,
        activeVisits: activeVisits.length,
        conversionRate: totalVisits > 0 ? (completedVisits.length / totalVisits) * 100 : 0,
        avgDealSize: 25000, // Placeholder - calculate from actual deal values
        responseTime: Math.random() * 30 + 5, // Placeholder - calculate from actual response times
        customerSatisfaction: Math.random() * 2 + 4, // Placeholder - 4-5 stars
      }
    },
    enabled: !!consultantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}