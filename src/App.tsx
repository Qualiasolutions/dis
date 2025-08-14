import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { useLanguageStore } from './stores/languageStore'
import { useAuthStore } from './stores/authStore'
import { ModernHeader } from './components/layout/ModernHeader'
import { ModernAuthPage } from './components/auth/ModernAuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { CustomerIntakeForm } from './components/forms/CustomerIntakeForm'
import { PWAUpdater } from './components/common/PWAUpdater'
import { ReceptionQueue } from './components/queue/ReceptionQueue'
import { ConsultantDashboard } from './components/consultant/ConsultantDashboard'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
import { UserProfile } from './components/profile/UserProfile'
import { SimpleHomePage } from './components/layout/SimpleHomePage'
import { PageTransition } from './components/common/PageTransition'
import './styles/modern-theme.css'

function App() {
  const { i18n } = useTranslation()
  const { language } = useLanguageStore()
  const { initialize } = useAuthStore()

  // Initialize auth on app start
  useEffect(() => {
    initialize()
  }, [initialize])

  // Update HTML dir attribute when language changes
  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', language)
    i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <>
      <div className="min-h-screen bg-dealership-light mobile-container">
        <ModernHeader />
          
          <main className="pt-16 sm:pt-20 mobile-container">
            <PageTransition>
              <Routes>
                <Route path="/" element={<SimpleHomePage />} />
                <Route path="/auth" element={<ModernAuthPage />} />
                <Route 
                  path="/intake" 
                  element={
                    <ProtectedRoute requiredRole={['reception', 'consultant', 'manager', 'admin']}>
                      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 mobile-container" data-animate>
                        <CustomerIntakeForm />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/queue" 
                  element={
                    <ProtectedRoute requiredRole={['reception', 'consultant', 'manager', 'admin']}>
                      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 mobile-container" data-animate>
                        <ReceptionQueue />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/consultant" 
                  element={
                    <ProtectedRoute requiredRole={['consultant', 'manager', 'admin']}>
                      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 mobile-container" data-animate>
                        <ConsultantDashboard />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute requiredRole={['manager', 'admin']}>
                      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 mobile-container" data-animate>
                        <AnalyticsDashboard />
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requiredRole={['reception', 'consultant', 'manager', 'admin']}>
                      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 mobile-container" data-animate>
                        <UserProfile />
                      </div>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </PageTransition>
          </main>
      </div>
      <PWAUpdater />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}

export default App