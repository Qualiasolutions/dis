import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  
  useGSAP(() => {
    if (!containerRef.current || !overlayRef.current) return
    
    // Page transition timeline
    const tl = gsap.timeline()
    
    // Overlay animation for smooth transition
    tl.fromTo(overlayRef.current,
      { 
        scaleX: 0,
        transformOrigin: "left center"
      },
      { 
        scaleX: 1,
        duration: 0.3,
        ease: "power2.in"
      }
    )
    .set(overlayRef.current, { transformOrigin: "right center" })
    .to(overlayRef.current, {
      scaleX: 0,
      duration: 0.3,
      ease: "power2.out"
    })
    
    // Content animation
    tl.fromTo(containerRef.current,
      { 
        opacity: 0,
        y: 20,
        scale: 0.98
      },
      { 
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out"
      },
      "-=0.3"
    )
    
    // Animate child elements with data-animate attribute
    const animatedElements = containerRef.current.querySelectorAll('[data-animate]')
    if (animatedElements.length > 0) {
      tl.fromTo(animatedElements,
        { 
          opacity: 0,
          y: 30
        },
        { 
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out"
        },
        "-=0.4"
      )
    }
    
  }, { dependencies: [location.pathname] })
  
  return (
    <div className="relative">
      {/* Page transition overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-gradient-to-r from-dealership-black to-dealership-very-dark z-50 pointer-events-none"
        style={{ transformOrigin: "left center" }}
      />
      
      {/* Page content */}
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </div>
  )
}
