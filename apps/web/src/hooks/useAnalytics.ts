import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { QueueVisit } from '../stores/queueStore'

interface DashboardMetrics {
  totalVisits: number
  completedVisits: number
  lostVisits: number
  activeVisits: number
  conversionRate: number
  avgDailyVisits: number
  topVehicleTypes: Array<{ type: string; count: number }>
  topConsultants: Array<{ name: string; conversions: number }>
  dailyTrends: Array<{ date: string; visits: number; conversions: number }>
}

interface SalesMetrics {
  totalRevenue: number
  avgDealSize: number
  dealsByType: Record<string, number>
  dealsByBudget: Record<string, number>
  conversionByTimeline: Record<string, { total: number; converted: number; rate: number }>
  monthlyTrends: Array<{ month: string; revenue: number; deals: number }>
}

interface PerformanceMetrics {
  consultantRankings: Array<{
    id: string
    name: string
    visits: number
    conversions: number
    rate: number
    score: number
  }>
  teamAvgConversion: number
  teamAvgResponseTime: number
  efficiencyTrends: Array<{ date: string; efficiency: number }>
}

// Dashboard metrics with intelligent caching
export function useDashboardMetrics(timeRange: string = 'month') {
  return useQuery({
    queryKey: queryKeys.dashboardMetrics(timeRange),
    queryFn: async (): Promise<DashboardMetrics> => {
      // Calculate date range
      const now = new Date()
      let startDate: Date
      let days = 30

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          days = 1
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          days = 7
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          days = 30
          break
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3
          startDate = new Date(now.getFullYear(), quarterStart, 1)
          days = 90
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          days = 365
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      // Fetch visits with related data
      const { data: visits, error } = await supabase
        .from('visits')
        .select(`
          id,
          status,
          created_at,
          vehicle_interest,
          consultant_id,
          consultants:consultant_id (
            id,
            name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch dashboard metrics: ${error.message}`)
      }

      const visitData = visits || []
      
      // Calculate basic metrics
      const totalVisits = visitData.length
      const completedVisits = visitData.filter(v => v.status === 'completed')
      const lostVisits = visitData.filter(v => v.status === 'lost')
      const activeVisits = visitData.filter(v => 
        v.status === 'assigned' || v.status === 'in_progress'
      )

      const conversionRate = totalVisits > 0 ? (completedVisits.length / totalVisits) * 100 : 0
      const avgDailyVisits = totalVisits / Math.max(days, 1)

      // Calculate top vehicle types
      const vehicleTypeCount: Record<string, number> = {}
      visitData.forEach(visit => {
        if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
          const type = visit.vehicle_interest.type || 'Unknown'
          vehicleTypeCount[type] = (vehicleTypeCount[type] || 0) + 1
        }
      })

      const topVehicleTypes = Object.entries(vehicleTypeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Calculate top consultants
      const consultantStats: Record<string, { name: string; conversions: number }> = {}
      completedVisits.forEach(visit => {
        const consultantId = visit.consultant_id
        const consultantName = visit.consultants?.name || 'Unknown'
        
        if (!consultantStats[consultantId]) {
          consultantStats[consultantId] = { name: consultantName, conversions: 0 }
        }
        consultantStats[consultantId].conversions++
      })

      const topConsultants = Object.values(consultantStats)
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 5)

      // Calculate daily trends (last 7 days for quick overview)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date
      }).reverse()

      const dailyTrends = last7Days.map(date => {
        const dateStr = date.toISOString().split('T')[0]
        const dayVisits = visitData.filter(visit => 
          visit.created_at.startsWith(dateStr)
        )
        const dayConversions = dayVisits.filter(visit => visit.status === 'completed')

        return {
          date: dateStr,
          visits: dayVisits.length,
          conversions: dayConversions.length
        }
      })

      return {
        totalVisits,
        completedVisits: completedVisits.length,
        lostVisits: lostVisits.length,
        activeVisits: activeVisits.length,
        conversionRate,
        avgDailyVisits,
        topVehicleTypes,
        topConsultants,
        dailyTrends,
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })
}

