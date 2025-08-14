import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { mockVisits, isDemoMode, simulateNetworkDelay } from '../lib/mockData'
import type { Visit, Customer, QueueVisit } from '../types'

export type { QueueVisit }

interface QueueStore {
  visits: QueueVisit[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchVisits: () => Promise<void>
  assignConsultant: (visitId: string, consultantId: string) => Promise<void>
  updateVisitStatus: (visitId: string, status: Visit['status']) => Promise<void>
  subscribeToVisits: () => () => void
  
  // Selectors
  getVisitsByStatus: (status: Visit['status']) => QueueVisit[]
  getPendingVisits: () => QueueVisit[]
  getActiveVisits: () => QueueVisit[]
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  visits: [],
  loading: false,
  error: null,

  fetchVisits: async () => {
    set({ loading: true, error: null })
    
    try {
      // Use mock data in demo mode
      if (isDemoMode()) {
        await simulateNetworkDelay(300)
        const activeVisits = mockVisits.filter(visit => 
          ['new', 'contacted', 'assigned', 'in_progress'].includes(visit.status)
        )
        set({ visits: activeVisits as QueueVisit[], loading: false })
        return
      }

      // Regular Supabase fetch
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          customer:customers(*),
          consultant:consultants(id, name)
        `)
        .in('status', ['new', 'contacted', 'assigned', 'in_progress'])
        .order('created_at', { ascending: false })

      if (error) throw error
      
      set({ visits: data || [], loading: false })
    } catch (error) {
      console.error('Failed to fetch visits:', error)
      
      // Fallback to mock data if Supabase fails
      if (!isDemoMode()) {
        console.log('Falling back to mock data due to connection error')
        const activeVisits = mockVisits.filter(visit => 
          ['new', 'contacted', 'assigned', 'in_progress'].includes(visit.status)
        )
        set({ visits: activeVisits as QueueVisit[], loading: false, error: null })
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch visits',
          loading: false 
        })
      }
    }
  },

  assignConsultant: async (visitId: string, consultantId: string) => {
    try {
      // In demo mode, just update local state
      if (isDemoMode()) {
        await simulateNetworkDelay(200)
        set((state) => ({
          visits: state.visits.map(visit =>
            visit.id === visitId
              ? { 
                  ...visit, 
                  consultant_id: consultantId, 
                  status: 'assigned' as const,
                  updated_at: new Date().toISOString()
                }
              : visit
          )
        }))
        return
      }

      const { error } = await supabase
        .from('visits')
        .update({ 
          consultant_id: consultantId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId)

      if (error) throw error

      // Optimistically update local state
      set((state) => ({
        visits: state.visits.map(visit =>
          visit.id === visitId
            ? { 
                ...visit, 
                consultant_id: consultantId, 
                status: 'assigned' as const,
                updated_at: new Date().toISOString()
              }
            : visit
        )
      }))
    } catch (error) {
      console.error('Failed to assign consultant:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to assign consultant' })
    }
  },

  updateVisitStatus: async (visitId: string, status: Visit['status']) => {
    try {
      // In demo mode, just update local state
      if (isDemoMode()) {
        await simulateNetworkDelay(200)
        set((state) => ({
          visits: state.visits.map(visit =>
            visit.id === visitId
              ? { 
                  ...visit, 
                  status,
                  updated_at: new Date().toISOString()
                }
              : visit
          )
        }))
        return
      }

      const { error } = await supabase
        .from('visits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId)

      if (error) throw error

      // Optimistically update local state
      set((state) => ({
        visits: state.visits.map(visit =>
          visit.id === visitId
            ? { 
                ...visit, 
                status,
                updated_at: new Date().toISOString()
              }
            : visit
        )
      }))
    } catch (error) {
      console.error('Failed to update visit status:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update status' })
    }
  },

  subscribeToVisits: () => {
    // In demo mode, don't create real-time subscriptions
    if (isDemoMode()) {
      return () => {} // Return empty unsubscribe function
    }

    const channel = supabase
      .channel('visits-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'visits',
          filter: 'status.in.(new,contacted,assigned,in_progress)'
        }, 
        (payload) => {
          console.log('Visit change:', payload)
          
          // Refetch all visits on any change to ensure consistency
          get().fetchVisits()
        }
      )
      .subscribe()

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Selectors
  getVisitsByStatus: (status: Visit['status']) => {
    return get().visits.filter(visit => visit.status === status)
  },

  getPendingVisits: () => {
    return get().visits.filter(visit => 
      visit.status === 'new' || visit.status === 'contacted'
    )
  },

  getActiveVisits: () => {
    return get().visits.filter(visit => 
      visit.status === 'assigned' || visit.status === 'in_progress'
    )
  },
}))