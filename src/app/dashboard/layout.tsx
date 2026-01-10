'use client'

import Sidebar from '@/components/Sidebar'
import { InviteProvider } from '@/contexts/InviteContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InviteProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="ml-64 p-8">
            <div className="container mx-auto">
              {children}
            </div>
          </main>
        </div>
      </NotificationProvider>
    </InviteProvider>
  )
}
