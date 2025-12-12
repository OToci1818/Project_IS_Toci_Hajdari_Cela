import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UniProject - University Project Management',
  description: 'University Project Management System for FTI students and professors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
