'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // CRITICAL: Only redirect after hydration completes
    if (!hydrated) return

    const publicPaths = ['/', '/auth']
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(path + '/')
    )

    if (!user && !isPublicPath) {
      router.push('/')
    } else if (user && pathname === '/') {
      router.push('/dashboard')
    }
  }, [user, hydrated, pathname, router])

  // Render immediately (no loading screen, no blank screen)
  return <>{children}</>
}