// Sales analytics with financial calculations
export function useSalesMetrics(timeRange: string = 'month') {
  return useQuery({
    queryKey: queryKeys.salesMetrics(timeRange),
    queryFn: async (): Promise<SalesMetrics> => {
      // Similar date range calculation
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
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3
          startDate = new Date(now.getFullYear(), quarterStart, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data: completedVisits, error } = await supabase
        .from('visits')
        .select('id, created_at, vehicle_interest')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())

      if (error) {
        throw new Error(`Failed to fetch sales metrics: ${error.message}`)
      }

      const visits = completedVisits || []

      // Helper function to extract budget value
      const getBudgetValue = (budgetRange: string): number => {
        if (!budgetRange) return 25000
        const matches = budgetRange.match(/(\d+)k?(?:-(\d+)k?)?\s*JD/i)
        if (!matches) return 25000
        const min = parseInt(matches[1]) * 1000
        const max = matches[2] ? parseInt(matches[2]) * 1000 : min * 1.5
        return (min + max) / 2
      }

      // Calculate revenue metrics
      let totalRevenue = 0
      const dealsByType: Record<string, number> = {}
      const dealsByBudget: Record<string, number> = {}
      const conversionByTimeline: Record<string, { total: number; converted: number; rate: number }> = {}

      visits.forEach(visit => {
        if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
          const interest = visit.vehicle_interest
          
          // Revenue calculation
          const dealValue = getBudgetValue(interest.budget_range || '')
          totalRevenue += dealValue

          // Deals by type
          const type = interest.type || 'Unknown'
          dealsByType[type] = (dealsByType[type] || 0) + 1

          // Deals by budget
          const budget = interest.budget_range || 'Not specified'
          dealsByBudget[budget] = (dealsByBudget[budget] || 0) + 1

          // Timeline analysis (simplified - would need all visits for proper conversion rate)
          const timeline = interest.purchase_timeline || 'not_specified'
          if (!conversionByTimeline[timeline]) {
            conversionByTimeline[timeline] = { total: 1, converted: 1, rate: 100 }
          } else {
            conversionByTimeline[timeline].converted++
            conversionByTimeline[timeline].total++
            conversionByTimeline[timeline].rate = 
              (conversionByTimeline[timeline].converted / conversionByTimeline[timeline].total) * 100
          }
        }
      })

      const avgDealSize = visits.length > 0 ? totalRevenue / visits.length : 0

      // Generate monthly trends (placeholder - would need historical data)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthVisits = visits.filter(visit => {
          const visitDate = new Date(visit.created_at)
          return visitDate.getMonth() === date.getMonth() && 
                 visitDate.getFullYear() === date.getFullYear()
        })
        
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthVisits.reduce((sum, visit) => {
            if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
              return sum + getBudgetValue(visit.vehicle_interest.budget_range || '')
            }
            return sum + 25000
          }, 0),
          deals: monthVisits.length
        }
      }).reverse()

      return {
        totalRevenue,
        avgDealSize,
        dealsByType,
        dealsByBudget,
        conversionByTimeline,
        monthlyTrends,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for sales data
    refetchInterval: 5 * 60 * 1000,
  })
}

// Performance metrics for consultants
export function usePerformanceMetrics(timeRange: string = 'month') {
  return useQuery({
    queryKey: queryKeys.performanceMetrics(timeRange),
    queryFn: async (): Promise<PerformanceMetrics> => {
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

      // Fetch consultant performance data
      const { data, error } = await supabase
        .from('consultants')
        .select(`
          id,
          name,
          active,
          visits!inner(
            id,
            status,
            created_at
          )
        `)
        .eq('active', true)
        .gte('visits.created_at', startDate.toISOString())

      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`)
      }

      const consultants = data || []

      // Calculate consultant rankings
      const consultantRankings = consultants.map(consultant => {
        const visits = consultant.visits || []
        const conversions = visits.filter(v => v.status === 'completed').length
        const totalVisits = visits.length
        const conversionRate = totalVisits > 0 ? (conversions / totalVisits) * 100 : 0
        
        // Performance score (weighted combination of metrics)
        const volumeScore = Math.min(100, (totalVisits / 20) * 100) // Max score at 20 visits
        const conversionScore = conversionRate
        const score = (volumeScore * 0.4) + (conversionScore * 0.6)

        return {
          id: consultant.id,
          name: consultant.name,
          visits: totalVisits,
          conversions,
          rate: conversionRate,
          score,
        }
      }).sort((a, b) => b.score - a.score)

      // Calculate team averages
      const totalConversions = consultantRankings.reduce((sum, c) => sum + c.conversions, 0)
      const totalVisits = consultantRankings.reduce((sum, c) => sum + c.visits, 0)
      const teamAvgConversion = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0
      const teamAvgResponseTime = 15 // Placeholder - would calculate from actual data

      // Generate efficiency trends (placeholder)
      const efficiencyTrends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return {
          date: date.toISOString().split('T')[0],
          efficiency: 70 + Math.random() * 30 // 70-100% range
        }
      }).reverse()

      return {
        consultantRankings,
        teamAvgConversion,
        teamAvgResponseTime,
        efficiencyTrends,
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 3 * 60 * 1000,
  })
}