'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'

/**
 * AuthProvider - Handles auth hydration ONCE on mount
 * 
 * GOLDEN RULES:
 * 1. Auth hydration runs once in this single Client Provider
 * 2. Supabase listeners only react to SIGNED_OUT event
 * 3. No server components touching Zustand
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const setLoading = useAuthStore((s) => s.setLoading)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated)
  const initCalled = useRef(false)

  useEffect(() => {
    // Only initialize ONCE
    if (initCalled.current) return
    initCalled.current = true
    
    let mounted = true

    setLoading()

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!mounted) return

        if (!data.session) {
          setUnauthenticated()
          return
        }

        const userId = data.session.user.id

        // Fetch profile with all related data
        const { data: profile, error } = await supabase
          .from('users')
          .select(`
            *,
            school:schools!users_school_id_fkey(id, name),
            class_group:class_groups!users_class_group_id_fkey(
              id, name, school_id, department_id, level_id,
              department:departments!class_groups_department_id_fkey(id, name),
              level:levels!class_groups_level_id_fkey(id, level_number, name)
            ),
            current_session:sessions!users_current_session_id_fkey(id, name),
            current_semester:semesters!users_current_semester_id_fkey(id, name),
            user_roles(role:roles(id, name))
          `)
          .eq('id', userId)
          .single()

        if (!mounted) return

        if (!error && profile) {
          setAuthenticated(data.session.user, profile)
        } else {
          setUnauthenticated()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setUnauthenticated()
        }
      }
    }

    init()

    // CRITICAL: Only react to SIGNED_OUT event
    // Do NOT react to SIGNED_IN here - that's handled by login/register actions
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUnauthenticated()
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [setLoading, setAuthenticated, setUnauthenticated])

  return <>{children}</>
}
