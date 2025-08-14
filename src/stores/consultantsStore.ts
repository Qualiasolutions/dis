import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Consultant } from '../types'

interface ConsultantWithStats extends Consultant {
  activeVisitsCount: number
  totalVisitsToday: number
  isAvailable: boolean
}

interface ConsultantsStore {
  consultants: ConsultantWithStats[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchConsultants: () => Promise<void>
  toggleConsultantAvailability: (consultantId: string) => Promise<void>
  
  // Selectors
  getAvailableConsultants: () => ConsultantWithStats[]
  getLeastBusyConsultant: () => ConsultantWithStats | null
}

export const useConsultantsStore = create<ConsultantsStore>((set, get) => ({
  consultants: [],
  loading: false,
  error: null,

  fetchConsultants: async () => {
    set({ loading: true, error: null })
    
    try {
      // Fetch consultants with their visit counts
      const { data: consultants, error: consultantsError } = await supabase
        .from('consultants')
        .select('*')
        .eq('active', true)
        .order('name')

      if (consultantsError) throw consultantsError

      // Fetch visit statistics for each consultant
      const consultantsWithStats = await Promise.all(
        (consultants || []).map(async (consultant) => {
          // Get active visits count
          const { count: activeCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact' })
            .eq('consultant_id', consultant.id)
            .in('status', ['assigned', 'in_progress'])

          // Get today's total visits
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const { count: todayCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact' })
            .eq('consultant_id', consultant.id)
            .gte('created_at', today.toISOString())

          return {
            ...consultant,
            activeVisitsCount: activeCount || 0,
            totalVisitsToday: todayCount || 0,
            isAvailable: consultant.active && (activeCount || 0) < 5, // Max 5 active visits
          }
        })
      )

      set({ consultants: consultantsWithStats, loading: false })
    } catch (error) {
      console.error('Failed to fetch consultants:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch consultants',
        loading: false 
      })
    }
  },

  toggleConsultantAvailability: async (consultantId: string) => {
    const consultant = get().consultants.find(c => c.id === consultantId)
    if (!consultant) return

    const newAvailability = !consultant.active

    try {
      const { error } = await supabase
        .from('consultants')
        .update({ active: newAvailability })
        .eq('id', consultantId)

      if (error) throw error

      // Update local state
      set((state) => ({
        consultants: state.consultants.map(c =>
          c.id === consultantId
            ? { ...c, active: newAvailability, isAvailable: newAvailability && c.activeVisitsCount < 5 }
            : c
        )
      }))
    } catch (error) {
      console.error('Failed to toggle consultant availability:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update availability' })
    }
  },

  // Selectors
  getAvailableConsultants: () => {
    return get().consultants.filter(consultant => consultant.isAvailable)
  },

  getLeastBusyConsultant: () => {
    const available = get().getAvailableConsultants()
    if (available.length === 0) return null

    return available.reduce((least, current) => 
      current.activeVisitsCount < least.activeVisitsCount ? current : least
    )
  },
}))