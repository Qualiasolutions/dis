import { describe, it, expect } from 'vitest'
import type { QueueVisit } from '../../stores/queueStore'

// Performance metrics calculation utilities
export const calculatePerformanceMetrics = (visits: QueueVisit[], timeRange: 'today' | 'week' | 'month' = 'today') => {
  const now = new Date()
  let startDate = new Date()
  
  switch (timeRange) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'month':
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  // Filter visits for the time range
  const filteredVisits = visits.filter(visit => {
    const visitDate = new Date(visit.created_at)
    return visitDate >= startDate && visitDate <= now
  })

  const totalVisits = filteredVisits.length
  const completedVisits = filteredVisits.filter(v => v.status === 'completed').length
  const lostVisits = filteredVisits.filter(v => v.status === 'lost').length
  const inProgressVisits = filteredVisits.filter(v => v.status === 'in_progress').length
  const assignedVisits = filteredVisits.filter(v => v.status === 'assigned').length

  // Conversion rate calculation
  const eligibleForConversion = filteredVisits.filter(v => v.status !== 'new')
  const conversionRate = eligibleForConversion.length > 0 
    ? (completedVisits / eligibleForConversion.length) * 100 
    : 0

  // Average service time for completed visits
  const completedWithTimes = filteredVisits.filter(v => 
    v.status === 'completed' && v.updated_at && v.created_at
  )
  
  const averageServiceTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((acc, visit) => {
        const start = new Date(visit.created_at).getTime()
        const end = new Date(visit.updated_at!).getTime()
        return acc + (end - start)
      }, 0) / completedWithTimes.length
    : 0

  const avgServiceMinutes = Math.round(averageServiceTime / (1000 * 60))

  // Average response time
  const visitsWithResponse = filteredVisits.filter(v => 
    v.status !== 'new' && v.updated_at && v.created_at
  )
  
  const averageResponseTime = visitsWithResponse.length > 0
    ? visitsWithResponse.reduce((acc, visit) => {
        const created = new Date(visit.created_at).getTime()
        const responded = new Date(visit.updated_at!).getTime()
        return acc + (responded - created)
      }, 0) / visitsWithResponse.length
    : 0

  const avgResponseMinutes = Math.round(averageResponseTime / (1000 * 60))

  return {
    totalVisits,
    completedVisits,
    lostVisits,
    inProgressVisits,
    assignedVisits,
    conversionRate,
    avgServiceMinutes,
    avgResponseMinutes,
  }
}

// Test data
const mockVisits: QueueVisit[] = [
  {
    id: 'visit-1',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-1',
      name: 'Ahmad Salem',
      phone: '0791234567',
    },
    status: 'completed',
    created_at: '2024-01-12T09:00:00Z',
    updated_at: '2024-01-12T10:30:00Z', // 90 minutes service time
  },
  {
    id: 'visit-2',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-2',
      name: 'Sara Ahmad',
      phone: '0797654321',
    },
    status: 'completed',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T11:00:00Z', // 60 minutes service time
  },
  {
    id: 'visit-3',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-3',
      name: 'Omar Khaled',
      phone: '0798765432',
    },
    status: 'lost',
    created_at: '2024-01-12T11:00:00Z',
    updated_at: '2024-01-12T11:15:00Z', // 15 minutes response time
  },
  {
    id: 'visit-4',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-4',
      name: 'Layla Hassan',
      phone: '0799876543',
    },
    status: 'in_progress',
    created_at: '2024-01-12T12:00:00Z',
    updated_at: '2024-01-12T12:05:00Z', // 5 minutes response time
  },
  {
    id: 'visit-5',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-5',
      name: 'Fadi Nasser',
      phone: '0796543210',
    },
    status: 'assigned',
    created_at: '2024-01-12T13:00:00Z',
    updated_at: '2024-01-12T13:10:00Z', // 10 minutes response time
  },
  {
    id: 'visit-6',
    consultant_id: 'consultant-1',
    customer: {
      id: 'customer-6',
      name: 'Nour Khalil',
      phone: '0795432109',
    },
    status: 'new',
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-12T14:00:00Z',
  }
]

