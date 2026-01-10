'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface InviteContextType {
  inviteCount: number
  setInviteCount: (count: number) => void
  decrementInviteCount: () => void
}

const InviteContext = createContext<InviteContextType | undefined>(undefined)

export function InviteProvider({ children }: { children: ReactNode }) {
  const [inviteCount, setInviteCount] = useState(0)

  const decrementInviteCount = useCallback(() => {
    setInviteCount((prev) => Math.max(0, prev - 1))
  }, [])

  return (
    <InviteContext.Provider value={{ inviteCount, setInviteCount, decrementInviteCount }}>
      {children}
    </InviteContext.Provider>
  )
}

export function useInvites() {
  const context = useContext(InviteContext)
  if (context === undefined) {
    throw new Error('useInvites must be used within an InviteProvider')
  }
  return context
}
