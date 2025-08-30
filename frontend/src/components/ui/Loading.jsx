import React from 'react'

const Loading = ({ size = 'md', className = '', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && (
        <p className="text-gray-600 text-sm mt-3 animate-pulse-soft">
          {text}
        </p>
      )}
    </div>
  )
}

export default Loading