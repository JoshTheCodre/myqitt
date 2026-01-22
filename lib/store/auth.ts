import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { authApi, ApiError } from '@/lib/api/client'
import type { User } from '@supabase/supabase-js'

// New schema-aligned UserProfile interface
export interface UserProfile {
  id: string
  email: string
  name?: string
  phone_number?: string
  avatar_url?: string
  bio?: string
  school_id?: string
  class_group_id?: string
  current_session_id?: string
  current_semester_id?: string
  invite_code?: string
  created_at?: string
  updated_at?: string
}

// Extended profile with joined data for display
export interface UserProfileWithDetails extends UserProfile {
  school?: { id: string; name: string }
  class_group?: {
    id: string
    name?: string
    school_id: string
    department_id: string
    level_id: string
    department?: { id: string; name: string }
    level?: { id: string; level_number: number; name: string }
  }
  current_session?: { id: string; name: string }
  current_semester?: { id: string; name: string }
  course_rep_user?: { id: string; name: string }
  user_roles?: Array<{ role: { id: string; name: string } }>
}

// Registration data for student
export interface StudentRegistrationData {
  name: string
  email: string
  phone_number?: string
  school_id: string
  department_id: string
  level_number: number
  session_id?: string
  semester_id?: string
}

interface AuthState {
  user: User | null
  profile: UserProfileWithDetails | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  initialize: () => Promise<void>
  register: (email: string, password: string, name: string, userData: StudentRegistrationData) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithPhone: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
  isCourseRep: () => boolean
  hasRole: (roleName: string) => boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfileWithDetails | null) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      loading: true,
      initialized: false,

      // Setters for external updates
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),

      // Helper to check if user is course rep
      isCourseRep: () => {
        const { profile } = get()
        if (!profile?.user_roles) return false
        return profile.user_roles.some(ur => ur.role?.name === 'course_rep')
      },

      // Helper to check if user has a specific role
      hasRole: (roleName: string) => {
        const { profile } = get()
        if (!profile?.user_roles) return false
        return profile.user_roles.some(ur => ur.role?.name === roleName)
      },

      // Initialize auth state
      initialize: async () => {
        set({ loading: true, initialized: false })
        
        try {
          const result = await authApi.getSession()
          
          if (result && result.user) {
            set({ 
              user: result.user as User, 
              profile: result.profile as UserProfileWithDetails, 
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
        } catch (error) {
          console.error('Initialize error:', error)
          set({ 
            user: null, 
            profile: null, 
            loading: false, 
            initialized: true 
          })
        }
      },

      // Register new user
      register: async (email: string, password: string, name: string, userData: StudentRegistrationData) => {
        set({ loading: true })
        
        try {
          const result = await authApi.register({ email, password, name, phone_number: userData.phone_number, school_id: userData.school_id, department_id: userData.department_id, level_number: userData.level_number, session_id: userData.session_id, semester_id: userData.semester_id })
          
          set({ 
            user: result.user as User, 
            profile: result.profile as UserProfileWithDetails, 
            loading: false, 
            initialized: true 
          })
          
          toast.success('Account created successfully!')
          
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard'
          }
        } catch (error) {
          set({ loading: false })
          const message = error instanceof ApiError ? error.message : 'Registration failed'
          toast.error(message)
          throw error
        }
      },

      // Login with email
      login: async (email: string, password: string) => {
        set({ loading: true })
        
        try {
          const result = await authApi.login(email, password)
          
          set({ 
            user: result.user as User, 
            profile: result.profile as UserProfileWithDetails, 
            loading: false, 
            initialized: true 
          })
          
          toast.success('Login successful!')
          
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard'
          }
        } catch (error) {
          set({ loading: false })
          const message = error instanceof ApiError ? error.message : 'Login failed'
          toast.error(message)
          throw error
        }
      },

      // Login with phone
      loginWithPhone: async (phone: string, password: string) => {
        set({ loading: true })
        
        try {
          const result = await authApi.loginWithPhone(phone, password)
          
          set({ 
            user: result.user as User, 
            profile: result.profile as UserProfileWithDetails, 
            loading: false, 
            initialized: true 
          })
          
          toast.success('Login successful!')
          
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard'
          }
        } catch (error) {
          set({ loading: false })
          const message = error instanceof ApiError ? error.message : 'Login failed'
          toast.error(message)
          throw error
        }
      },

      // Logout
      logout: async () => {
        set({ loading: true })
        
        try {
          await authApi.logout()
          
          set({ 
            user: null, 
            profile: null, 
            loading: false, 
            initialized: true 
          })
          
          toast.success('Logged out successfully!')
          
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        } catch (error) {
          set({ loading: false })
          const message = error instanceof ApiError ? error.message : 'Logout failed'
          toast.error(message)
          throw error
        }
      },

      // Update profile (placeholder - needs profile API)
      updateProfile: async (profileData: Partial<UserProfile>) => {
        set({ loading: true })
        
        try {
          // TODO: Call profile API endpoint
          console.log('Update profile:', profileData)
          
          const { profile } = get()
          if (profile) {
            set({ 
              profile: { ...profile, ...profileData },
              loading: false 
            })
          }
          
          toast.success('Profile updated!')
        } catch (error) {
          set({ loading: false })
          const message = error instanceof ApiError ? error.message : 'Update failed'
          toast.error(message)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        profile: state.profile,
        initialized: state.initialized 
      }),
    }
  )
)

// Selectors
export const useUser = () => useAuthStore((state) => state.user)
export const useProfile = () => useAuthStore((state) => state.profile)
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user)
export const useIsCourseRep = () => useAuthStore((state) => state.isCourseRep())
export const useIsLoading = () => useAuthStore((state) => state.loading)
export const useIsInitialized = () => useAuthStore((state) => state.initialized)
