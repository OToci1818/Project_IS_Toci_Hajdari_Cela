interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-primary/10 text-primary border border-primary/20',
    outline: 'bg-transparent text-muted-foreground border border-input',
  }

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variantStyles[variant]}
      ${className}
    `}>
      {children}
    </span>
  )
}
