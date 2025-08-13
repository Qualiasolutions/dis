-- Seed data for Dealership Intelligence System (DIS)
-- Date: 2025-01-12
-- Version: 1.0

-- Insert default consultants for testing and initial setup
INSERT INTO consultants (id, name, email, phone, role, active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Reception Staff', 'reception@dealership.jo', '0791234567', 'reception', true),
    ('00000000-0000-0000-0000-000000000002', 'Ahmed Al-Mansouri', 'ahmed@dealership.jo', '0791234568', 'consultant', true),
    ('00000000-0000-0000-0000-000000000003', 'Fatima Al-Zahra', 'fatima@dealership.jo', '0791234569', 'consultant', true),
    ('00000000-0000-0000-0000-000000000004', 'Omar Al-Rashid', 'omar@dealership.jo', '0791234570', 'consultant', true),
    ('00000000-0000-0000-0000-000000000005', 'Manager User', 'manager@dealership.jo', '0791234571', 'manager', true),
    ('00000000-0000-0000-0000-000000000006', 'System Admin', 'admin@dealership.jo', '0791234572', 'admin', true);

-- Insert sample customers for testing
INSERT INTO customers (id, phone, name, email, language_preference) VALUES
    ('11111111-1111-1111-1111-111111111111', '0791234501', 'محمد أحمد الخطيب', 'mohammed.khatib@email.com', 'ar'),
    ('11111111-1111-1111-1111-111111111112', '0791234502', 'Sarah Johnson', 'sarah.johnson@email.com', 'en'),
    ('11111111-1111-1111-1111-111111111113', '0791234503', 'علياء محمد السعد', 'alia.saad@email.com', 'ar'),
    ('11111111-1111-1111-1111-111111111114', '0791234504', 'David Smith', 'david.smith@email.com', 'en'),
    ('11111111-1111-1111-1111-111111111115', '0791234505', 'نور الدين محمود', 'noor.mahmoud@email.com', 'ar');

-- Insert sample visits for testing
INSERT INTO visits (
    id, 
    customer_id, 
    consultant_id, 
    vehicle_interest, 
    visit_date, 
    status, 
    purchase_timeline, 
    budget_range,
    source,
    notes
) VALUES
    (
        '22222222-2222-2222-2222-222222222221',
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000002',
        '{"type": "sedan", "brand": "toyota", "budget_range": "25000-35000", "features": ["automatic", "leather_seats"], "color_preference": "white"}',
        NOW() - INTERVAL '2 hours',
        'new',
        '1-month',
        '25000-35000 JOD',
        'walk-in',
        'Interested in Toyota Camry 2024, prefers automatic transmission'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111112',
        '00000000-0000-0000-0000-000000000003',
        '{"type": "suv", "brand": "nissan", "budget_range": "35000-50000", "features": ["4wd", "sunroof"], "color_preference": "black"}',
        NOW() - INTERVAL '1 day',
        'contacted',
        'immediate',
        '35000-50000 JOD',
        'facebook-ad',
        'Looking for family SUV, has 3 children'
    ),
    (
        '22222222-2222-2222-2222-222222222223',
        '11111111-1111-1111-1111-111111111113',
        '00000000-0000-0000-0000-000000000002',
        '{"type": "hatchback", "brand": "hyundai", "budget_range": "15000-25000", "features": ["fuel_efficient"], "color_preference": "red"}',
        NOW() - INTERVAL '3 days',
        'test_drive',
        '3-months',
        '15000-25000 JOD',
        'google-ad',
        'First time buyer, price sensitive'
    );

-- Insert sample interactions
INSERT INTO interactions (
    id,
    visit_id,
    consultant_id,
    type,
    content,
    outcome,
    scheduled_follow_up
) VALUES
    (
        '33333333-3333-3333-3333-333333333331',
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000002',
        'whatsapp',
        'Welcome message sent: مرحباً محمد، شكراً لزيارتكم معرض السيارات اليوم. سنتواصل معكم قريباً بخصوص اهتمامكم بسيارة تويوتا كامري.',
        'message_delivered',
        NOW() + INTERVAL '1 day'
    ),
    (
        '33333333-3333-3333-3333-333333333332',
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000003',
        'call',
        'Initial follow-up call. Customer confirmed interest in Nissan Pathfinder. Discussed financing options.',
        'interested',
        NOW() + INTERVAL '2 days'
    );

-- Insert sample message status records
INSERT INTO message_status (
    id,
    interaction_id,
    customer_id,
    channel,
    status,
    message_id,
    cost
) VALUES
    (
        '44444444-4444-4444-4444-444444444441',
        '33333333-3333-3333-3333-333333333331',
        '11111111-1111-1111-1111-111111111111',
        'whatsapp',
        'delivered',
        'wamid.HBgNOTkxNzg5NjEyMzQ1FQIAERgSNDlDRjAyRDREMzdBQTFBOEE0AA==',
        0.00
    );

-- Update consultant performance metrics with sample data
UPDATE consultants 
SET performance_metrics = jsonb_build_object(
    'total_visits', 2,
    'conversion_rate', 0.0,
    'avg_response_time', 1.5,
    'customer_rating', 4.5
)
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE consultants 
SET performance_metrics = jsonb_build_object(
    'total_visits', 1,
    'conversion_rate', 0.0,
    'avg_response_time', 2.0,
    'customer_rating', 4.8
)
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Create a few AI analysis samples for testing
UPDATE visits 
SET ai_analysis = jsonb_build_object(
    'purchase_probability', 0.75,
    'sentiment_score', 0.6,
    'priority_ranking', 8,
    'recommended_actions', ARRAY['Schedule test drive', 'Send financing options', 'Follow up in 24 hours'],
    'confidence_score', 0.85
)
WHERE id = '22222222-2222-2222-2222-222222222221';

UPDATE visits 
SET ai_analysis = jsonb_build_object(
    'purchase_probability', 0.92,
    'sentiment_score', 0.8,
    'priority_ranking', 9,
    'recommended_actions', ARRAY['Prepare purchase contract', 'Confirm financing', 'Schedule immediate follow-up'],
    'confidence_score', 0.95
)
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE visits 
SET ai_analysis = jsonb_build_object(
    'purchase_probability', 0.45,
    'sentiment_score', 0.3,
    'priority_ranking', 4,
    'recommended_actions', ARRAY['Provide more pricing options', 'Show fuel efficiency benefits', 'Follow up in 1 week'],
    'confidence_score', 0.70
)
WHERE id = '22222222-2222-2222-2222-222222222223';

-- Add comments for seed data
COMMENT ON TABLE consultants IS 'Seed data includes: reception staff, 3 consultants, 1 manager, 1 admin for comprehensive testing';
COMMENT ON TABLE customers IS 'Sample customers with Arabic and English names for bilingual testing';
COMMENT ON TABLE visits IS 'Sample visits covering different statuses and vehicle types for dashboard testing';