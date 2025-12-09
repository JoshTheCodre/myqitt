'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setHydrated, logout } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // 1. Hydrate session on mount
    const hydrateSession = async () => {
      try {
        // Get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setAuth(null, null)
            setHydrated(true)
          }
          return
        }

        if (!session?.user) {
          // No session found
          if (mounted) {
            setAuth(null, null)
            setHydrated(true)
          }
          return
        }

        // Fetch profile for authenticated user
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          // User exists but profile missing - still set user
          if (mounted) {
            setAuth(session.user, null)
            setHydrated(true)
          }
          return
        }

        // Successfully hydrated
        if (mounted) {
          setAuth(session.user, profile)
          setHydrated(true)
        }
      } catch (error) {
        console.error('Hydration error:', error)
        if (mounted) {
          setAuth(null, null)
          setHydrated(true)
        }
      }
    }

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_OUT') {
          logout()
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            // Fetch updated profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (mounted) {
              setAuth(session.user, profile)
            }
          }
        }
      }
    )

    // Start hydration
    hydrateSession()

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setAuth, setHydrated, logout])

  return <>{children}</>
}
