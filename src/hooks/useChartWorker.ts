import { useEffect, useRef, useState } from 'react'
import { wrap } from 'comlink'
import type { QueueVisit } from '../stores/queueStore'

// Type definitions for worker methods
type ChartWorkerType = {
  calculateVisitTrends: (visits: QueueVisit[], timeRange: string) => Promise<any[]>
  calculateConsultantPerformance: (visits: QueueVisit[], consultants: any[]) => Promise<any[]>
  calculateVehicleInterest: (visits: QueueVisit[], dataType: string) => Promise<any[]>
  calculateConversionFunnel: (visits: QueueVisit[]) => Promise<any[]>
  calculateDashboardMetrics: (visits: QueueVisit[], timeRange: string) => Promise<any>
}

export function useChartWorker() {
  const workerRef = useRef<Worker | null>(null)
  const apiRef = useRef<ChartWorkerType | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize Web Worker
    const initWorker = async () => {
      try {
        // Create worker from TypeScript file (Vite will handle compilation)
        workerRef.current = new Worker(
          new URL('../workers/chartWorker.ts', import.meta.url),
          { type: 'module' }
        )

        // Wrap worker with Comlink
        apiRef.current = wrap<ChartWorkerType>(workerRef.current)
        setIsReady(true)
      } catch (error) {
        console.error('Failed to initialize chart worker:', error)
        setIsReady(false)
      }
    }

    initWorker()

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
        apiRef.current = null
        setIsReady(false)
      }
    }
  }, [])

  // Memoized calculation functions with error handling
  const calculateVisitTrends = async (visits: QueueVisit[], timeRange: string) => {
    if (!isReady || !apiRef.current) {
      // Fallback to main thread calculation
      return calculateVisitTrendsFallback(visits, timeRange)
    }

    try {
      return await apiRef.current.calculateVisitTrends(visits, timeRange)
    } catch (error) {
      console.error('Worker calculation failed, using fallback:', error)
      return calculateVisitTrendsFallback(visits, timeRange)
    }
  }

  const calculateConsultantPerformance = async (
    visits: QueueVisit[], 
    consultants: Array<{ id: string; name: string; active: boolean }>
  ) => {
    if (!isReady || !apiRef.current) {
      return calculateConsultantPerformanceFallback(visits, consultants)
    }

    try {
      return await apiRef.current.calculateConsultantPerformance(visits, consultants)
    } catch (error) {
      console.error('Worker calculation failed, using fallback:', error)
      return calculateConsultantPerformanceFallback(visits, consultants)
    }
  }

  const calculateVehicleInterest = async (
    visits: QueueVisit[], 
    dataType: 'type' | 'brand' | 'budget' | 'transmission'
  ) => {
    if (!isReady || !apiRef.current) {
      return calculateVehicleInterestFallback(visits, dataType)
    }

    try {
      return await apiRef.current.calculateVehicleInterest(visits, dataType)
    } catch (error) {
      console.error('Worker calculation failed, using fallback:', error)
      return calculateVehicleInterestFallback(visits, dataType)
    }
  }

  const calculateConversionFunnel = async (visits: QueueVisit[]) => {
    if (!isReady || !apiRef.current) {
      return calculateConversionFunnelFallback(visits)
    }

    try {
      return await apiRef.current.calculateConversionFunnel(visits)
    } catch (error) {
      console.error('Worker calculation failed, using fallback:', error)
      return calculateConversionFunnelFallback(visits)
    }
  }

  const calculateDashboardMetrics = async (visits: QueueVisit[], timeRange: string) => {
    if (!isReady || !apiRef.current) {
      return calculateDashboardMetricsFallback(visits, timeRange)
    }

    try {
      return await apiRef.current.calculateDashboardMetrics(visits, timeRange)
    } catch (error) {
      console.error('Worker calculation failed, using fallback:', error)
      return calculateDashboardMetricsFallback(visits, timeRange)
    }
  }

  return {
    isReady,
    calculateVisitTrends,
    calculateConsultantPerformance,
    calculateVehicleInterest,
    calculateConversionFunnel,
    calculateDashboardMetrics,
  }
}

