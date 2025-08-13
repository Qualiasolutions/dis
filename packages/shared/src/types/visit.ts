export interface VehicleInterest {
  model?: string;
  type?: string; // 'sedan', 'suv', 'truck', etc.
  budget_min?: number;
  budget_max?: number;
  purchase_timeline?: 'immediate' | '1_month' | '3_months' | '6_months';
  purchase_type?: 'cash' | 'bank_finance' | 'lease';
  features?: string[];
}

export interface AIAnalysis {
  purchase_probability: number; // 0-1 score
  sentiment_score: number; // -1 to 1 
  priority_ranking: number; // 1-10
  recommended_actions: string[];
  confidence_score: number;
  analysis_timestamp: string;
}

export interface Visit {
  id: string;
  customer_id: string;
  consultant_id: string;
  vehicle_interest: VehicleInterest; // JSON column with flexible structure
  visit_date: string;
  status: 'new' | 'contacted' | 'scheduled' | 'test_drive' | 'negotiating' | 'converted' | 'lost';
  purchase_timeline?: string;
  budget_range?: string;
  ai_analysis: AIAnalysis; // GPT-4 generated insights
  source?: string; // Campaign attribution
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitRequest {
  customer_id: string;
  consultant_id: string;
  vehicle_interest: VehicleInterest;
  status: 'new' | 'contacted' | 'scheduled' | 'test_drive' | 'negotiating' | 'converted' | 'lost';
  source?: string;
  notes?: string;
}

export interface UpdateVisitRequest {
  status?: 'new' | 'contacted' | 'scheduled' | 'test_drive' | 'negotiating' | 'converted' | 'lost';
  vehicle_interest?: Partial<VehicleInterest>;
  notes?: string;
  ai_analysis?: Partial<AIAnalysis>;
}