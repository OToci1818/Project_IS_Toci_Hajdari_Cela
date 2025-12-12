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
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[#1E293B]">
          {label}
          {required && <span className="text-[#EA4335] ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg border transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]
          ${error ? 'border-[#EA4335] bg-[#EA4335]/5' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          text-[#1E293B] placeholder:text-[#64748B]
        `}
      />
      {error && (
        <span className="text-sm text-[#EA4335]">{error}</span>
      )}
    </div>
  )
}
