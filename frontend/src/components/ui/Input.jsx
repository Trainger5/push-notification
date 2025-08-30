import React from 'react'

const Input = React.forwardRef(({ 
  label,
  error,
  className = '',
  ...props 
}, ref) => {
  const id = props.id || props.name
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`form-input ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  )
})

const Textarea = React.forwardRef(({ 
  label,
  error,
  className = '',
  rows = 3,
  ...props 
}, ref) => {
  const id = props.id || props.name
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`form-textarea ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  )
})

const Select = React.forwardRef(({ 
  label,
  error,
  options = [],
  placeholder = 'Select an option',
  className = '',
  children,
  ...props 
}, ref) => {
  const id = props.id || props.name
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`form-select ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
        {children}
      </select>
      {error && <div className="form-error">{error}</div>}
    </div>
  )
})

Input.displayName = 'Input'
Textarea.displayName = 'Textarea'  
Select.displayName = 'Select'

export { Input, Textarea, Select }