import React from 'react'

const Badge = ({ 
  children, 
  variant = 'gray', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning', 
    error: 'badge-error',
    gray: 'badge-gray'
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  }
  
  return (
    <span 
      className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge