import { create } from 'zustand'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
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
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  // Initialize auth state
  initialize: async () => {
    set({ loading: true, initialized: false })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('🔐 Auth initialized:', { 
          userId: session.user.id, 
          email: session.user.email,
          profileLoaded: !!profile,
          school: profile?.school,
          department: profile?.department,
          error: error?.message 
        })

        set({ 
          user: session.user, 
          profile: error ? null : profile, 
          loading: false, 
          initialized: true 
        })
      } else {
        console.log('🔐 No active session')
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true 
        })
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('🔐 Profile loaded on sign in:', { 
            userId: session.user.id,
            profileLoaded: !!profile,
            school: profile?.school,
            department: profile?.department
          })

          set({ 
            user: session.user, 
            profile, 
            loading: false, 
            initialized: true 
          })
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 User signed out')
          set({ 
            user: null, 
            profile: null, 
            loading: false, 
            initialized: true 
          })
        }
      })
      
    } catch (error) {
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        initialized: true 
      })
    }
  },

  // Register new user
  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    set({ loading: true })
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create profile
      const { data: profile, error: profileError } = await supabase
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
        .select()
        .single()

      if (profileError) throw profileError

      set({ user: authData.user, profile, loading: false, initialized: true })
      toast.success('Account created successfully!')
      
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      set({ 
        user: authData.user, 
        profile, 
        loading: false, 
        initialized: true 
      })
      
      toast.success('Welcome back!')
      
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
      
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // Logout user
  logout: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null, loading: false, initialized: true })
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/'
      }
      
      toast.success('Logged out successfully')
      
    } catch (error) {
      set({ user: null, profile: null, loading: false, initialized: true })
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  },

  // Update profile
  updateProfile: async (profileData: Partial<UserProfile>) => {
    const { user, profile } = get()
    if (!user || !profile) throw new Error('No authenticated user')

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      set({ profile: updatedProfile })
      toast.success('Profile updated successfully!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  },
}))
