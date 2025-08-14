import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Connection status monitoring
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('customers').select('count').limit(1)
    return !error
  } catch {
    return false
  }
}

// Offline queue for visit creation
interface PendingVisit {
  id: string
  data: any
  timestamp: number
}

const PENDING_VISITS_KEY = 'pending_visits'

export const queueVisitForSync = (visitData: any): void => {
  const pending = getPendingVisits()
  const newVisit: PendingVisit = {
    id: crypto.randomUUID(),
    data: visitData,
    timestamp: Date.now(),
  }
  
  pending.push(newVisit)
  localStorage.setItem(PENDING_VISITS_KEY, JSON.stringify(pending))
}

export const getPendingVisits = (): PendingVisit[] => {
  const stored = localStorage.getItem(PENDING_VISITS_KEY)
  return stored ? JSON.parse(stored) : []
}

export const clearPendingVisits = (): void => {
  localStorage.removeItem(PENDING_VISITS_KEY)
}

export const syncPendingVisits = async (): Promise<void> => {
  const pending = getPendingVisits()
  if (pending.length === 0) return

  const isOnline = await checkConnection()
  if (!isOnline) return

  for (const visit of pending) {
    try {
      await createVisit(visit.data)
    } catch (error) {
      console.error('Failed to sync visit:', visit.id, error)
      // Keep failed visits in queue
      continue
    }
  }

  clearPendingVisits()
}

// Visit creation with automatic customer deduplication
export const createVisit = async (visitData: {
  customerName: string
  customerPhone: string
  customerEmail?: string
  vehicleType: string
  budgetRange: string
  purchaseTimeline: string
  notes?: string
}) => {
  // First, check if customer exists by phone number
  const { data: existingCustomer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', visitData.customerPhone)
    .single()

  let customerId: string

  if (existingCustomer) {
    // Customer exists, use their ID
    customerId = existingCustomer.id
  } else {
    // Create new customer
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        name: visitData.customerName,
        phone: visitData.customerPhone,
        email: visitData.customerEmail,
        language_preference: 'ar', // Default to Arabic for Jordan
      })
      .select('id')
      .single()

    if (createError) throw createError
    customerId = newCustomer.id
  }

  // Create the visit
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .insert({
      customer_id: customerId,
      consultant_id: null, // Will be assigned later
      vehicle_interest: {
        type: visitData.vehicleType,
        budget_range: visitData.budgetRange,
        purchase_timeline: visitData.purchaseTimeline,
      },
      notes: visitData.notes,
      status: 'new',
      source: 'walk_in',
    })
    .select()
    .single()

  if (visitError) throw visitError
  return visit
}