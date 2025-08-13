-- Performance indexes for analytics queries
-- Date: 2025-01-12
-- Version: 1.0

-- Enable trigram extension for text search (needed for Arabic/English search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Core lookup indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_language ON customers(language_preference);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Visit-related indexes for dashboard queries
CREATE INDEX idx_visits_customer_id ON visits(customer_id);
CREATE INDEX idx_visits_consultant_id ON visits(consultant_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_source ON visits(source);
CREATE INDEX idx_visits_created_at ON visits(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_visits_status_date ON visits(status, visit_date);
CREATE INDEX idx_visits_consultant_status ON visits(consultant_id, status);
CREATE INDEX idx_visits_date_source ON visits(visit_date, source);

-- Interaction tracking indexes
CREATE INDEX idx_interactions_visit_id ON interactions(visit_id);
CREATE INDEX idx_interactions_consultant_id ON interactions(consultant_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);
CREATE INDEX idx_interactions_scheduled_follow_up ON interactions(scheduled_follow_up) WHERE scheduled_follow_up IS NOT NULL;

-- Message status indexes
CREATE INDEX idx_message_status_customer_id ON message_status(customer_id);
CREATE INDEX idx_message_status_channel ON message_status(channel);
CREATE INDEX idx_message_status_status ON message_status(status);
CREATE INDEX idx_message_status_created_at ON message_status(created_at);

-- Consultant performance indexes
CREATE INDEX idx_consultants_active ON consultants(active);
CREATE INDEX idx_consultants_role ON consultants(role);

-- GIN indexes for JSON columns (analytics on vehicle preferences and AI analysis)
CREATE INDEX idx_visits_vehicle_interest ON visits USING GIN (vehicle_interest);
CREATE INDEX idx_visits_ai_analysis ON visits USING GIN (ai_analysis);
CREATE INDEX idx_consultants_performance_metrics ON consultants USING GIN (performance_metrics);

-- Partial indexes for active records only
CREATE INDEX idx_visits_active_consultant ON visits(consultant_id) WHERE status NOT IN ('converted', 'lost');
CREATE INDEX idx_consultants_active_users ON consultants(id) WHERE active = true;

-- Text search indexes for Arabic/English content
CREATE INDEX idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);
CREATE INDEX idx_interactions_content_trgm ON interactions USING GIN (content gin_trgm_ops) WHERE content IS NOT NULL;

-- Comments for index documentation
COMMENT ON INDEX idx_visits_vehicle_interest IS 'GIN index for fast JSON queries on vehicle preferences';
COMMENT ON INDEX idx_visits_ai_analysis IS 'GIN index for AI analysis JSON queries (purchase probability, sentiment)';
COMMENT ON INDEX idx_customers_name_trgm IS 'Trigram index for Arabic/English name search';
COMMENT ON INDEX idx_visits_status_date IS 'Composite index for dashboard status filtering by date range';