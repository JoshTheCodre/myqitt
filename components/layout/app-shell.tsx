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
    
    // Give auth time to initialize
    const timer = setTimeout(() => {
      setIsAuthChecking(false)
    }, 1000)
    
    return () => {
      clearTimeout(timer)
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

  // Show loading while auth is being checked
  if (isAuthChecking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
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
