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

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  initialize: () => Promise<void>
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profile: UserProfile) => void
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({ user: session.user, profile, loading: false, initialized: true })
      } else {
        set({ user: null, profile: null, loading: false, initialized: true })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, profile: null, loading: false, initialized: true })
    }
  },

  // Register new user
  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school: userData.school,
          department: userData.department,
          level: userData.level,
          semester: userData.semester,
          bio: userData.bio,
        })

      if (profileError) throw profileError

      const profile: UserProfile = {
        id: authData.user.id,
        email,
        name: userData.name || '',
        phone_number: userData.phone_number,
        school: userData.school,
        department: userData.department,
        level: userData.level,
        semester: userData.semester,
      }

      set({ user: authData.user, profile })
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      // Fetch profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      set({ user: authData.user, profile })
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // Logout user
  logout: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null })
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Logout failed')
      throw error
    }
  },

  // Update profile in state
  updateProfile: (profile: UserProfile) => {
    set({ profile })
  },
}))
