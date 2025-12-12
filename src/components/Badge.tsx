interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-[#64748B]',
    success: 'bg-[#34A853]/10 text-[#34A853]',
    warning: 'bg-[#FBBC05]/10 text-[#946C00]',
    danger: 'bg-[#EA4335]/10 text-[#EA4335]',
    info: 'bg-[#1A73E8]/10 text-[#1A73E8]',
  }

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      ${variantStyles[variant]}
      ${className}
    `}>
      {children}
    </span>
  )
}
