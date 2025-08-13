import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CreateVisitRequest {
  customer: {
    phone: string;
    name: string;
    email?: string;
    language_preference: 'ar' | 'en';
  };
  visit: {
    consultant_id: string;
    vehicle_interest: {
      model?: string;
      type?: string;
      budget_min?: number;
      budget_max?: number;
      purchase_timeline?: string;
      purchase_type?: string;
    };
    status: 'new' | 'contacted' | 'scheduled' | 'test_drive' | 'negotiating' | 'converted' | 'lost';
    source?: string;
    notes?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const requestData: CreateVisitRequest = await req.json();
    
    // Validate Jordan phone format
    const phoneRegex = /^07[789]\\d{7}$/;
    if (!phoneRegex.test(requestData.customer.phone)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid phone format. Must be Jordan format (07XXXXXXXX)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', requestData.customer.phone)
      .single();

    let customerId: string;

    if (existingCustomer) {
      // Update existing customer
      customerId = existingCustomer.id;
      await supabase
        .from('customers')
        .update({
          name: requestData.customer.name,
          email: requestData.customer.email,
          language_preference: requestData.customer.language_preference,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          phone: requestData.customer.phone,
          name: requestData.customer.name,
          email: requestData.customer.email,
          language_preference: requestData.customer.language_preference
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        throw new Error('Failed to create customer: ' + customerError?.message);
      }
      
      customerId = newCustomer.id;
    }

    // Create visit record
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        customer_id: customerId,
        consultant_id: requestData.visit.consultant_id,
        vehicle_interest: requestData.visit.vehicle_interest,
        status: requestData.visit.status,
        source: requestData.visit.source,
        notes: requestData.visit.notes,
        ai_analysis: {} // Empty for now - will be populated by AI service later
      })
      .select()
      .single();

    if (visitError || !visit) {
      throw new Error('Failed to create visit: ' + visitError?.message);
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        visit_id: visit.id,
        customer_id: customerId,
        message: 'Visit created successfully'
      }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error creating visit:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});