import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconLock, IconArrowRight, IconFingerprint, IconShieldCheck } from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import { notifications } from '@mantine/notifications'
import { TahboubLogo } from '../common/TahboubLogo'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'
import '../../styles/modern-theme.css'

gsap.registerPlugin(TextPlugin)

export function ModernAuthPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { signInWithCode } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const isRTL = i18n.language === 'ar'
  
  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return

    // Background animation
    const bgElements = bgRef.current?.querySelectorAll('.bg-element') || []
    bgElements.forEach((el, i) => {
      gsap.to(el, {
        x: `random(-50, 50)`,
        y: `random(-50, 50)`,
        rotation: `random(-15, 15)`,
        duration: `random(15, 25)`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.5
      })
    })

    // Main timeline
    const tl = gsap.timeline()

    // Container fade in
    tl.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8 }
    )

    // Form animation
    .fromTo(formRef.current,
      { 
        opacity: 0,
        scale: 0.8,
        rotationY: -30,
        transformPerspective: 1000
      },
      { 
        opacity: 1,
        scale: 1,
        rotationY: 0,
        duration: 1,
        ease: "power3.out"
      },
      "-=0.4"
    )

    // Logo animation
    .fromTo(logoRef.current,
      {
        opacity: 0,
        scale: 0,
        rotation: -180
      },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1,
        ease: "elastic.out(1, 0.5)"
      },
      "-=0.8"
    )

    // Title text animation
    .fromTo(titleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.4"
    )

    // Input field animation
    .fromTo(inputRef.current,
      { 
        opacity: 0,
        x: isRTL ? 50 : -50,
        scale: 0.9
      },
      { 
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      },
      "-=0.3"
    )

    // Button animation
    .fromTo(buttonRef.current,
      { 
        opacity: 0,
        y: 20,
        scale: 0.9
      },
      { 
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      },
      "-=0.3"
    )

    // Floating particles
    createFloatingParticles()

  }, { scope: containerRef, dependencies: [isRTL] })

  // Create floating particles effect
  const createFloatingParticles = () => {
    if (!particlesRef.current) return

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div')
      particle.className = 'absolute w-1 h-1 bg-blue-400/30 rounded-full'
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      particlesRef.current.appendChild(particle)

      gsap.to(particle, {
        y: `random(-100, -200)`,
        x: `random(-50, 50)`,
        opacity: 0,
        duration: `random(3, 6)`,
        repeat: -1,
        delay: `random(0, 3)`,
        ease: "power1.out"
      })
    }
  }

  // Input focus animation
  const handleInputFocus = () => {
    gsap.to(inputRef.current, {
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  const handleInputBlur = () => {
    gsap.to(inputRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  // Button hover animation
  const handleButtonHover = () => {
    gsap.to(buttonRef.current, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  const handleButtonLeave = () => {
    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Loading animation
    const tl = gsap.timeline()
    tl.to(buttonRef.current, {
      scale: 0.95,
      duration: 0.1
    })
    .to(buttonRef.current, {
      scale: 1,
      duration: 0.1
    })
    
    try {
      const result = await signInWithCode(code)
      
      if (result.success) {
        // Success animation
        gsap.to(formRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            notifications.show({
              title: t('auth.welcome'),
              message: t('messages.form_submitted'),
              color: 'green'
            })
            navigate('/')
          }
        })
      } else {
        // Error shake animation
        gsap.to(formRef.current, {
          x: [0, -10, 10, -10, 10, 0],
          duration: 0.5,
          ease: "power2.out"
        })
        
        notifications.show({
          title: t('status.error'),
          message: result.error || t('validation.phone_invalid'),
          color: 'red'
        })
      }
    } catch (error) {
      gsap.to(formRef.current, {
        x: [0, -10, 10, -10, 10, 0],
        duration: 0.5,
        ease: "power2.out"
      })
      
      notifications.show({
        title: t('status.error'),
        message: t('messages.sync_error'),
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Professional Animated Background */}
      <div ref={bgRef} className="absolute inset-0 -z-10">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        {/* Animated shapes */}
        <div className="bg-element absolute top-20 left-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-20" />
        <div className="bg-element absolute bottom-20 right-20 w-96 h-96 bg-violet-50 rounded-full blur-3xl opacity-20" />
        <div className="bg-element absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-50 to-violet-50 rounded-full blur-3xl opacity-10" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Particles container */}
        <div ref={particlesRef} className="absolute inset-0" />
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="w-full max-w-md transform-gpu"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-clean-lg border border-dealership-border/30 p-8 space-y-6">
          {/* Logo */}
          <div ref={logoRef} className="flex items-center justify-center mb-4 transform-gpu">
            <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-2xl shadow-clean">
              <TahboubLogo size={64} className="drop-shadow-md" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 ref={titleRef} className="text-3xl font-bold text-dealership-black">
              {t('auth.welcome')}
            </h2>
            <p className="text-dealership-dark-text">
              {t('auth.login_description')}
            </p>
          </div>

          {/* Security badges */}
          <div className="flex justify-center gap-4 py-2">
            <div className="flex items-center gap-1 text-dealership-text">
              <IconShieldCheck size={16} className="text-green-500" />
              <span className="text-xs">{t('status.online')}</span>
            </div>
            <div className="flex items-center gap-1 text-dealership-text">
              <IconFingerprint size={16} className="text-blue-500" />
              <span className="text-xs">256-bit</span>
            </div>
          </div>

          {/* Input field */}
          <div className="relative">
            <IconLock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-dealership-text`} size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('auth.password')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-dealership-border focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-center text-lg font-mono tracking-widest bg-gray-50/50 input-professional`}
              required
              autoComplete="off"
              dir="ltr"
            />
          </div>

          {/* Submit button */}
          <button
            ref={buttonRef}
            type="submit"
            disabled={loading}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            className="w-full relative group overflow-hidden bg-dealership-black text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl disabled:opacity-50 btn-professional transform-gpu"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.sign_in')}
                  <IconArrowRight 
                    size={18} 
                    className={`${isRTL ? 'rotate-180' : ''} group-hover:translate-x-1 transition-transform`} 
                  />
                </>
              )}
            </span>
          </button>

          {/* Help text */}
          <div className="text-center">
            <p className="text-dealership-text text-sm">
              {t('Internal use only - Authorized personnel')}
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}