'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-[#64748B]">Loading...</p>
      </div>
    </div>
  )
}
