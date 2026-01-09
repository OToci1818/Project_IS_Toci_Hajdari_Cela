interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-card rounded-[0.625rem] shadow-card border border-border p-6
        ${hoverable ? 'card-hover cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
