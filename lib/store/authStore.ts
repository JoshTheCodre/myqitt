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
    set({ loading: true, initialized: false })
    
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Session check failed')
      }
      
      const data = await response.json()
      
      if (data.user && data.profile) {
        console.log('✅ User session found:', data.user.id)
        set({ 
          user: data.user, 
          profile: data.profile, 
          loading: false, 
          initialized: true 
        })
      } else {
        console.log('ℹ️ No active session')
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true 
        })
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error)
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
    console.log('🔐 Attempting login...')
    set({ loading: true })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      console.log('✅ Login successful')
      
      // Update state with user data
      set({ 
        user: data.user, 
        profile: data.profile, 
        loading: false, 
        initialized: true 
      })
      
      toast.success('Welcome back!')
      
      // Use a proper navigation approach
      await new Promise(resolve => setTimeout(resolve, 200))
      
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard')
      }
      
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      set({ loading: false })
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // Logout user
  logout: async () => {
    console.log('🚪 [AUTH STORE] Starting logout process...')
    set({ loading: true })
    
    try {
      // Clear state immediately to prevent race conditions
      set({ 
        user: null, 
        profile: null, 
        loading: true,
        initialized: false // Set to false to prevent auto re-initialization
      })
      
      console.log('🧹 [AUTH STORE] Cleared local auth state')
      
      // Call logout API
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Logout API failed')
      }
      
      console.log('✅ [AUTH STORE] Logout API successful')
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('schools_cache')
        localStorage.removeItem('schools_cache_timestamp')
        
        // Clear any other auth-related storage
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
        
        console.log('🧹 [AUTH STORE] Cleared local storage')
      }
      
      // Final state update
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        initialized: true 
      })
      
      toast.success('Logged out successfully')
      
      // Force a hard reload to ensure clean state
      console.log('🔄 [AUTH STORE] Performing hard redirect...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (typeof window !== 'undefined') {
        // Use location.href for a complete page reload that clears everything
        window.location.href = '/'
      }
      
    } catch (error: any) {
      console.error('❌ [AUTH STORE] Logout failed:', error)
      
      // Even if API fails, clear local state
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        initialized: true 
      })
      
      toast.error(error.message || 'Logout failed')
      
      // Force redirect even if API fails
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    }
  },

  // Update profile in state
  updateProfile: (profile: UserProfile) => {
    set({ profile })
  },
}))
