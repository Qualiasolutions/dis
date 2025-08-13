/**
 * Production Deployment Configuration
 * Dealership Intelligence System - Jordan Market
 */

export const productionConfig = {
  // Deployment Platform
  platform: {
    frontend: 'vercel',
    backend: 'supabase',
    region: 'eu-central-1', // Frankfurt for optimal Jordan latency
    environment: 'production'
  },

  // Supabase Configuration
  supabase: {
    projectRef: 'zcmkwavcgcwondlgphzf',
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Database settings
    database: {
      poolSize: 25,
      statementTimeout: '30s',
      idleTimeout: '600s',
      connectionTimeout: '10s',
      maxConnections: 100
    },
    
    // Edge Functions
    edgeFunctions: [
      'document-upload-process',
      'ai-visit-analysis',
      'whatsapp-webhook',
      'campaign-attribution'
    ],
    
    // Storage buckets
    storage: {
      buckets: ['documents', 'avatars', 'exports'],
      publicAccess: ['avatars'],
      maxFileSize: '50MB'
    }
  },

  // Vercel Configuration
  vercel: {
    projectName: 'dealership-intelligence',
    team: 'dealership-jordan',
    
    // Build settings
    build: {
      command: 'pnpm build',
      outputDirectory: 'apps/web/dist',
      installCommand: 'pnpm install'
    },
    
    // Environment variables
    env: {
      VITE_SUPABASE_URL: '@supabase-url',
      VITE_SUPABASE_ANON_KEY: '@supabase-anon-key',
      OPENAI_API_KEY: '@openai-api-key',
      WHATSAPP_TOKEN: '@whatsapp-token',
      META_PIXEL_ID: '@meta-pixel-id',
      GA_MEASUREMENT_ID: '@ga-measurement-id'
    },
    
    // Function configuration
    functions: {
      'api/webhook/whatsapp': {
        maxDuration: 10,
        memory: 1024
      }
    },
    
    // Headers
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' *.googletagmanager.com *.google-analytics.com; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ],
    
    // Redirects
    redirects: [
      {
        source: '/api/:path*',
        destination: `${process.env.SUPABASE_URL}/rest/v1/:path*`,
        permanent: false
      }
    ]
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.7,
    
    // Rate limiting
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      requestsPerDay: 10000
    },
    
    // Circuit breaker
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
      resetTimeout: 120000
    }
  },

  // WhatsApp Business API
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    token: process.env.WHATSAPP_TOKEN,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    
    // Message templates (must be pre-approved)
    templates: {
      welcome: 'welcome_dealership_ar_en',
      followUp: 'follow_up_visit_ar_en',
      testDriveReminder: 'test_drive_reminder_ar_en',
      promotionalOffer: 'promotional_offer_ar_en'
    }
  },

  // Analytics Configuration
  analytics: {
    // Google Analytics 4
    ga4: {
      measurementId: process.env.GA_MEASUREMENT_ID,
      apiSecret: process.env.GA_API_SECRET,
      debugMode: false
    },
    
    // Meta Pixel
    metaPixel: {
      pixelId: process.env.META_PIXEL_ID,
      accessToken: process.env.META_ACCESS_TOKEN,
      testEventCode: null // Set for testing
    },
    
    // Custom events
    events: {
      pageView: true,
      formSubmission: true,
      testDriveScheduled: true,
      vehicleViewed: true,
      leadGenerated: true,
      purchaseCompleted: true
    }
  },

  // Security Configuration
  security: {
    // CORS
    cors: {
      origin: [
        'https://dealership.jo',
        'https://www.dealership.jo',
        'https://admin.dealership.jo'
      ],
      credentials: true
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Too many requests from this IP'
    },
    
    // JWT
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
      refreshExpiresIn: '30d'
    },
    
    // Data encryption
    encryption: {
      algorithm: 'aes-256-gcm',
      key: process.env.ENCRYPTION_KEY
    }
  },

  // Performance Configuration
  performance: {
    // CDN
    cdn: {
      provider: 'cloudflare',
      zones: ['middle-east', 'europe']
    },
    
    // Caching
    cache: {
      strategy: 'stale-while-revalidate',
      maxAge: 3600,
      sMaxAge: 86400,
      staticAssets: 31536000 // 1 year
    },
    
    // Image optimization
    images: {
      formats: ['webp', 'avif'],
      sizes: [640, 750, 828, 1080, 1200],
      quality: 80,
      lazy: true
    },
    
    // Bundle optimization
    bundle: {
      splitting: true,
      compression: 'brotli',
      minify: true,
      treeshake: true
    }
  },

  // Monitoring & Logging
  monitoring: {
    // Sentry
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
    },
    
    // LogRocket
    logRocket: {
      appId: process.env.LOGROCKET_APP_ID,
      enabled: true
    },
    
    // Custom metrics
    metrics: {
      apiLatency: true,
      databaseQueries: true,
      aiProcessingTime: true,
      conversionFunnel: true
    }
  },

  // Backup & Recovery
  backup: {
    // Database backups
    database: {
      frequency: 'daily',
      retention: 30, // days
      time: '02:00', // UTC
      location: 's3://dealership-backups/db'
    },
    
    // File backups
    files: {
      frequency: 'weekly',
      retention: 90, // days
      location: 's3://dealership-backups/files'
    }
  },

  // Localization
  localization: {
    defaultLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    
    // Jordan-specific
    timezone: 'Asia/Amman',
    currency: 'JOD',
    phoneFormat: '+962',
    dateFormat: 'DD/MM/YYYY',
    
    // RTL support
    rtl: {
      enabled: true,
      languages: ['ar']
    }
  },

  // Feature Flags
  features: {
    aiAnalysis: true,
    whatsappIntegration: true,
    campaignAttribution: true,
    inventoryIntegration: false, // Coming soon
    chatbot: true,
    predictiveAnalytics: true,
    customerSegmentation: true,
    automatedFollowUp: true
  },

  // Deployment Checklist
  deploymentChecklist: [
    'Run production build locally',
    'Execute all test suites',
    'Verify environment variables',
    'Check database migrations',
    'Validate Edge Functions',
    'Test WhatsApp webhooks',
    'Verify OpenAI API limits',
    'Configure DNS records',
    'Set up SSL certificates',
    'Enable monitoring tools',
    'Configure backup schedules',
    'Test Arabic RTL layout',
    'Verify Jordan phone validation',
    'Test payment gateway (if applicable)',
    'Update documentation',
    'Notify team of deployment'
  ]
}

// Deployment commands
export const deploymentCommands = {
  // Pre-deployment
  preDeployment: [
    'pnpm test',
    'pnpm test:e2e',
    'pnpm lint',
    'pnpm type-check',
    'supabase db push --dry-run',
    'supabase functions test'
  ],
  
  // Deployment
  deployment: [
    'supabase db push',
    'supabase functions deploy --no-verify-jwt',
    'vercel --prod',
    'pnpm sentry:sourcemaps'
  ],
  
  // Post-deployment
  postDeployment: [
    'pnpm test:production',
    'pnpm lighthouse',
    'pnpm security:audit',
    'curl -X POST https://api.dealership.jo/health',
    'pnpm notify:team'
  ]
}

// Health check endpoints
export const healthChecks = {
  api: 'https://api.dealership.jo/health',
  database: 'https://api.dealership.jo/health/db',
  storage: 'https://api.dealership.jo/health/storage',
  ai: 'https://api.dealership.jo/health/ai',
  whatsapp: 'https://api.dealership.jo/health/whatsapp'
}