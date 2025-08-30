import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const Alert = ({ 
  type = 'info', 
  title,
  children, 
  className = '',
  showIcon = true,
  ...props 
}) => {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle
  }
  
  const typeClasses = {
    info: 'alert-info',
    success: 'alert-success', 
    warning: 'alert-warning',
    error: 'alert-error'
  }
  
  const Icon = icons[type]
  
  return (
    <div className={`alert ${typeClasses[type]} ${className}`} {...props}>
      <div className="flex">
        {showIcon && <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alert