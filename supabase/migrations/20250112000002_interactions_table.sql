-- Interactions table for communication tracking
-- Date: 2025-01-12
-- Version: 1.0

-- Interactions table for communication tracking
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'whatsapp', 'email', 'visit', 'note')),
    content TEXT,
    outcome VARCHAR(50),
    scheduled_follow_up TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message status tracking table for WhatsApp/SMS
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'queued')),
    message_id VARCHAR(255), -- External service message ID
    cost DECIMAL(10,4) DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apply updated_at trigger to message_status
CREATE TRIGGER update_message_status_updated_at BEFORE UPDATE ON message_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE interactions IS 'Customer communication history and follow-up activities';
COMMENT ON TABLE message_status IS 'WhatsApp and SMS message delivery tracking with cost and status';
COMMENT ON COLUMN interactions.type IS 'Communication method: call, whatsapp, email, visit, note';
COMMENT ON COLUMN interactions.outcome IS 'Result of interaction: interested, not_interested, callback_requested, appointment_scheduled';
COMMENT ON COLUMN message_status.cost IS 'Message cost in JOD (Jordanian Dinars)';
COMMENT ON COLUMN message_status.message_id IS 'External service message identifier for tracking';