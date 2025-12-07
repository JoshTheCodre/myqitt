'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

// ✅ FIXED: Simplified guard - no extra timers or delays
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ✅ FIXED: Only act after loading is complete
    if (!loading) {
      const publicPaths = ['/', '/auth']
      const isPublicPath = publicPaths.some(path => 
        pathname === path || pathname.startsWith(path + '/')
      )

      if (!user && !isPublicPath) {
        console.log('🔒 Redirecting to auth (no user)')
        router.push('/')
      } else if (user && pathname === '/') {
        console.log('✅ Redirecting to dashboard (user exists)')
        router.push('/dashboard')
      }
    }
  }, [user, loading, pathname, router])

  // ✅ FIXED: Show nothing while loading (no spinner flash)
  if (loading) {
    return null
  }

  return <>{children}</>
}
