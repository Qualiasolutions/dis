import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../../stores/languageStore'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { IconLanguage } from '@tabler/icons-react'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()
  const toggleRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const arButtonRef = useRef<HTMLButtonElement>(null)
  const enButtonRef = useRef<HTMLButtonElement>(null)
  const isInitialized = useRef(false)

  // Animate slider position based on language
  useEffect(() => {
    if (!sliderRef.current || !arButtonRef.current || !enButtonRef.current || !toggleRef.current) return
    
    const targetButton = language === 'ar' ? arButtonRef.current : enButtonRef.current
    const rect = targetButton.getBoundingClientRect()
    const containerRect = toggleRef.current.getBoundingClientRect()
    
    // Calculate relative position within the container
    const relativeLeft = rect.left - containerRect.left - 1 // Subtract 1px for the padding
    
    if (!isInitialized.current) {
      // Set initial position without animation
      gsap.set(sliderRef.current, {
        x: relativeLeft,
        width: rect.width,
      })
      isInitialized.current = true
    } else {
      // Animate to new position
      gsap.to(sliderRef.current, {
        x: relativeLeft,
        width: rect.width,
        duration: 0.5,
        ease: "power2.inOut"
      })
    }
  }, [language])

  useGSAP(() => {
    if (!toggleRef.current) return
    
    // Initial animation
    gsap.fromTo(toggleRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
    )
  }, { scope: toggleRef })

  const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
    if (language === newLanguage) return
    
    // Animate the toggle
    const tl = gsap.timeline()
    
    // Scale down current button
    const currentButton = language === 'ar' ? arButtonRef.current : enButtonRef.current
    const newButton = newLanguage === 'ar' ? arButtonRef.current : enButtonRef.current
    
    if (currentButton && newButton) {
      tl.to(currentButton, {
        scale: 0.95,
        duration: 0.1
      })
      .to(newButton, {
        scale: 1.05,
        duration: 0.1
      }, "-=0.05")
      .to(newButton, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      })
    }
    
    // Rotate icon
    const icon = toggleRef.current?.querySelector('.language-icon')
    if (icon) {
      gsap.to(icon, {
        rotation: 360,
        duration: 0.5,
        ease: "power2.out"
      })
    }
    
    setLanguage(newLanguage)
  }

  return (
    <div 
      ref={toggleRef}
      className="relative inline-flex items-center gap-2 bg-dealership-light rounded-lg p-1 shadow-clean"
    >
      {/* Language icon */}
      <IconLanguage 
        size={20} 
        className="language-icon text-dealership-dark-text mx-2 transform-gpu" 
      />
      
      {/* Sliding background */}
      <div 
        ref={sliderRef}
        className="absolute top-1 h-8 bg-dealership-black rounded-md pointer-events-none"
        style={{ 
          opacity: 0.9,
          left: 0,
          transform: 'translateX(0)',
          zIndex: 1
        }}
      />
      
      {/* Language buttons */}
      <button
        ref={arButtonRef}
        onClick={() => handleLanguageChange('ar')}
        className={`
          relative z-10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-300 transform-gpu
          ${language === 'ar' 
            ? 'text-white' 
            : 'text-dealership-dark-text hover:text-dealership-black'
          }
        `}
      >
        {t('language.arabic')}
      </button>
      
      <button
        ref={enButtonRef}
        onClick={() => handleLanguageChange('en')}
        className={`
          relative z-10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-300 transform-gpu
          ${language === 'en' 
            ? 'text-white' 
            : 'text-dealership-dark-text hover:text-dealership-black'
          }
        `}
      >
        {t('language.english')}
      </button>
    </div>
  )
}