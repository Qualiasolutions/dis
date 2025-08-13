-- Database Setup Script for Dealership Intelligence System
-- Execute this in Supabase SQL Editor: https://wlmljniorublcadvorvf.supabase.co/project/wlmljniorublcadvorvf/sql
-- Date: 2025-01-13
-- Version: 1.0

-- =============================================
-- STEP 1: INITIAL SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table with Arabic text support
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(10) UNIQUE NOT NULL, -- Jordan format: 07XXXXXXXX
    name TEXT NOT NULL,
    email VARCHAR(255),
    language_preference VARCHAR(2) DEFAULT 'ar' CHECK (language_preference IN ('ar', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultants table with role-based access
CREATE TABLE IF NOT EXISTS consultants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(10),
    role VARCHAR(20) DEFAULT 'consultant' CHECK (role IN ('reception', 'consultant', 'manager', 'admin')),
    active BOOLEAN DEFAULT TRUE,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visits table with AI analysis and campaign attribution
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE RESTRICT,
    vehicle_interest JSONB NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'test_drive', 'negotiating', 'converted', 'lost')),
    purchase_timeline TEXT,
    budget_range TEXT,
    ai_analysis JSONB DEFAULT '{}',
    ai_purchase_probability DECIMAL(3,2), -- Computed column for quick access
    ai_priority_ranking INTEGER, -- Computed column for quick access  
    ai_sentiment_score DECIMAL(3,2), -- Computed column for quick access
    ai_confidence_score DECIMAL(3,2), -- Computed column for quick access
    source TEXT, -- Campaign attribution
    notes TEXT,
    consultant_notes TEXT,
    visit_duration INTEGER, -- in minutes
    interaction_quality VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: INTERACTIONS AND AI ANALYSIS TABLES
-- =============================================

-- Interactions table for communication tracking
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES consultants(id) ON DELETE SET NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'whatsapp', 'email', 'sms', 'in_person')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'failed', 'cancelled')),
    content TEXT,
    response TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Analysis Log for monitoring AI performance
