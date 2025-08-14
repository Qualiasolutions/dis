import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import { useGSAP } from '@gsap/react'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin)

// Custom hook for GSAP animations with scroll triggers
export const useScrollAnimation = (
  animationFn: (gsap: typeof gsap) => void,
  dependencies: any[] = []
) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      animationFn(gsap)
    }
  }, { scope: ref, dependencies })
  
  return ref
}

// Fade in animation hook
export const useFadeIn = (delay = 0, duration = 1) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration, 
          delay,
          ease: "power2.out"
        }
      )
    }
  }, { scope: ref })
  
  return ref
}

// Stagger animation hook for lists
export const useStaggerAnimation = (stagger = 0.1, duration = 0.8) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      const children = ref.current.children
      gsap.fromTo(children,
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration,
          stagger,
          ease: "power3.out"
        }
      )
    }
  }, { scope: ref })
  
  return ref
}

// Parallax scroll effect hook
export const useParallax = (speed = 0.5) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      gsap.to(ref.current, {
        yPercent: -100 * speed,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      })
    }
  }, { scope: ref })
  
  return ref
}

// Text typing animation hook
export const useTypewriter = (text: string, duration = 2) => {
  const ref = useRef<HTMLElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      ref.current.textContent = ""
      gsap.to(ref.current, {
        duration,
        text,
        ease: "none"
      })
    }
  }, { scope: ref, dependencies: [text] })
  
  return ref
}

// Scale on hover hook
export const useScaleHover = (scale = 1.05) => {
  const ref = useRef<HTMLElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      ref.current.addEventListener('mouseenter', () => {
        gsap.to(ref.current, { scale, duration: 0.3, ease: "power2.out" })
      })
      
      ref.current.addEventListener('mouseleave', () => {
        gsap.to(ref.current, { scale: 1, duration: 0.3, ease: "power2.out" })
      })
    }
  }, { scope: ref })
  
  return ref
}

// Magnetic button effect
export const useMagneticEffect = (strength = 0.3) => {
  const ref = useRef<HTMLElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      const element = ref.current
      
      const handleMouseMove = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        
        gsap.to(element, {
          x: x * strength,
          y: y * strength,
          duration: 0.3,
          ease: "power2.out"
        })
      }
      
      const handleMouseLeave = () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.out"
        })
      }
      
      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, { scope: ref })
  
  return ref
}

// Smooth reveal animation on scroll
export const useRevealOnScroll = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { 
          opacity: 0,
          y: 50,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      )
    }
  }, { scope: ref })
  
  return ref
}

// Page transition hook
export const usePageTransition = () => {
  const ref = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      const tl = gsap.timeline()
      
      tl.fromTo(ref.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
      )
      
      // Animate children with stagger
      const children = ref.current.querySelectorAll('[data-animate]')
      if (children.length > 0) {
        tl.fromTo(children,
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
          },
          "-=0.3"
        )
      }
    }
  }, { scope: ref })
  
  return ref
}

// Counter animation hook
export const useCounterAnimation = (endValue: number, duration = 2) => {
  const ref = useRef<HTMLElement>(null)
  
  useGSAP(() => {
    if (ref.current) {
      const obj = { value: 0 }
      gsap.to(obj, {
        value: endValue,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = Math.round(obj.value).toString()
          }
        }
      })
    }
  }, { scope: ref, dependencies: [endValue] })
  
  return ref
}
