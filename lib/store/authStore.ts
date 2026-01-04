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
  roles?: string[]
  is_course_rep?: boolean
  invite_code?: string
  course_rep_id?: string
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
  registerCourseRep: (email: string, password: string, userData: Partial<UserProfile>) => Promise<string>
  registerWithInvite: (inviteCode: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithPhone: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
  getCourseRepByInviteCode: (inviteCode: string) => Promise<UserProfile | null>
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

        set({ 
          user: session.user, 
          profile: error ? null : profile, 
          loading: false, 
          initialized: true 
        })
      } else {
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true 
        })
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          set({ 
            user: session.user, 
            profile, 
            loading: false, 
            initialized: true 
          })
        } else if (event === 'SIGNED_OUT') {
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

  // Register as Course Rep
  registerCourseRep: async (email: string, password: string, userData: Partial<UserProfile>) => {
    set({ loading: true })
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create course rep profile with roles array
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
          roles: ['course_rep', 'student'],
        })
        .select()
        .single()

      if (profileError) throw profileError

      set({ user: authData.user, profile, loading: false, initialized: true })
      toast.success('Course Rep account created successfully!')
      
      // Return the invite code for displaying in popup
      return profile.invite_code
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Register user with invite code (no email required)
  registerWithInvite: async (inviteCode: string, password: string, userData: Partial<UserProfile>) => {
    set({ loading: true })
    
    try {
      // First, get the course rep info from invite code
      const { data: courseRepData, error: courseRepError } = await supabase
        .from('users')
        .select('id, school, department, level, semester')
        .eq('invite_code', inviteCode)
        .contains('roles', ['course_rep'])
        .single()

      if (courseRepError || !courseRepData) {
        throw new Error('Invalid invite code')
      }

      // Generate a unique email using phone number
      const uniqueEmail = `${userData.phone_number?.replace(/[^0-9]/g, '')}@qitt.app`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create user profile with course rep's school info
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: uniqueEmail,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school: courseRepData.school,
          department: courseRepData.department,
          level: courseRepData.level,
          semester: courseRepData.semester,
          roles: ['student'],
          course_rep_id: courseRepData.id,
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

  // Get course rep info by invite code (for displaying on join page)
  getCourseRepByInviteCode: async (inviteCode: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          school, 
          department, 
          level, 
          semester,
          schools!users_school_fkey(name),
          departments!users_department_fkey(name)
        `)
        .eq('invite_code', inviteCode)
        .contains('roles', ['course_rep'])
        .single()

      if (error || !data) return null
      return data as unknown as UserProfile
    } catch {
      return null
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

  // Login with phone number
  loginWithPhone: async (phone: string, password: string) => {
    set({ loading: true })
    
    try {
      // First find the user's email by phone number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('phone_number', phone)
        .single()

      if (userError || !userData) {
        throw new Error('No account found with this phone number')
      }

      // Then login with the email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
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
