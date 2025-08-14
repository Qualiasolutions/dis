import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, Text, Stack } from '@mantine/core'
import { IconLogin, IconArrowRight } from '@tabler/icons-react'
import { useAuthStore } from '../../stores/authStore'
import { TahboubLogo } from '../common/TahboubLogo'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useFadeIn, useScaleHover, useMagneticEffect } from '../../hooks/useGSAPAnimation'
import { animationUtils } from '../../utils/animations'

export function SimpleHomePage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useMagneticEffect(0.2)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const isRTL = i18n.language === 'ar'

  // Main page animation timeline
  useGSAP(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline()
    
    // Background particles animation
    const particles = containerRef.current.querySelectorAll('.particle')
    particles.forEach((particle, i) => {
      gsap.to(particle, {
        x: `random(-100, 100)`,
        y: `random(-100, 100)`,
        rotation: `random(-180, 180)`,
        duration: `random(10, 20)`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.1
      })
    })

    // Main content animation
    tl.fromTo(cardRef.current, 
      { 
        opacity: 0, 
        scale: 0.9,
        y: 50,
        rotationX: -15
      },
      { 
        opacity: 1, 
        scale: 1,
        y: 0,
        rotationX: 0,
        duration: 1,
        ease: "power3.out"
      }
    )
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
        duration: 1.2,
        ease: "elastic.out(1, 0.5)"
      },
      "-=0.8"
    )

    // Text scramble effect on title
    if (titleRef.current) {
      const text = titleRef.current.textContent || ''
      animationUtils.scrambleText(titleRef.current, text, 1.5)
    }
  }, { scope: containerRef })

  // Hover animations
  const handleCardHover = () => {
    gsap.to(cardRef.current, {
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
      y: -5,
      duration: 0.3
    })
  }

  const handleCardLeave = () => {
    gsap.to(cardRef.current, {
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      y: 0,
      duration: 0.3
    })
  }

  if (isAuthenticated && user) {
    // Authenticated user view
    return (
      <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-dealership-light relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient orbs */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-blue-100 to-violet-100 rounded-full blur-3xl opacity-30 animate-subtle-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-violet-100 to-pink-100 rounded-full blur-3xl opacity-30 animate-subtle-float" style={{ animationDelay: '2s' }} />
          
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="particle absolute w-2 h-2 bg-dealership-black/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-md w-full mx-4">
          <Card 
            ref={cardRef}
            className="p-8 text-center bg-white/80 backdrop-blur-xl border border-white/20 shadow-clean-lg"
            onMouseEnter={handleCardHover}
            onMouseLeave={handleCardLeave}
          >
            <Stack gap="lg">
              <div ref={logoRef} className="mx-auto w-20 h-16 flex items-center justify-center transform-gpu">
                <TahboubLogo size={64} className="drop-shadow-md" />
              </div>
              
              <div>
                <Text 
                  ref={titleRef}
                  size="xl" 
                  fw={700} 
                  className="text-dealership-black mb-2"
                >
                  {t('welcome')} {user.name || user.email}
                </Text>
                <Text size="sm" className="text-dealership-dark-text animate-fade-in">
                  {t('Choose your workspace')}
                </Text>
              </div>

              <Stack gap="sm">
                <Button
                  ref={buttonRef}
                  component={Link}
                  to="/queue"
                  variant="filled"
                  color="dealership"
                  size="md"
                  fullWidth
                  leftSection={<IconArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />}
                  className="btn-professional group relative overflow-hidden"
                >
                  <span className="relative z-10">{t('Enter System')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </Stack>
            </Stack>
          </Card>
        </div>
      </div>
    )
  }

  // Sign-in prompt for unauthenticated users
  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-dealership-light relative overflow-hidden">
      {/* Professional animated background */}
      <div className="absolute inset-0 -z-10">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-50 to-violet-50 rounded-full blur-3xl opacity-40 animate-subtle-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-violet-50 to-pink-50 rounded-full blur-3xl opacity-40 animate-subtle-float" style={{ animationDelay: '3s' }} />
        
        {/* Floating elements */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-dealership-black/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full mx-4">
        <Card 
          ref={cardRef}
          className="p-8 text-center bg-white/90 backdrop-blur-2xl border border-dealership-border/50 shadow-clean-lg card-professional"
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <Stack gap="lg">
            <div ref={logoRef} className="mx-auto w-24 h-20 flex items-center justify-center transform-gpu">
              <TahboubLogo size={80} className="drop-shadow-lg hover:drop-shadow-xl transition-all duration-300" />
            </div>
            
            <div>
              <Text 
                ref={titleRef}
                size="xl" 
                fw={700} 
                className="text-dealership-black mb-2 text-shimmer"
              >
                {t('Tahboub Automotive')}
              </Text>
              <Text size="sm" className="text-dealership-dark-text animate-fade-in">
                {t('Dealership Management System')}
              </Text>
            </div>

            <Stack gap="sm">
              <Button
                ref={buttonRef}
                component={Link}
                to="/auth"
                variant="filled"
                color="dealership"
                size="lg"
                fullWidth
                leftSection={<IconLogin size={20} />}
                className="btn-professional group relative overflow-hidden transform-gpu"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  const target = e.currentTarget
                  animationUtils.createRipple(e as any, target)
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('Sign In')}
                  <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-dealership-black to-dealership-very-dark opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
              
              <Text size="xs" className="text-dealership-text opacity-70">
                {t('Internal use only - Authorized personnel')}
              </Text>
            </Stack>
          </Stack>
        </Card>
      </div>
    </div>
  )
}