// Fallback implementations for main thread
function calculateVisitTrendsFallback(visits: QueueVisit[], timeRange: string) {
  // Simplified main thread calculation
  const now = new Date()
  let days = 7

  switch (timeRange) {
    case 'today': days = 1; break
    case 'week': days = 7; break
    case 'month': days = 30; break
    case 'quarter': days = 90; break
    case 'year': days = 365; break
  }

  const result = []
  for (let i = 0; i < Math.min(days, 30); i++) { // Limit to 30 days for performance
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayVisits = visits.filter(visit => 
      visit.created_at.startsWith(dateStr)
    )
    const dayCompletions = dayVisits.filter(visit => visit.status === 'completed')

    result.unshift({
      date: dateStr,
      totalVisits: dayVisits.length,
      completedVisits: dayCompletions.length,
      conversionRate: dayVisits.length > 0 ? (dayCompletions.length / dayVisits.length) * 100 : 0,
      formattedDate: timeRange === 'today' 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    })
  }

  return result
}

function calculateConsultantPerformanceFallback(
  visits: QueueVisit[], 
  consultants: Array<{ id: string; name: string; active: boolean }>
) {
  return consultants
    .filter(c => c.active)
    .map(consultant => {
      const consultantVisits = visits.filter(v => v.consultant_id === consultant.id)
      const conversions = consultantVisits.filter(v => v.status === 'completed').length
      const conversionRate = consultantVisits.length > 0 ? (conversions / consultantVisits.length) * 100 : 0

      return {
        consultantId: consultant.id,
        visits: consultantVisits.length,
        conversions,
        conversionRate,
        avgResponseTime: Math.random() * 30 + 5,
        performanceScore: conversionRate * 0.7 + (Math.min(consultantVisits.length / 10, 1) * 30)
      }
    })
    .sort((a, b) => b.performanceScore - a.performanceScore)
}

function calculateVehicleInterestFallback(
  visits: QueueVisit[], 
  dataType: 'type' | 'brand' | 'budget' | 'transmission'
) {
  const counts: Record<string, number> = {}
  
  visits.forEach(visit => {
    if (visit.vehicle_interest && typeof visit.vehicle_interest === 'object') {
      const key = visit.vehicle_interest[dataType] || 'Not specified'
      counts[key] = (counts[key] || 0) + 1
    }
  })

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  
  return Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
}

function calculateConversionFunnelFallback(visits: QueueVisit[]) {
  const total = visits.length
  if (total === 0) return []

  const assigned = visits.filter(v => v.status !== 'waiting').length
  const inProgress = visits.filter(v => v.status === 'in_progress').length
  const testDrive = visits.filter(v => v.status === 'test_drive').length
  const completed = visits.filter(v => v.status === 'completed').length

  return [
    { name: 'Initial Visits', count: total, percentage: 100, color: 'blue' },
    { name: 'Engaged', count: assigned, percentage: (assigned / total) * 100, color: 'cyan' },
    { name: 'In Progress', count: inProgress, percentage: (inProgress / total) * 100, color: 'yellow' },
    { name: 'Test Drive', count: testDrive, percentage: (testDrive / total) * 100, color: 'orange' },
    { name: 'Completed', count: completed, percentage: (completed / total) * 100, color: 'green' }
  ]
}

function calculateDashboardMetricsFallback(visits: QueueVisit[], timeRange: string) {
  const total = visits.length
  const completed = visits.filter(v => v.status === 'completed').length
  const lost = visits.filter(v => v.status === 'lost').length
  const active = visits.filter(v => v.status === 'assigned' || v.status === 'in_progress').length

  return {
    summary: {
      totalVisits: total,
      completedVisits: completed,
      lostVisits: lost,
      activeVisits: active,
      conversionRate: total > 0 ? (completed / total) * 100 : 0
    },
    visitTrends: calculateVisitTrendsFallback(visits, timeRange),
    conversionFunnel: calculateConversionFunnelFallback(visits),
    vehicleInterest: calculateVehicleInterestFallback(visits, 'type')
  }
}