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
  hydrated: boolean  // ✅ CRITICAL: Prevents redirects before session loads
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setAuth: (user: User | null, profile: UserProfile | null) => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  hydrated: false,  // ✅ Starts false, set true after first session check

  setAuth: (user, profile) => set({ user, profile }),
  setHydrated: (hydrated) => set({ hydrated }),

  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const userId = authData.user.id

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

      set({ user: authData.user, profile })
      toast.success('Account created successfully!')
    } catch (error) {
      const err = error as Error
      const msg = err?.message || 'Registration failed'
      toast.error(msg)
      throw error
    }
  },

  login: async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message?.toLowerCase().includes('email not confirmed') || 
            authError.message?.toLowerCase().includes('email_not_confirmed')) {
          toast.error('Email not yet confirmed. Please check your inbox for a confirmation link.')
          throw new Error('Email not confirmed')
        }
        throw authError
      }

      if (!authData.user) throw new Error('Login failed')

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') throw profileError

      const profile = profileData as UserProfile

      set({ user: authData.user, profile: profile || null })
      toast.success('Logged in successfully!')
    } catch (error) {
      const err = error as Error
      const msg = err?.message || 'Login failed'
      if (!msg.includes('Email not confirmed')) {
        toast.error(msg)
      }
      throw error
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      set({ user: null, profile: null })
      toast.success('Logged out successfully!')
    } catch (error) {
      const err = error as Error
      const msg = err?.message || 'Logout failed'
      toast.error(msg)
    }
  },
}))
