import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface AuthRequest {
  email: string;
  password?: string;
  action: 'login' | 'register' | 'logout' | 'refresh';
  role?: 'reception' | 'consultant' | 'manager' | 'admin';
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

    const authData: AuthRequest = await req.json();

    switch (authData.action) {
      case 'login': {
        if (!authData.email || !authData.password) {
          return new Response(JSON.stringify({
            error: 'Email and password required for login'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password
        });

        if (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Authentication failed',
            message: error.message
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Get user role from consultants table
        const { data: consultant } = await supabase
          .from('consultants')
          .select('role, name, active')
          .eq('email', authData.email)
          .single();

        return new Response(JSON.stringify({
          success: true,
          data: {
            user: data.user,
            session: data.session,
            consultant: consultant || null
          }
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      case 'logout': {
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
          // Set the session for logout
          await supabase.auth.setSession({
            access_token: authHeader.replace('Bearer ', ''),
            refresh_token: ''
          });
        }
        
        const { error } = await supabase.auth.signOut();
        
        return new Response(JSON.stringify({
          success: !error,
          message: error ? error.message : 'Logged out successfully'
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      case 'refresh': {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({
            error: 'No authorization header provided'
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Refresh handled by Supabase client automatically
        return new Response(JSON.stringify({
          success: true,
          message: 'Token refresh handled by client'
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action. Supported actions: login, logout, refresh'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Auth handler error:', error);
    
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