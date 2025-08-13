// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Dashboard metrics types
export interface DashboardMetrics {
  today: {
    total_visits: number;
    warm_leads: number;
    bookings: number;
    test_drives: number;
  };
  topModels: Array<{
    vehicle_model: string;
    interest_count: number;
  }>;
  lostReasons: Array<{
    reason_lost: string;
    count: number;
  }>;
  consultants: Array<{
    consultant_id: string;
    total_visits: number;
    conversions: number;
    avg_probability: number;
  }>;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}