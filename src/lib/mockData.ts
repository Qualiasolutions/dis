// Mock data for demo/offline mode

export const mockConsultants = [
  {
    id: '1',
    name: 'أحمد محمد',
    email: 'ahmed@tahboubgroup.com',
    role: 'consultant' as const,
    active: true,
    isAvailable: true,
    currentVisits: 2,
    performance_metrics: {
      totalSales: 15,
      conversionRate: 0.75,
      averageRating: 4.5
    }
  },
  {
    id: '2',
    name: 'فاطمة العلي',
    email: 'fatima@tahboubgroup.com',
    role: 'consultant' as const,
    active: true,
    isAvailable: true,
    currentVisits: 1,
    performance_metrics: {
      totalSales: 22,
      conversionRate: 0.82,
      averageRating: 4.8
    }
  },
  {
    id: '3',
    name: 'محمد الخوري',
    email: 'mohammed@tahboubgroup.com',
    role: 'consultant' as const,
    active: true,
    isAvailable: false,
    currentVisits: 3,
    performance_metrics: {
      totalSales: 18,
      conversionRate: 0.69,
      averageRating: 4.3
    }
  },
  {
    id: '4',
    name: 'سارة القاسم',
    email: 'sara@tahboubgroup.com',
    role: 'manager' as const,
    active: true,
    isAvailable: true,
    currentVisits: 0,
    performance_metrics: {
      totalSales: 45,
      conversionRate: 0.88,
      averageRating: 4.9
    }
  }
]

export const mockCustomers = [
  {
    id: '1',
    name: 'علي الأحمد',
    phone: '0791234567',
    email: 'ali.ahmad@email.com',
    language_preference: 'ar'
  },
  {
    id: '2',
    name: 'نور السعدي',
    phone: '0782345678',
    email: 'nour.saadi@email.com',
    language_preference: 'ar'
  },
  {
    id: '3',
    name: 'خالد المصري',
    phone: '0773456789',
    email: 'khalid.masri@email.com',
    language_preference: 'ar'
  },
  {
    id: '4',
    name: 'ليلى الزهراني',
    phone: '0794567890',
    email: 'layla.zahrani@email.com',
    language_preference: 'ar'
  },
  {
    id: '5',
    name: 'عمر التميمي',
    phone: '0785678901',
    email: 'omar.tamimi@email.com',
    language_preference: 'ar'
  }
]

export const mockVisits = [
  {
    id: '1',
    customer_id: '1',
    consultant_id: null,
    status: 'new' as const,
    source: 'walk_in' as const,
    vehicle_interest: {
      type: 'sedan',
      budget_range: '20k_30k',
      purchase_timeline: 'within_month'
    },
    notes: 'مهتم بسيارة عائلية اقتصادية',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    customer: mockCustomers[0],
    consultant: null
  },
  {
    id: '2',
    customer_id: '2',
    consultant_id: '1',
    status: 'in_progress' as const,
    source: 'walk_in' as const,
    vehicle_interest: {
      type: 'suv',
      budget_range: '30k_50k',
      purchase_timeline: 'within_week'
    },
    notes: 'تبحث عن سيارة دفع رباعي للعائلة',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    customer: mockCustomers[1],
    consultant: mockConsultants[0]
  },
  {
    id: '3',
    customer_id: '3',
    consultant_id: '2',
    status: 'assigned' as const,
    source: 'walk_in' as const,
    vehicle_interest: {
      type: 'luxury',
      budget_range: '50k_100k',
      purchase_timeline: 'immediately'
    },
    notes: 'مهتم بسيارة فارهة، لديه ميزانية جيدة',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    customer: mockCustomers[2],
    consultant: mockConsultants[1]
  },
  {
    id: '4',
    customer_id: '4',
    consultant_id: null,
    status: 'contacted' as const,
    source: 'walk_in' as const,
    vehicle_interest: {
      type: 'hatchback',
      budget_range: '10k_20k',
      purchase_timeline: 'within_3months'
    },
    notes: 'تبحث عن سيارة صغيرة للاستخدام اليومي',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    customer: mockCustomers[3],
    consultant: null
  },
  {
    id: '5',
    customer_id: '5',
    consultant_id: '3',
    status: 'completed' as const,
    source: 'walk_in' as const,
    vehicle_interest: {
      type: 'pickup',
      budget_range: '30k_50k',
      purchase_timeline: 'within_week'
    },
    notes: 'اشترى سيارة نقل للعمل',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    customer: mockCustomers[4],
    consultant: mockConsultants[2]
  }
]

// Utility functions for demo mode
export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true' || 
         import.meta.env.DEV // Always use demo mode in development
}

export const simulateNetworkDelay = (ms: number = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}