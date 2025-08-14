# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dealership Intelligence System (DIS) - An AI-powered car dealership management system for Jordan, built as a Turborepo monorepo with React/TypeScript frontend and Supabase backend.

## Development Commands

### Core Commands
```bash
# Development - starts all apps in dev mode
pnpm dev

# Build - builds all apps and packages
pnpm build

# Linting - runs ESLint across all packages
pnpm lint

# Type checking - validates TypeScript types
pnpm check-types

# Testing - runs all tests
pnpm test
pnpm test:run          # Run once without watching
pnpm test:coverage     # Generate coverage report

# Format code
pnpm format
```

### Package-Specific Commands
```bash
# Work on specific app
pnpm --filter web dev        # Start web app only
pnpm --filter web test       # Test web app only
pnpm --filter web build      # Build web app only

# Run single test file
pnpm --filter web test src/components/consultant/__tests__/ConsultantDashboard.test.tsx
```

### Database Commands
```bash
# Supabase local development
supabase start          # Start local Supabase
supabase db reset       # Reset and reseed database
supabase migration new  # Create new migration
```

## Architecture

### Monorepo Structure
- **Turborepo** orchestrates builds and caching across packages
- **apps/web**: Main React SPA with Vite, Mantine UI, React Query, Zustand
- **apps/docs**: Next.js documentation site (minimal usage)
- **packages/**: Shared packages (ui, eslint-config, typescript-config)
- **supabase/**: Database migrations, Edge Functions, and configurations

### Frontend Architecture (apps/web)
- **State Management**: 
  - Zustand stores in `src/stores/` for auth, language, queue, consultants
  - React Query for server state and caching
- **Routing**: React Router v6 with role-based protected routes
- **UI Components**: Mantine v7 components with bilingual support (Arabic/English)
- **Testing**: Vitest with React Testing Library, tests alongside components in `__tests__/`
- **PWA**: Service worker with Workbox for offline support
- **Web Workers**: Chart computations offloaded to workers for performance

### Backend Architecture
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Deno-based Supabase Functions for AI analysis, auth, visits
- **AI Integration**: OpenAI GPT-4 for customer visit analysis and insights
- **Real-time**: Supabase real-time subscriptions for queue updates

### Key Design Patterns
1. **Component Organization**: Feature-based folders (consultant/, analytics/, auth/)
2. **Custom Hooks**: Business logic abstracted to hooks in `src/hooks/`
3. **Lazy Loading**: Heavy components loaded on-demand for performance
4. **Error Boundaries**: Graceful error handling with fallback UI
5. **Optimistic Updates**: UI updates before server confirmation for responsiveness

## Important Context

### Authentication & Authorization
- Role-based access: reception, consultant, manager, admin
- Supabase Auth with JWT tokens
- Protected routes check roles before rendering

### Internationalization
- i18next for translations (Arabic/English)
- RTL support for Arabic UI
- Language preference stored in Zustand and localStorage

### Performance Optimizations
- React.memo for expensive components
- Virtual scrolling for large lists (react-window)
- Web Workers for chart calculations
- Bundle splitting with dynamic imports

### Testing Strategy
- Unit tests for components with Vitest
- Integration tests for workflows
- E2E placeholder tests (not fully implemented)
- Test files co-located with components in `__tests__/`

### Deployment
- Vercel deployment configured for web app
- Static SPA with client-side routing
- Environment variables for Supabase connection