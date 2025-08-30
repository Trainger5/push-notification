import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({ isOpen, onClose, children, size = 'md', className = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }
  
  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className={`modal-content animate-slide-up ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const ModalHeader = ({ children, onClose, className = '' }) => {
  return (
    <div className={`modal-header ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

const ModalBody = ({ children, className = '' }) => {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  )
}

const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  )
}

export { Modal, ModalHeader, ModalBody, ModalFooter }