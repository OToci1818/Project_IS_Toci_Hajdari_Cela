'use client'

interface InputProps {
  label?: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  icon,
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-card-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-[0.625rem] border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-destructive bg-destructive/5' : 'border-input'}
            ${disabled ? 'bg-muted cursor-not-allowed' : 'bg-card'}
            text-card-foreground placeholder:text-muted-foreground
          `}
        />
      </div>
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  )
}
