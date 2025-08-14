import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IconHome,
  IconUserPlus, 
  IconUsers, 
  IconUserCheck, 
  IconChartBar,
  IconUser,
  IconMenu2,
  IconX
} from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'

export function ModernNavigation() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, user, isConsultant, isManager } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    {
      label: t('navigation.home', 'Home'),
      path: '/',
      icon: IconHome,
      public: true
    },
    {
      label: t('navigation.intake', 'Customer Intake'),
      path: '/intake',
      icon: IconUserPlus,
      requiredRole: ['reception', 'consultant', 'manager', 'admin']
    },
    {
      label: t('navigation.queue', 'Reception Queue'),
      path: '/queue',
      icon: IconUsers,
      requiredRole: ['reception', 'consultant', 'manager', 'admin']
    },
    {
      label: t('navigation.consultant', 'Consultant'),
      path: '/consultant',
      icon: IconUserCheck,
      requiredRole: ['consultant', 'manager', 'admin'],
      roleCheck: isConsultant
    },
    {
      label: t('navigation.dashboard', 'Analytics'),
      path: '/dashboard',
      icon: IconChartBar,
      requiredRole: ['manager', 'admin'],
      roleCheck: isManager
    }
  ]

  const visibleNavItems = navItems.filter(item => {
    if (item.public) return true
    if (!isAuthenticated()) return false
    if (item.requiredRole && user?.user_role && !item.requiredRole.includes(user.user_role)) return false
    if (item.roleCheck && !item.roleCheck()) return false
    return true
  })

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-1">
        {visibleNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="relative group"
          >
            <motion.div
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
                ${isActive(item.path) 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </motion.div>
            {isActive(item.path) && (
              <motion.div
                layoutId="navbar-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
      >
        {isMobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
      </button>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <IconX size={24} />
                  </button>
                </div>
                <div className="space-y-2">
                  {visibleNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                        ${isActive(item.path) 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
