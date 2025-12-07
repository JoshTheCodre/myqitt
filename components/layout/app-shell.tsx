'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, initAuth } = useAuthStore()
  const router = useRouter()
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  useEffect(() => {
    // Initialize auth listener
    const unsubscribe = initAuth()
    
    // Set auth checking to false immediately after init
    setIsAuthChecking(false)
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [initAuth])

  useEffect(() => {
    // Only redirect after auth has been checked
    if (!isAuthChecking && !user) {
      router.push('/')
    }
  }, [user, router, isAuthChecking])

  // Show content immediately if user exists
  if (!user && isAuthChecking) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop only) */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-1">
        {/* Content */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
    </div>
  )
}
