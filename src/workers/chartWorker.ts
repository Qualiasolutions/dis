import { expose } from 'comlink'
import type { QueueVisit } from '../types'

interface ChartDataPoint {
  date: string
  totalVisits: number
  completedVisits: number
  conversionRate: number
  formattedDate: string
}

interface PerformanceMetrics {
  consultantId: string
  visits: number
  conversions: number
  conversionRate: number
  avgResponseTime: number
  performanceScore: number
}

interface VehicleInterestData {
  type: string
  count: number
  percentage: number
}

// Heavy calculation functions moved to Web Worker
const chartCalculations = {
  // Calculate visit trends data with optimizations
  calculateVisitTrends: (
    visits: QueueVisit[], 
    timeRange: string
  ): ChartDataPoint[] => {
    if (visits.length === 0) return []

    const now = new Date()
    let days = 7

    switch (timeRange) {
      case 'today':
        days = 1
        break
      case 'week':
        days = 7
        break
      case 'month':
        days = 30
        break
      case 'quarter':
        days = 90
        break
      case 'year':
        days = 365
        break
    }

    // Create date range efficiently
    const dateMap = new Map<string, { total: number; completed: number }>()
    
    // Initialize date range
    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dateMap.set(dateStr, { total: 0, completed: 0 })
    }

    // Process visits efficiently
    visits.forEach(visit => {
      const visitDate = visit.created_at ? new Date(visit.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      const dayData = dateMap.get(visitDate!)
      
      if (dayData) {
        dayData.total++
        if (visit.status === 'completed') {
          dayData.completed++
        }
      }
    })

    // Convert to chart data
    const result: ChartDataPoint[] = []
    const sortedDates = Array.from(dateMap.keys()).sort()
    
    sortedDates.forEach(dateStr => {
      const data = dateMap.get(dateStr)!
      const date = new Date(dateStr)
      
      result.push({
        date: dateStr,
        totalVisits: data.total,
        completedVisits: data.completed,
        conversionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        formattedDate: timeRange === 'today' 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      })
    })

    return result
  },

  // Calculate consultant performance metrics
  calculateConsultantPerformance: (
    visits: QueueVisit[],
    consultants: Array<{ id: string; name: string; active: boolean }>
  ): PerformanceMetrics[] => {
    const consultantStats = new Map<string, {
      visits: number
      conversions: number
      totalResponseTime: number
      responseCount: number
    }>()

    // Initialize consultant stats
    consultants.forEach(consultant => {
      if (consultant.active) {
        consultantStats.set(consultant.id, {
          visits: 0,
          conversions: 0,
          totalResponseTime: 0,
          responseCount: 0
        })
      }
    })

    // Process visits
    visits.forEach(visit => {
      const consultantId = visit.consultant?.id || visit.consultant_id
    const stats = consultantStats.get(consultantId)
      if (stats) {
        stats.visits++
        if (visit.status === 'completed') {
          stats.conversions++
        }
        
        // Simulate response time calculation (in production, this would be real data)
        const responseTime = Math.random() * 30 + 5 // 5-35 minutes
        stats.totalResponseTime += responseTime
        stats.responseCount++
      }
    })

    // Calculate final metrics
    const result: PerformanceMetrics[] = []
    consultantStats.forEach((stats, consultantId) => {
      const conversionRate = stats.visits > 0 ? (stats.conversions / stats.visits) * 100 : 0
      const avgResponseTime = stats.responseCount > 0 ? stats.totalResponseTime / stats.responseCount : 0
      
      // Performance score calculation
      const volumeScore = Math.min(100, (stats.visits / 20) * 100)
      const conversionScore = conversionRate
      const responseScore = Math.max(0, 100 - (avgResponseTime / 60) * 100)
      const performanceScore = (volumeScore * 0.3) + (conversionScore * 0.5) + (responseScore * 0.2)

      result.push({
        consultantId,
        visits: stats.visits,
        conversions: stats.conversions,
        conversionRate,
        avgResponseTime,
        performanceScore
      })
    })

    return result.sort((a, b) => b.performanceScore - a.performanceScore)
  },

  // Calculate vehicle interest distribution
  calculateVehicleInterest: (
    visits: QueueVisit[],
    dataType: 'type' | 'brand' | 'budget' | 'transmission'
  ): VehicleInterestData[] => {
    const interestMap = new Map<string, number>()
    let total = 0

    visits.forEach(visit => {
      if (visit.vehicle_interest) {
        let key = ''
        
        switch (dataType) {
          case 'type':
            key = (visit.vehicle_interest as any)?.type || 'Not specified'
            break
          case 'brand':
            key = (visit.vehicle_interest as any)?.brand || 'Not specified'
            break
          case 'budget':
            key = (visit.vehicle_interest as any)?.budget_range || 'Not specified'
            break
          case 'transmission':
            key = (visit.vehicle_interest as any)?.transmission || 'Not specified'
            break
        }
        
        interestMap.set(key, (interestMap.get(key) || 0) + 1)
        total++
      }
    })

    return Array.from(interestMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  },

  // Calculate conversion funnel data
  calculateConversionFunnel: (visits: QueueVisit[]) => {
    if (visits.length === 0) return []

    const totalVisits = visits.length
    const assignedVisits = visits.filter(v => 
      v.status !== 'waiting' && v.status !== 'cancelled'
    ).length
    const inProgressVisits = visits.filter(v => 
      v.status === 'in_progress' || v.status === 'test_drive' || v.status === 'negotiating'
    ).length
    const testDriveVisits = visits.filter(v => 
      v.status === 'test_drive' || v.status === 'negotiating' || v.status === 'completed'
    ).length
    const completedVisits = visits.filter(v => v.status === 'completed').length

    return [
      {
        name: 'Initial Visits',
        count: totalVisits,
        percentage: 100,
        color: 'blue'
      },
      {
        name: 'Engaged with Consultant',
        count: assignedVisits,
        percentage: totalVisits > 0 ? (assignedVisits / totalVisits) * 100 : 0,
        color: 'cyan'
      },
      {
        name: 'Active Interest',
        count: inProgressVisits,
        percentage: totalVisits > 0 ? (inProgressVisits / totalVisits) * 100 : 0,
        color: 'yellow'
      },
      {
        name: 'Test Drive/Negotiation',
        count: testDriveVisits,
        percentage: totalVisits > 0 ? (testDriveVisits / totalVisits) * 100 : 0,
        color: 'orange'
      },
      {
        name: 'Converted to Sale',
        count: completedVisits,
        percentage: totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0,
        color: 'green'
      }
    ]
  },

  // Batch calculation for dashboard metrics
  calculateDashboardMetrics: (visits: QueueVisit[], timeRange: string) => {
    const visitTrends = chartCalculations.calculateVisitTrends(visits, timeRange)
    const conversionFunnel = chartCalculations.calculateConversionFunnel(visits)
    const vehicleInterest = chartCalculations.calculateVehicleInterest(visits, 'type')

    // Calculate summary statistics
    const totalVisits = visits.length
    const completedVisits = visits.filter(v => v.status === 'completed').length
    const lostVisits = visits.filter(v => v.status === 'lost').length
    const activeVisits = visits.filter(v => 
      v.status === 'assigned' || v.status === 'in_progress'
    ).length

    const conversionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0

    return {
      summary: {
        totalVisits,
        completedVisits,
        lostVisits,
        activeVisits,
        conversionRate
      },
      visitTrends,
      conversionFunnel,
      vehicleInterest
    }
  }
}

// Expose the API to the main thread
expose(chartCalculations)