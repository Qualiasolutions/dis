// Database types matching Supabase schema

export type VisitStatus = 'new' | 'contacted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'waiting' | 'test_drive' | 'negotiating' | 'lost'
export type CustomerType = 'individual' | 'business'

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  language_preference: 'ar' | 'en'
  created_at?: string
  updated_at?: string
}

export interface Consultant {
  id: string
  name: string
  email: string
  role: 'consultant' | 'manager' | 'admin' | 'reception'
  active: boolean
  isAvailable?: boolean
  currentVisits?: number
  performance_metrics?: {
    totalSales?: number
    conversionRate?: number
    averageRating?: number
  }
  created_at?: string
  updated_at?: string
}

export interface Visit {
  id: string
  customer_id: string
  consultant_id: string | null
  status: VisitStatus
  source: 'walk_in' | 'online' | 'phone' | 'referral'
  notes: string | null
  vehicle_interest: {
    type: string
    budget_range: string
    purchase_timeline: string
  } | null
  created_at: string
  updated_at: string
}

// Extended types for UI components
export interface QueueVisit extends Visit {
  customer: Customer
  consultant?: {
    id: string
    name: string
  }
}

export interface VisitWithRelations extends Visit {
  customer: Customer
  consultant: Consultant | null
}

// Performance metrics types
export interface PerformanceMetrics {
  totalVisits: number
  completedVisits: number
  pendingVisits: number
  conversionRate: number
  averageServiceTime: number
  averageResponseTime: number
}

// Chart data types
export interface ChartDataPoint {
  name: string
  value: number
  date?: string
}

export interface TimeSeriesData {
  date: string
  visits: number
  completed: number
  pending: number
}

// AI Analysis types
export interface AIInsight {
  id: string
  type: 'sentiment' | 'recommendation' | 'trend' | 'alert'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export interface CustomerInsight {
  customerId: string
  insights: AIInsight[]
  sentiment: 'positive' | 'neutral' | 'negative'
  riskScore: number
  recommendations: string[]
}