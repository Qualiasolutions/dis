import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../../stores/languageStore'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLDivElement>(null)

  // Simple toggle animation
  useGSAP(() => {
    if (!containerRef.current) return
    
    // Initial fade in
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    )
  }, { scope: containerRef })

  const handleLanguageChange = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar'
    
    // Animate the toggle
    if (toggleRef.current) {
      gsap.to(toggleRef.current, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          setLanguage(newLanguage)
        }
      })
    }
  }

  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-2"
    >
      {/* Simple toggle button */}
      <button
        ref={toggleRef}
        onClick={handleLanguageChange}
        className="relative flex items-center bg-dealership-light hover:bg-dealership-gray border border-dealership-border rounded-full p-1 transition-all duration-200 overflow-hidden transform-gpu"
        aria-label="Toggle language"
      >
        {/* Toggle track */}
        <div className="relative flex items-center w-20 h-8">
          {/* Toggle thumb */}
          <div 
            className={`
              absolute w-10 h-6 bg-dealership-black rounded-full shadow-sm transition-transform duration-300 ease-in-out
              ${language === 'ar' ? 'translate-x-0' : 'translate-x-9'}
            `}
          />
          
          {/* Language labels */}
          <div className="relative z-10 w-full flex items-center justify-between px-2 pointer-events-none">
            <span 
              className={`
                text-xs font-medium transition-colors duration-300
                ${language === 'ar' ? 'text-white' : 'text-dealership-dark-text'}
              `}
            >
              ع
            </span>
            <span 
              className={`
                text-xs font-medium transition-colors duration-300
                ${language === 'en' ? 'text-white' : 'text-dealership-dark-text'}
              `}
            >
              EN
            </span>
          </div>
        </div>
      </button>
      
      {/* Current language text (optional) */}
      <span className="text-sm text-dealership-dark-text hidden sm:inline">
        {language === 'ar' ? 'العربية' : 'English'}
      </span>
    </div>
  )
}