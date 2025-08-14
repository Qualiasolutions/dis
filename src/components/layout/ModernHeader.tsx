import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguageStore } from '../../stores/languageStore'
import { ModernNavigation } from '../common/ModernNavigation'
import { LanguageToggle } from '../common/LanguageToggle'
import { UserMenu } from '../auth/UserMenu'
import { IconSparkles } from '@tabler/icons-react'
import '../../styles/modern-theme.css'

export function ModernHeader() {
  const { language } = useLanguageStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled 
          ? 'glass-morphism shadow-lg' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl blur-xl opacity-50 animate-pulse-glow" />
              <div className="relative bg-gradient-to-r from-blue-600 to-violet-600 p-2 rounded-xl">
                <IconSparkles size={28} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600">
                  {language === 'ar' ? 'نظام طهبوب' : 'Tahboub DIS'}
                </span>
              </h1>
              <p className="text-xs text-gray-600 -mt-1">
                {language === 'ar' ? 'الذكاء الاصطناعي' : 'AI-Powered'}
              </p>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex-1 flex justify-center px-8">
            <ModernNavigation />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LanguageToggle />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <UserMenu />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
