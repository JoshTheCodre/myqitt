'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // CRITICAL: Only redirect after hydration completes
    if (hydrated && !user) {
      router.push('/auth')
    }
  }, [hydrated, user, router])

  // If not hydrated yet, render children immediately (no blank screen)
  // If hydrated and no user, children will still render briefly before redirect
  // This prevents the flash of blank content
  return <>{children}</>
}

// HOC version for page-level protection
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
