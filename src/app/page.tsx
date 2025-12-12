'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { capitalize } from "../utils/stringHelpers";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);


  const message = capitalize("welcome to the homepage!");

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-[#64748B]">Loading...</p>
        <p className="mt-2 text-[#1A73E8] font-semibold">{message}</p>
      </div>
    </div>
  );
}

