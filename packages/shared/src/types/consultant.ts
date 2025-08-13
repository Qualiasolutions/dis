export interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'reception' | 'consultant' | 'manager' | 'admin';
  active: boolean;
  performance_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateConsultantRequest {
  name: string;
  email: string;
  phone?: string;
  role: 'reception' | 'consultant' | 'manager' | 'admin';
}