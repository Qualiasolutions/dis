import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface VisitAnalysisRequest {
  visit_id: string;
  customer_data?: {
    name: string;
    phone: string;
    email?: string;
    language_preference: 'ar' | 'en';
    visit_history?: number;
  };
  visit_data: {
    vehicle_interest: {
      type?: string;
      brand?: string;
      model?: string;
      budget_range?: string;
      purchase_timeline?: string;
      features?: string[];
      financing_preference?: string;
    };
    consultant_notes?: string;
    source?: string;
    visit_duration?: number;
    interaction_quality?: string;
  };
  force_reanalysis?: boolean;
}

interface AIAnalysisResult {
  purchase_probability: number; // 0-1
  sentiment_score: number; // -1 to 1
  priority_ranking: number; // 1-10
  confidence_score: number; // 0-1
  recommended_actions: string[];
  concerns: string[];
  opportunities: string[];
  next_contact_timing: string;
  reasoning: string;
  cultural_considerations?: string;
  generated_at: string;
}

// Circuit breaker for OpenAI API failures
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 3;
  private readonly resetTimeout = 60000; // 1 minute

  isOpen(): boolean {
    if (this.failures >= this.maxFailures) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess(): void {
    this.reset();
  }

  private reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

const circuitBreaker = new CircuitBreaker();

async function callOpenAI(prompt: string, visitData: any): Promise<AIAnalysisResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in analyzing customer visits for car dealerships in Jordan. 
          You understand Middle Eastern culture, automotive market preferences, and customer behavior patterns.
          Provide analysis in JSON format only, no additional text.
          
          Consider these Jordan-specific factors:
          - Family decision-making processes
          - Budget consciousness and value for money
          - Preference for reliable, fuel-efficient vehicles
          - Cultural importance of status and appearance
          - Seasonal purchase patterns (Ramadan, Eid bonuses)
          - Economic conditions and exchange rate sensitivity`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for consistent analysis
      max_tokens: 1000,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

function buildAnalysisPrompt(request: VisitAnalysisRequest): string {
  const { customer_data, visit_data } = request;
  
  return `Analyze this car dealership customer visit for purchase likelihood and provide recommendations.

Customer Information:
- Name: ${customer_data?.name || 'Not provided'}
- Language: ${customer_data?.language_preference === 'ar' ? 'Arabic' : 'English'}
- Visit History: ${customer_data?.visit_history || 0} previous visits
- Phone: ${customer_data?.phone ? 'Provided' : 'Not provided'}

Vehicle Interest:
- Type: ${visit_data.vehicle_interest.type || 'Not specified'}
- Brand: ${visit_data.vehicle_interest.brand || 'Not specified'}
- Model: ${visit_data.vehicle_interest.model || 'Not specified'}
- Budget: ${visit_data.vehicle_interest.budget_range || 'Not specified'}
- Timeline: ${visit_data.vehicle_interest.purchase_timeline || 'Not specified'}
- Features: ${visit_data.vehicle_interest.features?.join(', ') || 'Not specified'}
- Financing: ${visit_data.vehicle_interest.financing_preference || 'Not specified'}

Visit Details:
- Source: ${visit_data.source || 'Walk-in'}
- Duration: ${visit_data.visit_duration || 'Not tracked'} minutes
- Interaction Quality: ${visit_data.interaction_quality || 'Standard'}
- Consultant Notes: ${visit_data.consultant_notes || 'No notes provided'}

Provide a JSON response with exactly these fields:
{
  "purchase_probability": number (0-1, where 1 is very likely to purchase),
  "sentiment_score": number (-1 to 1, where 1 is very positive),
  "priority_ranking": number (1-10, where 10 is highest priority),
  "confidence_score": number (0-1, confidence in this analysis),
  "recommended_actions": array of 3-5 specific action recommendations,
  "concerns": array of potential issues or objections,
  "opportunities": array of ways to increase purchase likelihood,
  "next_contact_timing": string (when to follow up, e.g. "within 24 hours"),
  "reasoning": string (brief explanation of the analysis),
  "cultural_considerations": string (Jordan-specific cultural factors to consider),
  "generated_at": "${new Date().toISOString()}"
}

Base your analysis on:
1. Budget alignment with vehicle interest
2. Purchase timeline urgency
3. Interaction quality and engagement level
4. Completeness of information provided
5. Cultural context for Jordan market
6. Consultant notes and customer behavior indicators`;
}

function generateFallbackAnalysis(request: VisitAnalysisRequest): AIAnalysisResult {
  const { visit_data, customer_data } = request;
  
  // Simple rule-based fallback analysis
  let purchaseProbability = 0.5; // Base probability
  let priorityRanking = 5; // Base priority
  let sentimentScore = 0; // Neutral sentiment
  
  // Adjust based on available data
  if (visit_data.vehicle_interest.budget_range) {
    purchaseProbability += 0.15;
    priorityRanking += 1;
  }
  
  if (visit_data.vehicle_interest.purchase_timeline) {
    const timeline = visit_data.vehicle_interest.purchase_timeline.toLowerCase();
    if (timeline.includes('week')) {
      purchaseProbability += 0.25;
      priorityRanking += 3;
    } else if (timeline.includes('month')) {
      purchaseProbability += 0.15;
      priorityRanking += 2;
    }
  }
  
  if (visit_data.consultant_notes) {
    const notes = visit_data.consultant_notes.toLowerCase();
    if (notes.includes('interested') || notes.includes('excited')) {
      sentimentScore += 0.3;
      purchaseProbability += 0.1;
    }
    if (notes.includes('budget') || notes.includes('price')) {
      purchaseProbability += 0.05;
    }
  }
  
  if (customer_data?.visit_history && customer_data.visit_history > 1) {
    purchaseProbability += 0.1;
    priorityRanking += 1;
  }
  
  // Ensure values are within bounds
  purchaseProbability = Math.min(Math.max(purchaseProbability, 0), 1);
  priorityRanking = Math.min(Math.max(Math.round(priorityRanking), 1), 10);
  sentimentScore = Math.min(Math.max(sentimentScore, -1), 1);
  
  return {
    purchase_probability: purchaseProbability,
    sentiment_score: sentimentScore,
    priority_ranking: priorityRanking,
    confidence_score: 0.6, // Lower confidence for fallback
    recommended_actions: [
      'Follow up within 48 hours',
      'Send vehicle information and pricing',
      'Schedule test drive appointment',
      'Discuss financing options'
    ],
    concerns: [
      'Budget constraints may affect decision',
      'May be comparison shopping with competitors'
    ],
    opportunities: [
      'Strong interest in specific vehicle type',
      'Customer provided contact information'
    ],
    next_contact_timing: 'within 24-48 hours',
    reasoning: 'Fallback analysis based on available visit data and customer interaction patterns.',
    cultural_considerations: 'Consider family decision-making process and value-focused messaging for Jordan market.',
    generated_at: new Date().toISOString()
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const requestData: VisitAnalysisRequest = await req.json();
    
    if (!requestData.visit_id) {
      return new Response(JSON.stringify({ 
        error: 'visit_id is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if analysis already exists and is recent (unless force reanalysis)
    if (!requestData.force_reanalysis) {
      const { data: existingVisit } = await supabase
        .from('visits')
        .select('ai_analysis')
        .eq('id', requestData.visit_id)
        .single();

      if (existingVisit?.ai_analysis && 
          typeof existingVisit.ai_analysis === 'object' && 
          existingVisit.ai_analysis.generated_at) {
        const analysisAge = Date.now() - new Date(existingVisit.ai_analysis.generated_at).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (analysisAge < maxAge) {
          return new Response(JSON.stringify({
            success: true,
            data: existingVisit.ai_analysis,
            cached: true,
            message: 'Using cached analysis'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    let aiAnalysis: AIAnalysisResult;

    // Try OpenAI analysis if circuit breaker is closed
    if (!circuitBreaker.isOpen()) {
      try {
        const prompt = buildAnalysisPrompt(requestData);
        aiAnalysis = await callOpenAI(prompt, requestData);
        circuitBreaker.recordSuccess();
        console.log('OpenAI analysis completed successfully');
      } catch (error) {
        console.error('OpenAI analysis failed:', error);
        circuitBreaker.recordFailure();
        // Fall back to rule-based analysis
        aiAnalysis = generateFallbackAnalysis(requestData);
        console.log('Using fallback analysis due to OpenAI failure');
      }
    } else {
      console.log('Circuit breaker open, using fallback analysis');
      aiAnalysis = generateFallbackAnalysis(requestData);
    }

    // Store analysis results in database
    const { error: updateError } = await supabase
      .from('visits')
      .update({ 
        ai_analysis: aiAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.visit_id);

    if (updateError) {
      console.error('Failed to store analysis:', updateError);
      // Return analysis even if storage fails
    }

    // Log analysis for monitoring
    const { error: logError } = await supabase
      .from('ai_analysis_log')
      .insert({
        visit_id: requestData.visit_id,
        analysis_result: aiAnalysis,
        method: circuitBreaker.isOpen() ? 'fallback' : 'openai',
        processing_time_ms: Date.now() - new Date(aiAnalysis.generated_at).getTime(),
        success: true
      });

    if (logError) {
      console.error('Failed to log analysis:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      data: aiAnalysis,
      cached: false,
      method: circuitBreaker.isOpen() ? 'fallback' : 'openai',
      message: 'Analysis completed successfully'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error in AI analysis:', error);
    
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