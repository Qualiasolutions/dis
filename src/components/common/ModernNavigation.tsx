import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { animationUtils } from '../../utils/animations'

export function ModernNavigation() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, user, isConsultant, isManager } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isRTL = i18n.language === 'ar'
  
  // Refs for animations
  const navRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileOverlayRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const prevPathRef = useRef(location.pathname)

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

  // Animate active indicator
  useEffect(() => {
    if (!indicatorRef.current || !navRef.current) return
    
    const activeItem = navRef.current.querySelector(`[data-path="${location.pathname}"]`)
    if (activeItem) {
      const rect = activeItem.getBoundingClientRect()
      const navRect = navRef.current.getBoundingClientRect()
      
      gsap.to(indicatorRef.current, {
        x: rect.left - navRect.left,
        width: rect.width,
        duration: 0.5,
        ease: "power2.inOut"
      })
    }
    
    prevPathRef.current = location.pathname
  }, [location.pathname])

  // Mobile menu animations
  useGSAP(() => {
    if (isMobileMenuOpen && mobileMenuRef.current && mobileOverlayRef.current) {
      // Overlay fade in
      gsap.fromTo(mobileOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      )
      
      // Menu slide in
      gsap.fromTo(mobileMenuRef.current,
        { x: isRTL ? '-100%' : '100%' },
        { x: 0, duration: 0.5, ease: "power3.out" }
      )
      
      // Menu items stagger animation
      const items = mobileMenuRef.current.querySelectorAll('.mobile-nav-item')
      gsap.fromTo(items,
        { 
          opacity: 0,
          x: isRTL ? -20 : 20
        },
        { 
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.2
        }
      )
    }
  }, { dependencies: [isMobileMenuOpen, isRTL] })

  const closeMobileMenu = () => {
    if (mobileMenuRef.current && mobileOverlayRef.current) {
      gsap.to(mobileOverlayRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => setIsMobileMenuOpen(false)
      })
      
      gsap.to(mobileMenuRef.current, {
        x: isRTL ? '-100%' : '100%',
        duration: 0.4,
        ease: "power2.in"
      })
    } else {
      setIsMobileMenuOpen(false)
    }
  }

  // Nav item hover effect
  const handleNavItemHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget
    gsap.to(target, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  const handleNavItemLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget
    gsap.to(target, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav ref={navRef} className="hidden lg:flex items-center space-x-1 relative">
        {/* Active indicator */}
        <div 
          ref={indicatorRef}
          className="absolute bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 transition-opacity"
          style={{ opacity: 0.8 }}
        />
        
        {visibleNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            data-path={item.path}
            className="relative group"
            onMouseEnter={handleNavItemHover}
            onMouseLeave={handleNavItemLeave}
            onClick={(e) => {
              const target = e.currentTarget
              animationUtils.createRipple(e as any, target)
            }}
          >
            <div
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform-gpu
                ${isActive(item.path) 
                  ? 'text-dealership-black bg-dealership-light' 
                  : 'text-dealership-dark-text hover:text-dealership-black hover:bg-dealership-gray'
                }
              `}
            >
              <item.icon size={18} className="transition-transform group-hover:scale-110" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden p-2 rounded-lg text-dealership-dark-text hover:bg-dealership-gray transition-all transform-gpu hover:scale-105"
      >
        {isMobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
      </button>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <>
          <div
            ref={mobileOverlayRef}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobileMenu}
          />
          <nav
            ref={mobileMenuRef}
            className={`fixed ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-72 sm:w-80 bg-white shadow-2xl z-50 lg:hidden transform-gpu max-w-[85vw]`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-dealership-black">{t('navigation.menu', 'Menu')}</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-dealership-dark-text hover:bg-dealership-gray transition-all transform hover:scale-105 hover:rotate-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <IconX size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {visibleNavItems.map((item, index) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`
                      mobile-nav-item flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-all duration-300 transform-gpu min-h-[44px]
                      ${isActive(item.path) 
                        ? 'text-dealership-black bg-dealership-light' 
                        : 'text-dealership-dark-text hover:text-dealership-black hover:bg-dealership-gray'
                      }
                      hover:translate-x-1
                    `}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <item.icon size={20} className="transition-transform hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
              
              {/* User info in mobile menu */}
              {isAuthenticated() && user && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-dealership-border">
                  <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-dealership-light rounded-lg">
                    <IconUser size={20} className="text-dealership-dark-text flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-dealership-black text-sm truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-dealership-text truncate">
                        {t(`roles.${user.user_role}`, user.user_role)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  )
}