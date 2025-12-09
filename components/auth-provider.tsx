'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, updateProfile } = useAuthStore()

  useEffect(() => {
    // Initialize auth state on mount
    initialize()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            updateProfile(profile)
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
  }, [initialize, updateProfile])

  return <>{children}</>
}
