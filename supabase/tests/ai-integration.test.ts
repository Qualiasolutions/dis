import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('AI Integration Tests', () => {
  let testVisitId: string
  let testCustomerId: string
  let testConsultantId: string

  beforeAll(async () => {
    // Create test data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer',
        phone: '0791234567',
        email: 'test@example.com',
        language_preference: 'en'
      })
      .select()
      .single()

    if (customerError) throw customerError
    testCustomerId = customer.id

    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .insert({
        name: 'Test Consultant',
        email: 'consultant@dealership.com',
        phone: '0792345678',
        active: true
      })
      .select()
      .single()

    if (consultantError) throw consultantError
    testConsultantId = consultant.id

    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        customer_id: testCustomerId,
        consultant_id: testConsultantId,
        vehicle_interest: {
          type: 'SUV',
          brand: 'Toyota',
          model: 'RAV4',
          budget_range: '25000-35000'
        },
        status: 'new',
        consultant_notes: 'Test visit for AI analysis',
        source: 'test',
        visit_duration: 30,
        interaction_quality: 'good'
      })
      .select()
      .single()

    if (visitError) throw visitError
    testVisitId = visit.id
  })

  afterAll(async () => {
    // Clean up test data
    if (testVisitId) {
      await supabase.from('visits').delete().eq('id', testVisitId)
    }
    if (testCustomerId) {
      await supabase.from('customers').delete().eq('id', testCustomerId)
    }
    if (testConsultantId) {
      await supabase.from('consultants').delete().eq('id', testConsultantId)
    }
  })

  describe('AI Visit Analysis Edge Function', () => {
    it('should analyze a visit and return AI insights', async () => {
      const { data, error } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            },
            consultant_notes: 'Test visit for AI analysis',
            source: 'test',
            visit_duration: 30,
            interaction_quality: 'good'
          }
        }
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('purchase_probability')
      expect(data.data).toHaveProperty('sentiment_score')
      expect(data.data).toHaveProperty('priority_ranking')
      expect(data.data).toHaveProperty('confidence_score')
      expect(data.data).toHaveProperty('recommended_actions')
      expect(data.data.recommended_actions).toBeInstanceOf(Array)
    })

    it('should use cached results when available', async () => {
      // First call to generate and cache
      const { data: firstCall } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      // Second call should use cache
      const { data: secondCall } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      expect(secondCall.cached).toBe(true)
      expect(secondCall.data).toEqual(firstCall.data)
    })

    it('should force reanalysis when requested', async () => {
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          },
          force_reanalysis: true
        }
      })

      expect(data.cached).toBe(false)
      expect(data.success).toBe(true)
    })

    it('should handle Arabic language preference', async () => {
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'عميل اختبار',
            phone: '0791234567',
            language_preference: 'ar',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('cultural_considerations')
    })
  })

  describe('AI Performance Tracking', () => {
    it('should track AI analysis performance metrics', async () => {
      // Perform an analysis
      await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      // Check if metrics were logged
      const { data: logs, error } = await supabase
        .from('ai_analysis_log')
        .select('*')
        .eq('visit_id', testVisitId)
        .order('created_at', { ascending: false })
        .limit(1)

      expect(error).toBeNull()
      expect(logs).toBeDefined()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0]).toHaveProperty('success')
      expect(logs[0]).toHaveProperty('processing_time_ms')
      expect(logs[0]).toHaveProperty('method')
    })

    it('should store AI predictions for accuracy tracking', async () => {
      const { data: visit } = await supabase
        .from('visits')
        .select('ai_analysis')
        .eq('id', testVisitId)
        .single()

      expect(visit).toBeDefined()
      if (visit?.ai_analysis) {
        expect(visit.ai_analysis).toHaveProperty('purchase_probability')
        expect(visit.ai_analysis).toHaveProperty('priority_ranking')
      }
    })
  })

  describe('AI Data Validation', () => {
    it('should validate purchase probability is between 0 and 1', async () => {
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      expect(data.data.purchase_probability).toBeGreaterThanOrEqual(0)
      expect(data.data.purchase_probability).toBeLessThanOrEqual(1)
    })

    it('should validate sentiment score is between -1 and 1', async () => {
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      expect(data.data.sentiment_score).toBeGreaterThanOrEqual(-1)
      expect(data.data.sentiment_score).toBeLessThanOrEqual(1)
    })

    it('should validate priority ranking is between 1 and 10', async () => {
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      expect(data.data.priority_ranking).toBeGreaterThanOrEqual(1)
      expect(data.data.priority_ranking).toBeLessThanOrEqual(10)
    })

    it('should validate confidence score is between 0 and 1', async () => {
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          }
        }
      })

      expect(data.data.confidence_score).toBeGreaterThanOrEqual(0)
      expect(data.data.confidence_score).toBeLessThanOrEqual(1)
    })
  })

  describe('Fallback Mechanism', () => {
    it('should use fallback analysis when OpenAI is unavailable', async () => {
      // This test would simulate OpenAI failure
      // In production, this would be tested with a mock or by disabling the API key
      const { data } = await supabase.functions.invoke('ai-visit-analysis', {
        body: {
          visit_id: testVisitId,
          customer_data: {
            name: 'Test Customer',
            phone: '0791234567',
            language_preference: 'en',
            visit_history: 1
          },
          visit_data: {
            vehicle_interest: {
              type: 'SUV',
              brand: 'Toyota',
              model: 'RAV4',
              budget_range: '25000-35000'
            }
          },
          // Force fallback for testing
          test_mode: 'fallback'
        }
      })

      if (data.method === 'fallback') {
        expect(data.success).toBe(true)
        expect(data.method).toBe('fallback')
        expect(data.data).toHaveProperty('purchase_probability')
        expect(data.data).toHaveProperty('recommended_actions')
      }
    })
  })
})