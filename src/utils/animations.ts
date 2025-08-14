import gsap from 'gsap'

// Animation presets for consistent animations across the app
export const animations = {
  // Entrance animations
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    duration: 0.8,
    ease: "power3.out"
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    duration: 0.8,
    ease: "power3.out"
  },
  
  fadeInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    duration: 0.8,
    ease: "power3.out"
  },
  
  fadeInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    duration: 0.8,
    ease: "power3.out"
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    duration: 0.6,
    ease: "power2.out"
  },
  
  // Interactive animations
  hover: {
    scale: 1.05,
    duration: 0.3,
    ease: "power2.out"
  },
  
  tap: {
    scale: 0.95,
    duration: 0.1,
    ease: "power2.inOut"
  },
  
  // Complex animations
  morphing: {
    duration: 0.8,
    ease: "power3.inOut"
  },
  
  // Page transitions
  pageEnter: {
    from: { opacity: 0, scale: 0.98 },
    to: { opacity: 1, scale: 1 },
    duration: 0.6,
    ease: "power2.out"
  },
  
  pageExit: {
    to: { opacity: 0, scale: 0.98 },
    duration: 0.4,
    ease: "power2.in"
  }
}

// Stagger configurations
export const staggerConfig = {
  cards: {
    each: 0.1,
    from: "start",
    ease: "power2.out"
  },
  
  list: {
    each: 0.05,
    from: "start",
    ease: "power2.out"
  },
  
  menu: {
    each: 0.03,
    from: "start",
    ease: "power2.out"
  }
}

// ScrollTrigger presets
export const scrollTriggerPresets = {
  fadeIn: {
    start: "top 80%",
    end: "bottom 20%",
    toggleActions: "play none none reverse"
  },
  
  parallax: {
    start: "top bottom",
    end: "bottom top",
    scrub: true
  },
  
  pinned: {
    start: "top top",
    end: "bottom top",
    pin: true,
    pinSpacing: false
  }
}

// Custom easing functions
export const customEasings = {
  smooth: "power3.inOut",
  bounce: "elastic.out(1, 0.3)",
  sharp: "power4.out",
  slow: "power2.inOut"
}

// Animation utilities
export const animationUtils = {
  // Smooth number counter
  animateCounter: (element: HTMLElement, endValue: number, duration = 2) => {
    const obj = { value: 0 }
    return gsap.to(obj, {
      value: endValue,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toLocaleString()
      }
    })
  },
  
  // Text scramble effect
  scrambleText: (element: HTMLElement, newText: string, duration = 1) => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const originalText = element.textContent || ""
    let iteration = 0
    
    const interval = setInterval(() => {
      element.textContent = newText
        .split("")
        .map((letter, index) => {
          if (index < iteration) {
            return newText[index]
          }
          return chars[Math.floor(Math.random() * chars.length)]
        })
        .join("")
      
      if (iteration >= newText.length) {
        clearInterval(interval)
      }
      
      iteration += 1 / 3
    }, 30)
    
    return () => clearInterval(interval)
  },
  
  // Magnetic effect
  magneticEffect: (element: HTMLElement, strength = 0.3) => {
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
  },
  
  // Ripple effect
  createRipple: (event: MouseEvent, element: HTMLElement) => {
    const ripple = document.createElement('span')
    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    ripple.classList.add('ripple')
    
    element.appendChild(ripple)
    
    gsap.to(ripple, {
      scale: 2,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    })
  }
}

// Responsive animation configurations
export const responsiveAnimations = {
  mobile: {
    duration: 0.6,
    distance: 20
  },
  tablet: {
    duration: 0.8,
    distance: 30
  },
  desktop: {
    duration: 1,
    distance: 40
  }
}

// Get responsive animation config based on screen size
export const getResponsiveConfig = () => {
  const width = window.innerWidth
  if (width < 640) return responsiveAnimations.mobile
  if (width < 1024) return responsiveAnimations.tablet
  return responsiveAnimations.desktop
}
