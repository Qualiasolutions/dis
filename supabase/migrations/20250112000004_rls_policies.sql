-- Row Level Security (RLS) policies
-- Date: 2025-01-12
-- Version: 1.0

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
        'consultant'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('manager', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customers table policies
CREATE POLICY "Customers visible to all authenticated users" ON customers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Customers can be inserted by reception and consultants" ON customers
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('reception', 'consultant', 'manager', 'admin'));

CREATE POLICY "Customers can be updated by assigned consultant or managers" ON customers
    FOR UPDATE TO authenticated
    USING (
        is_manager_or_admin() OR 
        EXISTS (
            SELECT 1 FROM visits 
            WHERE visits.customer_id = customers.id 
            AND visits.consultant_id = auth.uid()
        )
    );

-- Consultants table policies
CREATE POLICY "Consultants visible to authenticated users" ON consultants
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR 
        is_manager_or_admin() OR
        active = true
    );

CREATE POLICY "Only managers can insert consultants" ON consultants
    FOR INSERT TO authenticated
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "Consultants can update own profile, managers can update all" ON consultants
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid() OR 
        is_manager_or_admin()
    );

-- Visits table policies  
CREATE POLICY "Visits visible to assigned consultant or managers" ON visits
    FOR SELECT TO authenticated
    USING (
        consultant_id = auth.uid() OR 
        is_manager_or_admin() OR
        get_user_role() = 'reception'
    );

CREATE POLICY "Visits can be inserted by reception and consultants" ON visits
    FOR INSERT TO authenticated
    WITH CHECK (get_user_role() IN ('reception', 'consultant', 'manager', 'admin'));

CREATE POLICY "Visits can be updated by assigned consultant or managers" ON visits
    FOR UPDATE TO authenticated
    USING (
        consultant_id = auth.uid() OR 
        is_manager_or_admin()
    );

-- Interactions table policies
CREATE POLICY "Interactions visible to visit consultant or managers" ON interactions
    FOR SELECT TO authenticated
    USING (
        consultant_id = auth.uid() OR
        is_manager_or_admin() OR
        EXISTS (
            SELECT 1 FROM visits 
            WHERE visits.id = interactions.visit_id 
            AND visits.consultant_id = auth.uid()
        )
    );

CREATE POLICY "Interactions can be inserted by assigned consultant or managers" ON interactions
    FOR INSERT TO authenticated
    WITH CHECK (
        consultant_id = auth.uid() OR 
        is_manager_or_admin()
    );

CREATE POLICY "Interactions can be updated by creator or managers" ON interactions
    FOR UPDATE TO authenticated
    USING (
        consultant_id = auth.uid() OR 
        is_manager_or_admin()
    );

-- Message status table policies
CREATE POLICY "Message status visible to customer's consultant or managers" ON message_status
    FOR SELECT TO authenticated
    USING (
        is_manager_or_admin() OR
        EXISTS (
            SELECT 1 FROM visits 
            WHERE visits.customer_id = message_status.customer_id 
            AND visits.consultant_id = auth.uid()
        )
    );

CREATE POLICY "Message status can be inserted by system" ON message_status
    FOR INSERT TO authenticated
    WITH CHECK (true); -- System can insert message status

CREATE POLICY "Message status can be updated by system" ON message_status
    FOR UPDATE TO authenticated
    USING (true); -- System can update message status

-- Reception role special permissions
CREATE POLICY "Reception can view all current visits" ON visits
    FOR SELECT TO authenticated
    USING (
        get_user_role() = 'reception' AND 
        status IN ('new', 'contacted', 'scheduled')
    );

-- Audit logging function
CREATE OR REPLACE FUNCTION log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log important data changes for audit trail
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            table_name,
            record_id,
            operation,
            old_data,
            new_data,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            auth.uid(),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name,
            record_id,
            operation,
            new_data,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            row_to_json(NEW),
            auth.uid(),
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log table (optional - for compliance)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments for policy documentation
COMMENT ON POLICY "Customers visible to all authenticated users" ON customers IS 'All authenticated users can view customers for assignment and lookup';
COMMENT ON POLICY "Visits visible to assigned consultant or managers" ON visits IS 'Consultants see only their assigned visits, managers see all';
COMMENT ON FUNCTION get_user_role() IS 'Helper function to extract user role from auth.users metadata';
COMMENT ON FUNCTION is_manager_or_admin() IS 'Helper function to check management privileges';