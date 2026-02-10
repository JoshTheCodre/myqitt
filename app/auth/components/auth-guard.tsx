'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/app/auth/store/authStore'

const PUBLIC_PATHS = ['/', '/auth', '/join']

/**
 * AuthGate - Client boundary that waits for auth status
 * 
 * GOLDEN RULES:
 * 1. Pages must wait for status === 'authenticated'
 * 2. NEVER fetch profile in pages - use auth store
 * 3. Auth guard only handles redirects based on status
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect until auth status is resolved
    if (status === 'idle' || status === 'loading') return

    const isPublicPath = PUBLIC_PATHS.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    )

    if (status === 'unauthenticated' && !isPublicPath) {
      router.replace('/')
    } else if (status === 'authenticated' && pathname === '/') {
      router.replace('/dashboard')
    }
  }, [status, user, pathname, router])

  // Show loading spinner while auth is resolving
  if (status === 'idle' || status === 'loading') {
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

// Export as both named and default for flexibility
export default AuthGate
