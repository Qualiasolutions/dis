import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IconUserPlus, 
  IconUsers, 
  IconUserCheck, 
  IconChartBar, 
  IconCar, 
  IconTrendingUp,
  IconBrain,
  IconRocket,
  IconShieldCheck,
  IconSparkles,
  IconArrowRight,
  IconCheck
} from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import '../../styles/modern-theme.css'

export function ProfessionalHomePage() {
  const { t } = useTranslation()
  const { isAuthenticated, isConsultant, isManager } = useAuthStore()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const features = [
    {
      icon: IconBrain,
      title: 'AI-Powered Intelligence',
      description: 'Leverage OpenAI GPT-4 for advanced customer insights and predictive analytics',
      gradient: 'from-violet-600 to-indigo-600'
    },
    {
      icon: IconChartBar,
      title: 'Real-time Analytics',
      description: 'Monitor performance metrics with live updates and interactive dashboards',
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      icon: IconShieldCheck,
      title: 'Enterprise Security',
      description: 'Bank-grade security with role-based access control and data encryption',
      gradient: 'from-emerald-600 to-teal-600'
    }
  ]

  const stats = [
    { 
      value: '97%', 
      label: 'Customer Satisfaction',
      icon: IconSparkles,
      color: 'text-violet-500'
    },
    { 
      value: '2.4x', 
      label: 'Sales Increase',
      icon: IconTrendingUp,
      color: 'text-blue-500'
    },
    { 
      value: '< 30s', 
      label: 'Response Time',
      icon: IconRocket,
      color: 'text-emerald-500'
    }
  ]

  const quickActions = [
    {
      title: 'Customer Intake',
      description: 'Register new visitors',
      icon: IconUserPlus,
      path: '/intake',
      gradient: 'from-blue-500 to-blue-600',
      requiresAuth: true
    },
    {
      title: 'Reception Queue',
      description: 'Manage customer flow',
      icon: IconUsers,
      path: '/queue',
      gradient: 'from-emerald-500 to-emerald-600',
      requiresAuth: true
    },
    {
      title: 'Consultant Hub',
      description: 'Access your dashboard',
      icon: IconUserCheck,
      path: '/consultant',
      gradient: 'from-violet-500 to-violet-600',
      requiresAuth: true,
      roleCheck: isConsultant
    },
    {
      title: 'Analytics Center',
      description: 'View insights & reports',
      icon: IconChartBar,
      path: '/dashboard',
      gradient: 'from-orange-500 to-orange-600',
      requiresAuth: true,
      roleCheck: isManager
    }
  ]

  const visibleActions = quickActions.filter(action => {
    if (!action.requiresAuth) return true
    if (!isAuthenticated()) return false
    if (action.roleCheck && !action.roleCheck()) return false
    return true
  })

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50" />
        <div className="absolute inset-0 noise-texture" />
        <motion.div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05), transparent 40%)`
          }}
        />
      </div>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative pt-20 pb-32 px-4"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600">
                {t('welcome.title', 'نظام طهبوب الذكي')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              {t('welcome.description', 'نظام ذكي لإدارة المعارض وتتبع العملاء باستخدام الذكاء الاصطناعي')}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center mb-16"
          >
            {!isAuthenticated() ? (
              <>
                <Link
                  to="/auth"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <IconArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-full hover:border-gray-400 transition-all duration-300 hover:shadow-lg">
                  Learn More
                </button>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Open Dashboard
                  <IconArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Quick Actions Grid */}
      {isAuthenticated() && visibleActions.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="py-20 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Link
                    to={action.path}
                    className="block p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-4`}>
                        <action.icon size={24} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Key Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the modern dealership with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="group"
              >
                <div className="h-full p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center text-blue-600 font-semibold">
                    Learn more
                    <IconArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Bottom CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="py-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-blue-600 to-violet-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Dealership?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join leading automotive retailers using our AI-powered platform
              </p>
              <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
