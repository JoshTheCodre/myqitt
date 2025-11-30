import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone_number?: string
  school?: string
  department?: string
  level?: number
  semester?: string
  bio?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface AuthStore {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initAuth: () => (() => void) | void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true, // Start with true to prevent flash of auth page

  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    set({ loading: true })
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const userId = authData.user.id

      // Create user profile in users table (works with or without email confirmation)
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school: userData.school,
          department: userData.department,
          level: userData.level,
          semester: userData.semester,
          bio: userData.bio,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw profileError
      }

      const profile: UserProfile = {
        id: userId,
        email,
        name: userData.name || '',
        phone_number: userData.phone_number,
        school: userData.school,
        department: userData.department,
        level: userData.level,
        semester: userData.semester,
      }

      set({ user: authData.user, profile, loading: false })
      toast.success('Account created successfully!')
    } catch (error) {
      set({ loading: false })
      const err = error as Error
      const msg = err?.message || 'Registration failed'
      toast.error(msg)
      throw error
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        set({ loading: false })
        // Better error message for unconfirmed email
        if (authError.message?.toLowerCase().includes('email not confirmed') || 
            authError.message?.toLowerCase().includes('email_not_confirmed')) {
          toast.error('Email not yet confirmed. Please check your inbox for a confirmation link, or wait a moment and try again.')
          throw new Error('Email not confirmed')
        }
        throw authError
      }

      if (!authData.user) throw new Error('Login failed')

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') throw profileError

      const profile = profileData as UserProfile

      set({ user: authData.user, profile: profile || null, loading: false })
      toast.success('Logged in successfully!')
    } catch (error) {
      set({ loading: false })
      const err = error as Error
      const msg = err?.message || 'Login failed'
      if (!msg.includes('Email not confirmed')) {
        toast.error(msg)
      }
      throw error
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ user: null, profile: null, loading: false })
      toast.success('Logged out successfully!')
    } catch (error) {
      set({ loading: false })
      const err = error as Error
      const msg = err?.message || 'Logout failed'
      toast.error(msg)
    }
  },

  initAuth: () => {
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData, error }) => {
            if (error && error.code !== 'PGRST116') {
              console.error('Profile fetch error:', error)
            }
            const profile = profileData as UserProfile
            set({ user: session.user, profile: profile || null, loading: false })
          })
      } else {
        set({ user: null, profile: null, loading: false })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (session?.user) {
          // Fetch user profile
          const { data: profileData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Profile fetch error:', error)
          }

          const profile = profileData as UserProfile
          set({ user: session.user, profile: profile || null, loading: false })
        } else {
          set({ user: null, profile: null, loading: false })
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        set({ loading: false })
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  },
}))
