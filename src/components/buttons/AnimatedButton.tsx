import React, { useRef } from 'react'
import { Button, ButtonProps } from '@mantine/core'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { animationUtils } from '../../utils/animations'

interface AnimatedButtonProps extends ButtonProps {
  magneticEffect?: boolean
  rippleEffect?: boolean
}

export function AnimatedButton({ 
  magneticEffect = true, 
  rippleEffect = true,
  children, 
  onClick,
  ...props 
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  useGSAP(() => {
    if (!buttonRef.current) return
    
    const button = buttonRef.current
    let cleanup: (() => void) | undefined
    
    // Apply magnetic effect if enabled
    if (magneticEffect) {
      cleanup = animationUtils.magneticEffect(button, 0.2)
    }
    
    // Hover animations
    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      })
    }
    
    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
    
    const handleMouseDown = () => {
      gsap.to(button, {
        scale: 0.98,
        duration: 0.1,
        ease: "power2.out"
      })
    }
    
    const handleMouseUp = () => {
      gsap.to(button, {
        scale: 1.02,
        duration: 0.1,
        ease: "power2.out"
      })
    }
    
    button.addEventListener('mouseenter', handleMouseEnter)
    button.addEventListener('mouseleave', handleMouseLeave)
    button.addEventListener('mousedown', handleMouseDown)
    button.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter)
      button.removeEventListener('mouseleave', handleMouseLeave)
      button.removeEventListener('mousedown', handleMouseDown)
      button.removeEventListener('mouseup', handleMouseUp)
      if (cleanup) cleanup()
    }
  }, { scope: buttonRef })
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect if enabled
    if (rippleEffect && buttonRef.current) {
      animationUtils.createRipple(e as any, buttonRef.current)
    }
    
    // Call original onClick if provided
    if (onClick) {
      onClick(e)
    }
  }
  
  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      className="btn-professional transform-gpu"
      {...props}
    >
      {children}
    </Button>
  )
}
