'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'

// ✅ FIXED: Single point of auth initialization
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth)

  useEffect(() => {
    // ✅ Initialize auth ONCE on app mount
    const unsubscribe = initAuth()
    
    // ✅ Cleanup on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [initAuth])

  // ✅ FIXED: No loading UI here - let children handle it
  return <>{children}</>
}
