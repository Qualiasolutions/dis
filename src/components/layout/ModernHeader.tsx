import React, { useEffect, useState, useRef } from 'react'
import { useLanguageStore } from '../../stores/languageStore'
import { ModernNavigation } from '../common/ModernNavigation'
import { LanguageToggle } from '../common/LanguageToggle'
import { UserMenu } from '../auth/UserMenu'
import { TahboubLogo } from '../common/TahboubLogo'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../../styles/modern-theme.css'

gsap.registerPlugin(ScrollTrigger)

export function ModernHeader() {
  const { language } = useLanguageStore()
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const rightSectionRef = useRef<HTMLDivElement>(null)
  const isRTL = language === 'ar'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // GSAP animations for header elements
  useGSAP(() => {
    if (!headerRef.current) return

    // Initial animation timeline
    const tl = gsap.timeline()
    
    // Header slide down animation
    tl.fromTo(headerRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
    
    // Logo animation
    .fromTo(logoRef.current,
      { 
        opacity: 0, 
        scale: 0,
        rotation: -90
      },
      { 
        opacity: 1, 
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      },
      "-=0.4"
    )
    
    // Navigation items stagger animation
    .fromTo(navRef.current?.children || [],
      { 
        opacity: 0, 
        y: -20,
        scale: 0.9
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      },
      "-=0.3"
    )
    
    // Right section animation
    .fromTo(rightSectionRef.current?.children || [],
      { 
        opacity: 0, 
        x: isRTL ? -20 : 20,
        scale: 0.9
      },
      { 
        opacity: 1, 
        x: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      },
      "-=0.2"
    )

    // Scroll-based animations
    ScrollTrigger.create({
      trigger: headerRef.current,
      start: "top top",
      onUpdate: (self) => {
        const progress = self.progress
        if (headerRef.current) {
          // Subtle parallax effect on scroll
          gsap.to(headerRef.current, {
            backdropFilter: scrolled ? "blur(12px)" : "blur(8px)",
            duration: 0.3
          })
        }
      }
    })

  }, { scope: headerRef, dependencies: [isRTL] })

  // Logo hover animation
  const handleLogoHover = () => {
    gsap.to(logoRef.current, {
      scale: 1.05,
      rotation: 5,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  const handleLogoLeave = () => {
    gsap.to(logoRef.current, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  return (
    <header
      ref={headerRef}
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${scrolled 
          ? 'bg-dealership-white/95 backdrop-blur-xl border-b border-dealership-medium shadow-clean-lg' 
          : 'bg-dealership-white/80 backdrop-blur-md'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div 
            className="flex items-center space-x-4 rtl:space-x-reverse cursor-pointer"
            onMouseEnter={handleLogoHover}
            onMouseLeave={handleLogoLeave}
          >
            <div ref={logoRef} className="flex items-center transform-gpu">
              <TahboubLogo size={48} className="drop-shadow-md" />
              <div className={`border-l border-dealership-border h-8 ${isRTL ? 'ml-4 mr-4' : 'mr-4 ml-4'}`}></div>
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-dealership-black transform transition-transform hover:scale-105">
                {language === 'ar' ? 'نظام طهبوب للسيارات' : 'Tahboub Automotive'}
              </h1>
              <p className="text-xs text-dealership-dark-text -mt-1 opacity-80">
                {language === 'ar' ? 'نظام إدارة المبيعات' : 'Dealership Management'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div ref={navRef} className="flex-1 flex justify-center px-8">
            <ModernNavigation />
          </div>

          {/* Right Section */}
          <div ref={rightSectionRef} className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="transform transition-all hover:scale-105">
              <LanguageToggle />
            </div>
            <div className="transform transition-all hover:scale-105">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar on scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dealership-light overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-transform duration-300"
          style={{
            transform: `translateX(${scrolled ? '0' : '-100'}%)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
      </div>
    </header>
  )
}