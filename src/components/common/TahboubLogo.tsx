import React from 'react'

interface TahboubLogoProps {
  size?: number | string
  className?: string
  fallbackClassName?: string
}

export function TahboubLogo({ 
  size = 32, 
  className = '', 
  fallbackClassName = 'bg-dealership-black text-dealership-white px-2 py-1 rounded-sm text-sm font-bold'
}: TahboubLogoProps) {
  const sizeStyle = typeof size === 'number' ? { height: size, width: 'auto' } : { height: size, width: 'auto' }
  
  return (
    <div className="flex items-center">
      <img 
        src="https://tahboubgroup.org/wp-content/uploads/2023/04/TA@HomePage.png"
        alt="Tahboub Group"
        className={`object-contain ${className}`}
        style={sizeStyle}
        onError={(e) => {
          // Hide the image and show fallback
          e.currentTarget.style.display = 'none'
          const fallback = e.currentTarget.nextElementSibling as HTMLElement
          if (fallback) {
            fallback.classList.remove('hidden')
          }
        }}
      />
      <div className={`hidden ${fallbackClassName}`}>
        TA
      </div>
    </div>
  )
}