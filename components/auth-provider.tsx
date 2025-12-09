'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    console.log('🚀 AuthProvider mounted, calling initialize...')
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
