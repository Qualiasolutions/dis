# Production Deployment Guide

## Dealership Intelligence System - Jordan Market

### 🚀 Deployment Overview

This guide covers the complete deployment process for the Dealership Intelligence System, optimized for the Jordan automotive market.

**Tech Stack:**
- Frontend: React PWA deployed on Vercel
- Backend: Supabase (PostgreSQL + Edge Functions)
- AI: OpenAI GPT-4
- Communication: WhatsApp Business API
- Analytics: Google Analytics 4 + Meta Pixel

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

```bash
# Copy environment variables
cp .env.example .env.production

# Required environment variables:
VITE_SUPABASE_URL=https://wlmljniorublcadvorvf.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
WHATSAPP_TOKEN=your_whatsapp_token
META_PIXEL_ID=your_pixel_id
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Database Preparation

```bash
# Run migrations in production
supabase link --project-ref wlmljniorublcadvorvf
supabase db push

# Verify migrations
supabase db diff --schema public

# Create database backup
supabase db dump --file backup-$(date +%Y%m%d).sql
```

### 3. Testing

```bash
# Run all tests
pnpm test
pnpm test:e2e
pnpm test:integration

# Specific AI tests
pnpm test -- ai-integration.test.ts

# Performance testing
pnpm lighthouse
```

---

## 🏗️ Deployment Process

### Step 1: Deploy Supabase Backend

```bash
# Deploy Edge Functions
supabase functions deploy document-upload-process
supabase functions deploy ai-visit-analysis
supabase functions deploy whatsapp-webhook
supabase functions deploy campaign-attribution

# Verify functions
supabase functions list
```

### Step 2: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Or using GitHub integration
git push origin main
```

### Step 3: Configure Domain & SSL

1. Add custom domain in Vercel dashboard
2. Configure DNS records:
```
A     @       76.76.21.21
A     www     76.76.21.21
CNAME api     wlmljniorublcadvorvf.supabase.co
```

### Step 4: Setup WhatsApp Business

1. Configure webhook URL:
```
https://api.dealership.jo/functions/v1/whatsapp-webhook
```

2. Verify webhook token:
```javascript
// In Edge Function
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
```

3. Subscribe to webhook events:
- messages
- message_status
- message_template_status_update

### Step 5: Configure Analytics

```javascript
// Google Analytics 4
gtag('config', 'G-XXXXXXXXXX', {
  page_location: window.location.href,
  page_path: window.location.pathname,
  page_title: document.title
})

// Meta Pixel
fbq('init', 'YOUR_PIXEL_ID')
fbq('track', 'PageView')
```

---

## 🔒 Security Configuration

### 1. Row Level Security (RLS)

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test RLS policies
SET ROLE authenticated;
SELECT * FROM visits; -- Should only show authorized data
```

### 2. API Security

```typescript
// Rate limiting in Edge Functions
const RATE_LIMIT = 100 // requests per minute
const rateLimiter = new Map()

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dealership.jo',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}
```

### 3. Data Protection

- Enable encryption at rest in Supabase
- Use environment variables for all secrets
- Implement JWT token validation
- Hash sensitive data (phone numbers for ad platforms)

---

## ⚡ Performance Optimization

### 1. Frontend Optimization

```javascript
// Vite configuration for production
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mantine: ['@mantine/core', '@mantine/hooks'],
          charts: ['recharts'],
          ai: ['./src/components/ai']
        }
      }
    },
    minify: 'terser',
    sourcemap: true
  }
})
```

### 2. Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX idx_visits_status_date ON visits(status, created_at DESC);
CREATE INDEX idx_visits_ai_priority ON visits(ai_priority_ranking DESC) 
  WHERE ai_priority_ranking IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM visits WHERE status = 'new';
```

### 3. Caching Strategy

```typescript
// React Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: 30 * 1000, // 30 seconds for real-time
    }
  }
})

// Service Worker caching
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request)
      })
    )
  }
})
```

---

## 📊 Monitoring Setup

### 1. Application Monitoring

```javascript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
})
```

### 2. Database Monitoring

