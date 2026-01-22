'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

const PUBLIC_PATHS = ['/', '/auth', '/join']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized, initialize } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const initCalled = useRef(false)

  // Initialize auth exactly once on mount
  useEffect(() => {
    if (!initCalled.current) {
      initCalled.current = true
      initialize()
    }
  }, [initialize])

  useEffect(() => {
    // Don't redirect until auth is fully initialized
    if (!initialized || loading) return

    const isPublicPath = PUBLIC_PATHS.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    )

    if (!user && !isPublicPath) {
      router.replace('/')
    } else if (user && pathname === '/') {
      router.replace('/dashboard')
    }
  }, [user, initialized, loading, pathname, router])

  // Show loading spinner until auth is initialized
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
