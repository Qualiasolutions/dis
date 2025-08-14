import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguageStore } from '../../stores/languageStore'
import { ModernNavigation } from '../common/ModernNavigation'
import { LanguageToggle } from '../common/LanguageToggle'
import { UserMenu } from '../auth/UserMenu'
import { TahboubLogo } from '../common/TahboubLogo'
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
          ? 'bg-dealership-white/95 backdrop-blur-sm border-b border-dealership-medium shadow-clean' 
          : 'bg-dealership-white/80 backdrop-blur-sm'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <TahboubLogo size={48} className="mr-4" />
              <div className="border-l border-dealership-border h-8 mr-4"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-dealership-black">
                {language === 'ar' ? 'نظام طهبوب للسيارات' : 'Tahboub Automotive'}
              </h1>
              <p className="text-xs text-dealership-dark-text -mt-1">
                {language === 'ar' ? 'نظام إدارة المبيعات' : 'Dealership Management'}
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
