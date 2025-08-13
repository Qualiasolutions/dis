import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Garbage collection: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay: exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,
      // Background refetch every 30 seconds for real-time data
      refetchInterval: 30 * 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Query keys factory for consistency
export const queryKeys = {
  all: ['app'] as const,
  
  // Visits
  visits: () => [...queryKeys.all, 'visits'] as const,
  visitsList: (filters?: any) => [...queryKeys.visits(), 'list', filters] as const,
  visit: (id: string) => [...queryKeys.visits(), 'detail', id] as const,
  
  // Consultants
  consultants: () => [...queryKeys.all, 'consultants'] as const,
  consultantsList: () => [...queryKeys.consultants(), 'list'] as const,
  consultant: (id: string) => [...queryKeys.consultants(), 'detail', id] as const,
  
  // Analytics
  analytics: () => [...queryKeys.all, 'analytics'] as const,
  dashboardMetrics: (timeRange: string) => [...queryKeys.analytics(), 'dashboard', timeRange] as const,
  salesMetrics: (timeRange: string) => [...queryKeys.analytics(), 'sales', timeRange] as const,
  performanceMetrics: (timeRange: string) => [...queryKeys.analytics(), 'performance', timeRange] as const,
  
  // AI Analysis
  aiAnalysis: () => [...queryKeys.all, 'ai'] as const,
  visitAnalysis: (visitId: string) => [...queryKeys.aiAnalysis(), 'visit', visitId] as const,
  customerInsights: (customerId: string) => [...queryKeys.aiAnalysis(), 'customer', customerId] as const,
}

// Performance monitoring
export const queryPerformance = {
  logSlowQueries: (queryKey: string[], duration: number) => {
    if (duration > 2000) {
      console.warn(`Slow query detected: ${queryKey.join('.')} took ${duration}ms`)
    }
  },
  
  trackCacheHits: (queryKey: string[], fromCache: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query ${queryKey.join('.')}: ${fromCache ? 'cache hit' : 'network request'}`)
    }
  }
}