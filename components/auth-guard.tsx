'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

const PUBLIC_PATHS = ['/', '/auth']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  console.log('🛡️ AuthGuard state:', { initialized, loading, hasUser: !!user, pathname })

  useEffect(() => {
    if (!initialized) return

    const isPublicPath = PUBLIC_PATHS.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    )

    // Redirect to home if not authenticated and accessing protected route
    if (!user && !isPublicPath) {
      router.push('/')
    }

    // Redirect to dashboard if authenticated and on home page
    if (user && pathname === '/') {
      router.push('/dashboard')
    }
  }, [user, initialized, pathname, router])

  // Show loading state while initializing to prevent blank screen
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
