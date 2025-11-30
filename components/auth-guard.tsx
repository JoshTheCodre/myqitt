'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isChecking && !loading) {
      const publicPaths = ['/auth', '/']
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

      if (!user && !isPublicPath) {
        // Not logged in and trying to access protected page
        router.push('/auth')
      } else if (user && pathname === '/auth') {
        // Logged in but on auth page, redirect to dashboard
        router.push('/dashboard')
      }
    }
  }, [user, loading, isChecking, pathname, router])

  // Show loading state while checking auth
  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
