import { create } from 'zustand'
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
    console.log('🔄 Initializing auth...')
    try {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
      })
      const data = await response.json()
      
      if (data.user && data.profile) {
        console.log('✅ User found:', data.user.id)
        set({ user: data.user, profile: data.profile, loading: false, initialized: true })
        console.log('✅ Auth initialized with user')
      } else {
        console.log('ℹ️ No session found')
        set({ user: null, profile: null, loading: false, initialized: true })
        console.log('✅ Auth initialized without user')
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error)
      set({ user: null, profile: null, loading: false, initialized: true })
    }
  },

  // Register new user
  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userData }),
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      set({ user: data.user, profile: data.profile })
      toast.success('Account created successfully!')
      
      // Trigger a router refresh to sync server state
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      set({ user: data.user, profile: data.profile })
      toast.success('Welcome back!')
      
      // Trigger a router refresh to sync server state
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // Logout user
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        cache: 'no-store',
      })
      set({ user: null, profile: null })
      toast.success('Logged out successfully')
      
      // Trigger a router refresh to sync server state
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
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