CREATE TABLE IF NOT EXISTS ai_analysis_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('openai', 'fallback', 'error')),
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Predictions table for accuracy tracking
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    predicted_purchase_probability DECIMAL(3,2),
    predicted_priority_ranking INTEGER,
    predicted_conversion_days INTEGER,
    actual_purchased BOOLEAN,
    actual_conversion_date TIMESTAMP WITH TIME ZONE,
    prediction_accuracy DECIMAL(3,2), -- Calculated after outcome
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- STEP 3: PERFORMANCE INDEXES
-- =============================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_language ON customers(language_preference);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- Consultant indexes
CREATE INDEX IF NOT EXISTS idx_consultants_active ON consultants(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_consultants_role ON consultants(role);

-- Visit indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_customer ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_consultant ON visits(consultant_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_status_date ON visits(status, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_ai_priority ON visits(ai_priority_ranking DESC) WHERE ai_priority_ranking IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_ai_probability ON visits(ai_purchase_probability DESC) WHERE ai_purchase_probability IS NOT NULL;

-- AI analysis indexes
CREATE INDEX IF NOT EXISTS idx_ai_log_visit ON ai_analysis_log(visit_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_success ON ai_analysis_log(success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_method ON ai_analysis_log(method, created_at DESC);

-- Ensure ON CONFLICT on visit_id works for ai_predictions trigger
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_predictions_visit_id ON ai_predictions(visit_id);

-- Interaction indexes
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_visit ON interactions(visit_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type, created_at DESC);

-- GIN indexes for JSON columns
CREATE INDEX IF NOT EXISTS idx_visits_vehicle_interest ON visits USING GIN(vehicle_interest);
CREATE INDEX IF NOT EXISTS idx_visits_ai_analysis ON visits USING GIN(ai_analysis);
CREATE INDEX IF NOT EXISTS idx_interactions_metadata ON interactions USING GIN(metadata);

-- Arabic text search support
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_visits_notes_trgm ON visits USING GIN(notes gin_trgm_ops);

-- =============================================
-- STEP 4: TRIGGERS AND FUNCTIONS
-- =============================================

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultants_updated_at ON consultants;
CREATE TRIGGER update_consultants_updated_at BEFORE UPDATE ON consultants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visits_updated_at ON visits;
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interactions_updated_at ON interactions;
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically track AI predictions
CREATE OR REPLACE FUNCTION track_ai_prediction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if AI analysis was added/updated
    IF NEW.ai_analysis IS NOT NULL AND (OLD.ai_analysis IS NULL OR OLD.ai_analysis != NEW.ai_analysis) THEN
        INSERT INTO ai_predictions (
            visit_id,
            predicted_purchase_probability,
            predicted_priority_ranking,
            predicted_conversion_days
        ) VALUES (
            NEW.id,
            NEW.ai_purchase_probability,
            NEW.ai_priority_ranking,
            CASE 
                WHEN NEW.ai_purchase_probability > 0.8 THEN 7
                WHEN NEW.ai_purchase_probability > 0.6 THEN 14  
                WHEN NEW.ai_purchase_probability > 0.4 THEN 30
                ELSE 90
            END
        )
        ON CONFLICT (visit_id) DO UPDATE SET
            predicted_purchase_probability = EXCLUDED.predicted_purchase_probability,
            predicted_priority_ranking = EXCLUDED.predicted_priority_ranking,
            predicted_conversion_days = EXCLUDED.predicted_conversion_days;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply AI prediction tracking trigger
DROP TRIGGER IF EXISTS track_ai_prediction_trigger ON visits;
CREATE TRIGGER track_ai_prediction_trigger 
    AFTER INSERT OR UPDATE ON visits 
    FOR EACH ROW EXECUTE FUNCTION track_ai_prediction();

-- =============================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    -- In development, allow all access
    -- In production, this would check auth.jwt() for role
    RETURN 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for manager/admin check
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('manager', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for customers
CREATE POLICY "customers_select_policy" ON customers FOR SELECT USING (TRUE);
CREATE POLICY "customers_insert_policy" ON customers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "customers_update_policy" ON customers FOR UPDATE USING (TRUE);
CREATE POLICY "customers_delete_policy" ON customers FOR DELETE USING (is_manager_or_admin());

-- RLS Policies for consultants  
CREATE POLICY "consultants_select_policy" ON consultants FOR SELECT USING (TRUE);
CREATE POLICY "consultants_insert_policy" ON consultants FOR INSERT WITH CHECK (is_manager_or_admin());
CREATE POLICY "consultants_update_policy" ON consultants FOR UPDATE USING (is_manager_or_admin());
CREATE POLICY "consultants_delete_policy" ON consultants FOR DELETE USING (is_manager_or_admin());

-- RLS Policies for visits
CREATE POLICY "visits_select_policy" ON visits FOR SELECT USING (TRUE);
CREATE POLICY "visits_insert_policy" ON visits FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "visits_update_policy" ON visits FOR UPDATE USING (TRUE);
CREATE POLICY "visits_delete_policy" ON visits FOR DELETE USING (is_manager_or_admin());

-- RLS Policies for interactions
CREATE POLICY "interactions_select_policy" ON interactions FOR SELECT USING (TRUE);
CREATE POLICY "interactions_insert_policy" ON interactions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "interactions_update_policy" ON interactions FOR UPDATE USING (TRUE);
CREATE POLICY "interactions_delete_policy" ON interactions FOR DELETE USING (is_manager_or_admin());

-- RLS Policies for AI tables (read-only for most users)
CREATE POLICY "ai_log_select_policy" ON ai_analysis_log FOR SELECT USING (TRUE);
CREATE POLICY "ai_log_insert_policy" ON ai_analysis_log FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "ai_predictions_select_policy" ON ai_predictions FOR SELECT USING (TRUE);
CREATE POLICY "ai_predictions_insert_policy" ON ai_predictions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "ai_predictions_update_policy" ON ai_predictions FOR UPDATE USING (TRUE);

-- =============================================
-- STEP 6: SAMPLE DATA
-- =============================================

-- Insert sample consultants
INSERT INTO consultants (name, email, phone, role, active) VALUES
('أحمد محمد', 'ahmed.mohamed@dealership.jo', '0791234567', 'consultant', TRUE),
('سارة العلي', 'sara.ali@dealership.jo', '0792345678', 'consultant', TRUE),
('محمد خالد', 'mohammad.khalid@dealership.jo', '0793456789', 'manager', TRUE),
('ليلى حسن', 'layla.hassan@dealership.jo', '0794567890', 'reception', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (phone, name, email, language_preference) VALUES
('0791234567', 'خالد أحمد الطاهر', 'khalid.taher@email.com', 'ar'),
('0792345678', 'منى سعد العمري', 'mona.omari@email.com', 'ar'),
('0793456789', 'John Smith', 'john.smith@email.com', 'en'),
('0794567890', 'فاطمة محمد', 'fatima.mohammad@email.com', 'ar')
ON CONFLICT (phone) DO NOTHING;

-- =============================================
-- STEP 7: VIEWS FOR ANALYTICS
-- =============================================

-- Performance metrics view
CREATE OR REPLACE VIEW ai_performance_metrics AS
SELECT 
    DATE(created_at) as analysis_date,
    method,
    COUNT(*) as total_analyses,
    AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
    AVG(processing_time_ms) as avg_processing_time_ms,
    AVG(confidence_score) as avg_confidence_score
FROM ai_analysis_log 
GROUP BY DATE(created_at), method
ORDER BY analysis_date DESC;

-- Prediction accuracy view
CREATE OR REPLACE VIEW ai_prediction_accuracy AS
SELECT 
    DATE_TRUNC('week', created_at) as prediction_week,
    COUNT(*) as total_predictions,
    COUNT(CASE WHEN validated_at IS NOT NULL THEN 1 END) as completed_predictions,
    AVG(prediction_accuracy) as avg_accuracy,
    AVG(CASE WHEN predicted_purchase_probability > 0.7 THEN prediction_accuracy END) as precision_high_probability,
    COUNT(CASE WHEN actual_purchased = TRUE THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN validated_at IS NOT NULL THEN 1 END), 0) as recall_rate,
    AVG(predicted_purchase_probability) as avg_confidence
FROM ai_predictions 
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY prediction_week DESC;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if all tables were created successfully
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Sample query to verify everything works
SELECT 'Database setup completed successfully!' as status;