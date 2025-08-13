-- AI Analysis Schema Migration
-- Adds support for AI-powered visit analysis and performance tracking

-- Create AI analysis log table for monitoring and performance tracking
CREATE TABLE IF NOT EXISTS ai_analysis_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    analysis_result JSONB NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('openai', 'fallback')),
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance monitoring queries
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_created_at ON ai_analysis_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_visit_id ON ai_analysis_log(visit_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_method ON ai_analysis_log(method);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_success ON ai_analysis_log(success);

-- Create AI predictions tracking table for accuracy monitoring
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    predicted_purchase_probability DECIMAL(3,2) NOT NULL CHECK (predicted_purchase_probability >= 0 AND predicted_purchase_probability <= 1),
    predicted_priority_ranking INTEGER NOT NULL CHECK (predicted_priority_ranking >= 1 AND predicted_priority_ranking <= 10),
    predicted_sentiment_score DECIMAL(3,2) NOT NULL CHECK (predicted_sentiment_score >= -1 AND predicted_sentiment_score <= 1),
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Actual outcomes (updated when visit is completed/lost)
    actual_purchased BOOLEAN,
    actual_outcome_date TIMESTAMP WITH TIME ZONE,
    actual_satisfaction_score DECIMAL(3,2) CHECK (actual_satisfaction_score >= 1 AND actual_satisfaction_score <= 5),
    
    -- Accuracy metrics (calculated automatically)
    prediction_accuracy DECIMAL(3,2),
    outcome_variance DECIMAL(3,2),
    
    -- Metadata
    prediction_method VARCHAR(20) NOT NULL CHECK (prediction_method IN ('openai', 'fallback')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(visit_id) -- One prediction per visit
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_predictions_visit_id ON ai_predictions(visit_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_method ON ai_predictions(prediction_method);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_accuracy ON ai_predictions(prediction_accuracy);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_actual_purchased ON ai_predictions(actual_purchased);

-- Update visits table to optimize ai_analysis column
ALTER TABLE visits ALTER COLUMN ai_analysis SET DEFAULT '{}';

-- Add GIN index for AI analysis queries
CREATE INDEX IF NOT EXISTS idx_visits_ai_analysis_gin ON visits USING GIN (ai_analysis);

-- Add computed columns for quick AI metrics access
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS ai_purchase_probability DECIMAL(3,2) 
GENERATED ALWAYS AS (
    CASE 
        WHEN ai_analysis->>'purchase_probability' ~ '^[0-9]*\.?[0-9]+$' 
        THEN (ai_analysis->>'purchase_probability')::DECIMAL(3,2)
        ELSE NULL 
    END
) STORED;

ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS ai_priority_ranking INTEGER 
GENERATED ALWAYS AS (
    CASE 
        WHEN ai_analysis->>'priority_ranking' ~ '^[0-9]+$' 
        THEN (ai_analysis->>'priority_ranking')::INTEGER
        ELSE NULL 
    END
) STORED;

ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS ai_sentiment_score DECIMAL(3,2) 
GENERATED ALWAYS AS (
    CASE 
        WHEN ai_analysis->>'sentiment_score' ~ '^-?[0-9]*\.?[0-9]+$' 
        THEN (ai_analysis->>'sentiment_score')::DECIMAL(3,2)
        ELSE NULL 
    END
) STORED;

-- Add indexes for AI-generated columns
CREATE INDEX IF NOT EXISTS idx_visits_ai_purchase_probability ON visits(ai_purchase_probability) WHERE ai_purchase_probability IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_ai_priority_ranking ON visits(ai_priority_ranking) WHERE ai_priority_ranking IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_ai_sentiment_score ON visits(ai_sentiment_score) WHERE ai_sentiment_score IS NOT NULL;

-- Create function to automatically create prediction records
CREATE OR REPLACE FUNCTION create_ai_prediction_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create prediction record if AI analysis exists and contains required fields
    IF NEW.ai_analysis IS NOT NULL AND 
       NEW.ai_analysis ? 'purchase_probability' AND 
       NEW.ai_analysis ? 'priority_ranking' AND 
       NEW.ai_analysis ? 'sentiment_score' AND
       NEW.ai_analysis ? 'confidence_score' THEN
        
        INSERT INTO ai_predictions (
            visit_id,
            predicted_purchase_probability,
            predicted_priority_ranking,
            predicted_sentiment_score,
            confidence_score,
            prediction_method
        ) VALUES (
            NEW.id,
            (NEW.ai_analysis->>'purchase_probability')::DECIMAL(3,2),
            (NEW.ai_analysis->>'priority_ranking')::INTEGER,
            (NEW.ai_analysis->>'sentiment_score')::DECIMAL(3,2),
            (NEW.ai_analysis->>'confidence_score')::DECIMAL(3,2),
            COALESCE(NEW.ai_analysis->>'method', 'openai')
        ) ON CONFLICT (visit_id) DO UPDATE SET
            predicted_purchase_probability = EXCLUDED.predicted_purchase_probability,
            predicted_priority_ranking = EXCLUDED.predicted_priority_ranking,
            predicted_sentiment_score = EXCLUDED.predicted_sentiment_score,
            confidence_score = EXCLUDED.confidence_score,
            prediction_method = EXCLUDED.prediction_method,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create prediction records
DROP TRIGGER IF EXISTS trigger_create_ai_prediction ON visits;
CREATE TRIGGER trigger_create_ai_prediction
    AFTER UPDATE OF ai_analysis ON visits
    FOR EACH ROW
    WHEN (NEW.ai_analysis IS DISTINCT FROM OLD.ai_analysis)
    EXECUTE FUNCTION create_ai_prediction_record();

-- Create function to update prediction accuracy when visit outcome is determined
CREATE OR REPLACE FUNCTION update_prediction_accuracy()
RETURNS TRIGGER AS $$
DECLARE
    predicted_prob DECIMAL(3,2);
    accuracy_score DECIMAL(3,2);
BEGIN
    -- Only update when status changes to completed or lost
    IF OLD.status != NEW.status AND NEW.status IN ('converted', 'lost') THEN
        
        -- Get predicted probability
        SELECT predicted_purchase_probability INTO predicted_prob
        FROM ai_predictions 
        WHERE visit_id = NEW.id;
        
        IF predicted_prob IS NOT NULL THEN
            -- Calculate accuracy based on outcome
            IF NEW.status = 'converted' THEN
                -- Customer purchased - accuracy based on how close prediction was to 1
                accuracy_score := 1.0 - ABS(1.0 - predicted_prob);
            ELSE
                -- Customer lost - accuracy based on how close prediction was to 0
                accuracy_score := 1.0 - predicted_prob;
            END IF;
            
            -- Update prediction record
            UPDATE ai_predictions SET
                actual_purchased = (NEW.status = 'converted'),
                actual_outcome_date = NOW(),
                prediction_accuracy = accuracy_score,
                outcome_variance = ABS(predicted_prob - (CASE WHEN NEW.status = 'completed' THEN 1.0 ELSE 0.0 END)),
                updated_at = NOW()
            WHERE visit_id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update prediction accuracy
DROP TRIGGER IF EXISTS trigger_update_prediction_accuracy ON visits;
CREATE TRIGGER trigger_update_prediction_accuracy
    AFTER UPDATE OF status ON visits
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_prediction_accuracy();

-- Create view for AI performance metrics
CREATE OR REPLACE VIEW ai_performance_metrics AS
SELECT 
    DATE_TRUNC('day', created_at) as analysis_date,
    method,
    COUNT(*) as total_analyses,
    COUNT(*) FILTER (WHERE success = true) as successful_analyses,
    ROUND(COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*) * 100, 2) as success_rate,
    ROUND(AVG(processing_time_ms), 2) as avg_processing_time_ms,
    ROUND(AVG(confidence_score), 3) as avg_confidence_score
FROM ai_analysis_log
GROUP BY DATE_TRUNC('day', created_at), method
ORDER BY analysis_date DESC, method;

-- Create view for prediction accuracy metrics
CREATE OR REPLACE VIEW ai_prediction_accuracy AS
SELECT 
    DATE_TRUNC('week', created_at) as prediction_week,
    prediction_method,
    COUNT(*) as total_predictions,
    COUNT(*) FILTER (WHERE actual_purchased IS NOT NULL) as completed_predictions,
    ROUND(AVG(prediction_accuracy) FILTER (WHERE prediction_accuracy IS NOT NULL), 3) as avg_accuracy,
    ROUND(AVG(outcome_variance) FILTER (WHERE outcome_variance IS NOT NULL), 3) as avg_variance,
    ROUND(AVG(confidence_score), 3) as avg_confidence,
    -- Precision: Of predicted purchases, how many actually purchased
    ROUND(
        COUNT(*) FILTER (WHERE predicted_purchase_probability > 0.7 AND actual_purchased = true)::DECIMAL /
        NULLIF(COUNT(*) FILTER (WHERE predicted_purchase_probability > 0.7), 0) * 100, 2
    ) as precision_high_probability,
    -- Recall: Of actual purchases, how many did we predict correctly
    ROUND(
        COUNT(*) FILTER (WHERE predicted_purchase_probability > 0.5 AND actual_purchased = true)::DECIMAL /
        NULLIF(COUNT(*) FILTER (WHERE actual_purchased = true), 0) * 100, 2
    ) as recall_rate
FROM ai_predictions
GROUP BY DATE_TRUNC('week', created_at), prediction_method
ORDER BY prediction_week DESC, prediction_method;

-- Grant necessary permissions for the application
GRANT SELECT, INSERT, UPDATE ON ai_analysis_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_predictions TO authenticated;
GRANT SELECT ON ai_performance_metrics TO authenticated;
GRANT SELECT ON ai_prediction_accuracy TO authenticated;

-- Add RLS policies for AI tables
ALTER TABLE ai_analysis_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all AI analysis logs (for transparency)
CREATE POLICY "ai_analysis_log_select_policy" ON ai_analysis_log
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Users can view all AI predictions (for performance monitoring)
CREATE POLICY "ai_predictions_select_policy" ON ai_predictions
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Only service role can insert/update AI data
CREATE POLICY "ai_analysis_log_insert_policy" ON ai_analysis_log
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "ai_predictions_insert_policy" ON ai_predictions
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "ai_predictions_update_policy" ON ai_predictions
    FOR UPDATE TO service_role
    USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_composite ON ai_analysis_log(created_at, method, success);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_composite ON ai_predictions(created_at, prediction_method, actual_purchased);
CREATE INDEX IF NOT EXISTS idx_visits_status_updated_at ON visits(status, updated_at) WHERE status IN ('completed', 'lost');

-- Add comments for documentation
COMMENT ON TABLE ai_analysis_log IS 'Logs all AI analysis requests for monitoring and performance tracking';
COMMENT ON TABLE ai_predictions IS 'Tracks AI predictions and their accuracy against actual outcomes';
COMMENT ON VIEW ai_performance_metrics IS 'Real-time metrics for AI analysis performance and reliability';
COMMENT ON VIEW ai_prediction_accuracy IS 'Weekly accuracy metrics for AI predictions vs actual outcomes';

-- Create sample data for testing (only in development)
-- This will be removed in production
INSERT INTO ai_analysis_log (visit_id, analysis_result, method, processing_time_ms, success, confidence_score)
SELECT 
    id,
    jsonb_build_object(
        'purchase_probability', 0.7,
        'sentiment_score', 0.5,
        'priority_ranking', 7,
        'confidence_score', 0.8,
        'generated_at', NOW()
    ),
    'fallback',
    random() * 1000 + 100,
    true,
    0.8
FROM visits 
WHERE ai_analysis IS NULL 
LIMIT 5;