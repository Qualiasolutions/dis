-- Initial Schema for Dealership Intelligence System (DIS)
-- Date: 2025-01-12
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table with Arabic text support
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(10) UNIQUE NOT NULL, -- Jordan format: 07XXXXXXXX
    name TEXT NOT NULL,
    email VARCHAR(255),
    language_preference VARCHAR(2) DEFAULT 'ar' CHECK (language_preference IN ('ar', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultants table with role-based access
CREATE TABLE consultants (
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
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE RESTRICT,
    vehicle_interest JSONB NOT NULL,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'test_drive', 'negotiating', 'converted', 'lost')),
    purchase_timeline TEXT,
    budget_range TEXT,
    ai_analysis JSONB DEFAULT '{}',
    source TEXT, -- Campaign attribution
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultants_updated_at BEFORE UPDATE ON consultants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE customers IS 'Customer information with bilingual support and deduplication by phone';
COMMENT ON TABLE consultants IS 'Sales staff and reception personnel with performance metrics';
COMMENT ON TABLE visits IS 'Customer visit records with AI analysis and campaign attribution';
COMMENT ON COLUMN customers.phone IS 'Jordan mobile format (07XXXXXXXX) used as primary deduplication key';
COMMENT ON COLUMN visits.ai_analysis IS 'OpenAI GPT-4 analysis results including purchase probability and sentiment';
COMMENT ON COLUMN visits.vehicle_interest IS 'Customer vehicle preferences and requirements in JSON format';