describe('Performance Metrics Calculations', () => {
  it('calculates total visits correctly', () => {
    const metrics = calculatePerformanceMetrics(mockVisits)
    expect(metrics.totalVisits).toBe(6)
  })

  it('calculates visit status counts correctly', () => {
    const metrics = calculatePerformanceMetrics(mockVisits)
    
    expect(metrics.completedVisits).toBe(2) // Ahmad, Sara
    expect(metrics.lostVisits).toBe(1) // Omar
    expect(metrics.inProgressVisits).toBe(1) // Layla
    expect(metrics.assignedVisits).toBe(1) // Fadi
    // New visits are counted in total but not in status breakdown logic
  })

  it('calculates conversion rate correctly', () => {
    const metrics = calculatePerformanceMetrics(mockVisits)
    
    // 2 completed out of 5 eligible (excluding 'new' status) = 40%
    expect(metrics.conversionRate).toBe(40)
  })

  it('calculates average service time correctly', () => {
    const metrics = calculatePerformanceMetrics(mockVisits)
    
    // Average of 90min (Ahmad) and 60min (Sara) = 75 minutes
    expect(metrics.avgServiceMinutes).toBe(75)
  })

  it('calculates average response time correctly', () => {
    const metrics = calculatePerformanceMetrics(mockVisits)
    
    // Average of 15min (Omar), 5min (Layla), 10min (Fadi) = 10 minutes
    expect(metrics.avgResponseMinutes).toBe(10)
  })

  it('handles empty visits array', () => {
    const metrics = calculatePerformanceMetrics([])
    
    expect(metrics.totalVisits).toBe(0)
    expect(metrics.completedVisits).toBe(0)
    expect(metrics.conversionRate).toBe(0)
    expect(metrics.avgServiceMinutes).toBe(0)
    expect(metrics.avgResponseMinutes).toBe(0)
  })

  it('handles visits without updated_at timestamps', () => {
    const visitsWithoutUpdates: QueueVisit[] = [
      {
        id: 'visit-no-update',
        consultant_id: 'consultant-1',
        customer: {
          id: 'customer-no-update',
          name: 'Test Customer',
          phone: '0791111111',
        },
        status: 'completed',
        created_at: '2024-01-12T09:00:00Z',
        // No updated_at timestamp
      }
    ]
    
    const metrics = calculatePerformanceMetrics(visitsWithoutUpdates)
    
    expect(metrics.totalVisits).toBe(1)
    expect(metrics.completedVisits).toBe(1)
    expect(metrics.avgServiceMinutes).toBe(0) // No calculable service time
    expect(metrics.avgResponseMinutes).toBe(0) // No calculable response time
  })

  it('filters by time range correctly', () => {
    // Create visits with different dates
    const mixedDateVisits: QueueVisit[] = [
      ...mockVisits,
      {
        id: 'old-visit',
        consultant_id: 'consultant-1',
        customer: {
          id: 'old-customer',
          name: 'Old Customer',
          phone: '0791111111',
        },
        status: 'completed',
        created_at: '2023-12-01T09:00:00Z', // Very old date
        updated_at: '2023-12-01T10:00:00Z',
      }
    ]

    // Mock current date to be 2024-01-12
    const originalDate = Date
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super('2024-01-12T15:00:00Z')
        } else {
          super(...args)
        }
      }
      static now() {
        return new Date('2024-01-12T15:00:00Z').getTime()
      }
    } as any

    try {
      // Today filter should exclude old visit
      const todayMetrics = calculatePerformanceMetrics(mixedDateVisits, 'today')
      expect(todayMetrics.totalVisits).toBe(6) // Only current day visits

      // Month filter should include old visit
      const monthMetrics = calculatePerformanceMetrics(mixedDateVisits, 'month')
      expect(monthMetrics.totalVisits).toBe(7) // Include the old visit
    } finally {
      global.Date = originalDate
    }
  })

  it('calculates conversion rate with only new visits correctly', () => {
    const newVisitsOnly: QueueVisit[] = [
      {
        id: 'new-visit-1',
        consultant_id: 'consultant-1',
        customer: {
          id: 'customer-new-1',
          name: 'New Customer 1',
          phone: '0791111111',
        },
        status: 'new',
        created_at: '2024-01-12T09:00:00Z',
        updated_at: '2024-01-12T09:00:00Z',
      },
      {
        id: 'new-visit-2',
        consultant_id: 'consultant-1',
        customer: {
          id: 'customer-new-2',
          name: 'New Customer 2',
          phone: '0792222222',
        },
        status: 'new',
        created_at: '2024-01-12T10:00:00Z',
        updated_at: '2024-01-12T10:00:00Z',
      }
    ]

    const metrics = calculatePerformanceMetrics(newVisitsOnly)
    
    expect(metrics.totalVisits).toBe(2)
    expect(metrics.conversionRate).toBe(0) // No eligible visits for conversion
  })

  it('handles edge cases for time calculations', () => {
    const edgeCaseVisits: QueueVisit[] = [
      {
        id: 'same-time-visit',
        consultant_id: 'consultant-1',
        customer: {
          id: 'customer-same-time',
          name: 'Same Time Customer',
          phone: '0791111111',
        },
        status: 'completed',
        created_at: '2024-01-12T09:00:00Z',
        updated_at: '2024-01-12T09:00:00Z', // Same time = 0 minutes
      }
    ]

    const metrics = calculatePerformanceMetrics(edgeCaseVisits)
    
    expect(metrics.avgServiceMinutes).toBe(0) // 0 minutes service time
    expect(metrics.avgResponseMinutes).toBe(0) // 0 minutes response time
  })

  it('validates realistic performance benchmarks', () => {
    const metrics = calculatePerformanceMetrics(mockVisits)
    
    // Realistic benchmarks validation
    expect(metrics.conversionRate).toBeGreaterThanOrEqual(0)
    expect(metrics.conversionRate).toBeLessThanOrEqual(100)
    
    expect(metrics.avgServiceMinutes).toBeGreaterThanOrEqual(0)
    expect(metrics.avgServiceMinutes).toBeLessThan(600) // Less than 10 hours
    
    expect(metrics.avgResponseMinutes).toBeGreaterThanOrEqual(0)
    expect(metrics.avgResponseMinutes).toBeLessThan(180) // Less than 3 hours
  })

  it('calculates performance ratings correctly', () => {
    const getConversionRating = (rate: number) => {
      if (rate >= 70) return 'excellent'
      if (rate >= 50) return 'good'
      return 'needs_improvement'
    }

    const getResponseTimeRating = (minutes: number) => {
      if (minutes <= 15) return 'excellent'
      if (minutes <= 30) return 'good'
      return 'slow'
    }

    const metrics = calculatePerformanceMetrics(mockVisits)
    
    expect(getConversionRating(metrics.conversionRate)).toBe('needs_improvement') // 40%
    expect(getResponseTimeRating(metrics.avgResponseMinutes)).toBe('excellent') // 10 minutes
  })
})