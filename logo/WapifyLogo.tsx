import React from 'react'

interface WapifyLogoProps {
  className?: string
  size?: number
  withText?: boolean
  textClassName?: string
}

export const WapifyLogo: React.FC<WapifyLogoProps> = ({
  className = "w-6 h-6",
  size,
  withText = false,
  textClassName = "text-2xl font-bold text-wapify-text"
}) => {
  const iconSize = size ? { width: size, height: size } : undefined

  if (withText) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-wapify-accent to-wapify-accent-dark rounded-xl flex items-center justify-center shadow-lg text-white">
          <svg
            className={className}
            style={iconSize}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className={textClassName}>Wapify</span>
      </div>
    )
  }

  return (
    <svg
      className={className}
      style={iconSize}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  )
}

export default WapifyLogo
