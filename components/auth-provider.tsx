'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    console.log('🚀 AuthProvider mounted, calling initialize...')
    // Initialize auth state on mount
    initialize()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event)
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            useAuthStore.setState({ profile })
          }
        }

        if (event === 'SIGNED_OUT') {
          useAuthStore.setState({ user: null, profile: null })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