```sql
-- Monitor slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

### 3. AI Performance Monitoring

```typescript
// Track AI metrics
const trackAIAnalysis = async (result: AIAnalysisResult) => {
  await supabase.from('ai_analysis_log').insert({
    visit_id: result.visit_id,
    success: result.success,
    method: result.method,
    processing_time_ms: result.processingTime,
    confidence_score: result.confidenceScore,
    error_message: result.error
  })
}
```

---

## 🌍 Jordan Market Specific

### 1. Arabic Support

```typescript
// RTL configuration
const theme = createTheme({
  dir: 'rtl',
  fontFamily: 'Noto Sans Arabic, sans-serif',
  primaryColor: 'blue'
})

// Number formatting
const formatJordanPhone = (phone: string) => {
  // Ensure format: 07XXXXXXXX
  return phone.replace(/^(\+962|00962|962)?/, '0')
}
```

### 2. Local Compliance

- Data residency: Ensure data stays in approved regions
- Privacy: Comply with Jordan's data protection laws
- Phone validation: Use Jordan mobile patterns (07[789]XXXXXXX)
- Currency: Always display prices in JOD
- Working hours: Saturday-Thursday business days

### 3. Performance for Jordan Networks

```javascript
// Optimize for 3G/4G networks
const imageOptimization = {
  quality: 70,
  formats: ['webp', 'jpeg'],
  sizes: '(max-width: 640px) 100vw, 640px',
  loading: 'lazy'
}

// Reduce initial bundle size
const codeSplitting = {
  maxSize: 244 * 1024, // 244KB per chunk
  minSize: 20 * 1024,  // 20KB minimum
  cacheGroups: {
    default: false,
    vendors: false
  }
}
```

---

## 🚨 Rollback Plan

### Quick Rollback Steps

```bash
# 1. Revert Vercel deployment
vercel rollback

# 2. Restore database backup
supabase db restore backup-20240112.sql

# 3. Revert Edge Functions
supabase functions deploy --version previous

# 4. Clear CDN cache
curl -X POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache
```

### Emergency Contacts

- DevOps Lead: +962 79 XXX XXXX
- Database Admin: +962 78 XXX XXXX
- AI Team: +962 77 XXX XXXX
- WhatsApp API Support: support@meta.com

---

## ✅ Post-Deployment Verification

### 1. Functional Tests

```bash
# Health checks
curl https://api.dealership.jo/health
curl https://api.dealership.jo/health/db
curl https://api.dealership.jo/health/ai

# Test critical flows
npm run test:production
```

### 2. Performance Tests

```bash
# Lighthouse audit
lighthouse https://dealership.jo --output html --output-path ./lighthouse-report.html

# Load testing
artillery run load-test.yml
```

### 3. Security Audit

```bash
# Dependency audit
pnpm audit
pnpm audit fix

# Security headers check
curl -I https://dealership.jo

# SSL verification
openssl s_client -connect dealership.jo:443
```

---

## 📈 Success Metrics

### Week 1 Targets
- [ ] 99.9% uptime
- [ ] <3s page load time (3G)
- [ ] 100+ AI analyses completed
- [ ] 50+ WhatsApp interactions
- [ ] 0 critical bugs

### Month 1 Goals
- [ ] 500+ customer visits tracked
- [ ] 80% AI analysis accuracy
- [ ] 15% conversion rate improvement
- [ ] 95% consultant adoption rate
- [ ] 4.5+ user satisfaction score

---

## 📝 Documentation

### For Developers
- API Documentation: `/docs/api.md`
- Database Schema: `/docs/database.md`
- Component Library: `/docs/components.md`

### For Business Users
- User Manual: `/docs/user-manual.md`
- Admin Guide: `/docs/admin-guide.md`
- Training Videos: `/docs/training/`

### For DevOps
- Infrastructure: `/docs/infrastructure.md`
- Monitoring: `/docs/monitoring.md`
- Incident Response: `/docs/incident-response.md`

---

## 🎉 Launch Checklist

- [ ] All tests passing
- [ ] Production environment variables set
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] WhatsApp webhook verified
- [ ] Analytics tracking confirmed
- [ ] Monitoring tools active
- [ ] Backup system configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Customer support briefed
- [ ] Marketing materials ready

---

**Deploy with confidence! 🚀**

*Last updated: January 2024*
*Version: 1.0.0*