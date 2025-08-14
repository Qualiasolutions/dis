import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../../stores/languageStore'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// Alternative design - Simple button group
export function LanguageToggleAlt() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    
    // Initial fade in
    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
    )
  }, { scope: containerRef })

  const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
    if (language === newLanguage) return
    
    // Simple scale animation on click
    const button = containerRef.current?.querySelector(`[data-lang="${newLanguage}"]`)
    if (button) {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      })
    }
    
    setLanguage(newLanguage)
  }

  return (
    <div 
      ref={containerRef}
      className="inline-flex rounded-lg border border-dealership-border bg-dealership-white overflow-hidden"
    >
      <button
        data-lang="ar"
        onClick={() => handleLanguageChange('ar')}
        className={`
          px-4 py-2 text-sm font-medium transition-all duration-200
          ${language === 'ar' 
            ? 'bg-dealership-black text-white' 
            : 'bg-transparent text-dealership-dark-text hover:bg-dealership-light'
          }
        `}
      >
        العربية
      </button>
      
      <div className="w-px bg-dealership-border" />
      
      <button
        data-lang="en"
        onClick={() => handleLanguageChange('en')}
        className={`
          px-4 py-2 text-sm font-medium transition-all duration-200
          ${language === 'en' 
            ? 'bg-dealership-black text-white' 
            : 'bg-transparent text-dealership-dark-text hover:bg-dealership-light'
          }
        `}
      >
        English
      </button>
    </div>
  )
}
