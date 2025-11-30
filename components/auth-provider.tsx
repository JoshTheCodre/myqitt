'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state and listen for changes
    const unsubscribe = initAuth()
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [initAuth])

  return <>{children}</>
}
