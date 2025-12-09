'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

const PUBLIC_PATHS = ['/', '/auth']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

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

  // Show nothing while initializing
  if (!initialized) {
    return null
  }

  return <>{children}</>
}
