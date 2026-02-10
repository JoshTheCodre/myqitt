import { create } from 'zustand'
import { api } from '@/utils/api-client'
import toast from 'react-hot-toast'
import { supabase } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

// ============ AUTH STATUS TYPE ============
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

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

// Registration data for student (direct registration)
export interface StudentRegistrationData {
  name: string
  email?: string
  phone_number?: string
  school_id: string
  department_id: string
  level_number: number
  session_id?: string
  semester_id?: string
}

// ============ STATE INTERFACE ============
interface AuthState {
  user: User | null
  profile: UserProfileWithDetails | null
  status: AuthStatus
  showNotificationPrompt: boolean
  loading: boolean
  initialized: boolean
}

// ============ ACTIONS INTERFACE ============
interface AuthActions {
  setLoading: () => void
  setAuthenticated: (user: User, profile: UserProfileWithDetails) => void
  setUnauthenticated: () => void
  initialize: () => Promise<void>
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  registerStudent: (email: string, password: string, userData: StudentRegistrationData) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithPhone: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
  isCourseRep: () => boolean
  hasRole: (roleName: string) => boolean
  dismissNotificationPrompt: () => void
}

// Profile select query for registration flows (still uses supabase directly for auth)
const PROFILE_SELECT_QUERY = `
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
`

// ============ AUTH STORE ============
export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  profile: null,
  status: 'idle',
  showNotificationPrompt: false,
  loading: true,
  initialized: false,

  setLoading: () => set({ status: 'loading', loading: true, initialized: false }),

  setAuthenticated: (user, profile) => set({
    user, profile, status: 'authenticated', loading: false, initialized: true
  }),

  setUnauthenticated: () => set({
    user: null, profile: null, status: 'unauthenticated', loading: false, initialized: true
  }),

  isCourseRep: () => {
    const { profile } = get()
    if (!profile?.user_roles) return false
    return profile.user_roles.some(ur => ur.role?.name === 'course_rep')
  },

  hasRole: (roleName: string) => {
    const { profile } = get()
    if (!profile?.user_roles) return false
    return profile.user_roles.some(ur => ur.role?.name === roleName)
  },

  // ============ INITIALIZE - fetches profile from API ============
  initialize: async () => {
    const state = get()
    if (state.status !== 'idle') return

    set({ status: 'loading', loading: true })

    try {
      // We still need supabase for the session check (cookies-based auth)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        set({ user: null, profile: null, status: 'unauthenticated', loading: false, initialized: true })
        return
      }

      // Fetch profile from API route
      const result = await api.get<{ user: User; profile: UserProfileWithDetails }>('/api/auth/profile')

      set({
        user: session.user,
        profile: result.profile,
        status: 'authenticated',
        loading: false,
        initialized: true
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ user: null, profile: null, status: 'unauthenticated', loading: false, initialized: true })
    }
  },

  // ============ REFRESH PROFILE from API ============
  refreshProfile: async () => {
    try {
      const result = await api.get<{ user: User; profile: UserProfileWithDetails }>('/api/auth/profile')
      set({ profile: result.profile })
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  },

  // ============ REGISTER ============
  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    set({ status: 'loading', loading: true })

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, email,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school_id: userData.school_id,
          class_group_id: userData.class_group_id,
          current_session_id: userData.current_session_id,
          current_semester_id: userData.current_semester_id,
          bio: userData.bio,
        })
        .select()
        .single()

      if (profileError) throw profileError

      const { data: studentRole } = await supabase.from('roles').select('id').eq('name', 'student').single()
      if (studentRole) {
        await supabase.from('user_roles').insert({ user_id: authData.user.id, role_id: studentRole.id })
      }

      set({ user: authData.user, profile, status: 'authenticated', loading: false, initialized: true })
      toast.success('Account created successfully!')
      if (typeof window !== 'undefined') window.location.href = '/dashboard'
    } catch (error: any) {
      set({ status: 'unauthenticated', loading: false, initialized: true })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // ============ REGISTER STUDENT ============
  registerStudent: async (email: string, password: string, userData: StudentRegistrationData) => {
    set({ status: 'loading', loading: true })

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      let levelId: string | null = null
      const { data: existingLevel } = await supabase
        .from('levels').select('id')
        .eq('department_id', userData.department_id)
        .eq('level_number', userData.level_number).single()

      if (existingLevel) {
        levelId = existingLevel.id
      } else {
        const { data: newLevel, error: levelError } = await supabase
          .from('levels').insert({
            department_id: userData.department_id,
            level_number: userData.level_number,
            name: `${userData.level_number * 100} Level`
          }).select().single()
        if (levelError) throw levelError
        levelId = newLevel.id
      }

      let classGroupId: string | null = null
      const { data: existingCG } = await supabase
        .from('class_groups').select('id')
        .eq('school_id', userData.school_id)
        .eq('department_id', userData.department_id)
        .eq('level_id', levelId).single()

      if (existingCG) {
        classGroupId = existingCG.id
      } else {
        const { data: newCG, error: cgError } = await supabase
          .from('class_groups').insert({
            school_id: userData.school_id,
            department_id: userData.department_id,
            level_id: levelId,
            name: `${userData.level_number * 100} Level`
          }).select().single()
        if (cgError) throw cgError
        classGroupId = newCG.id
      }

      const { error: profileError } = await supabase
        .from('users').insert({
          id: authData.user.id, email,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school_id: userData.school_id,
          class_group_id: classGroupId,
          current_session_id: userData.session_id || null,
          current_semester_id: userData.semester_id || null,
        })
      if (profileError) throw profileError

      const { data: profile, error: fetchError } = await supabase
        .from('users').select(PROFILE_SELECT_QUERY).eq('id', authData.user.id).single()
      if (fetchError) throw fetchError

      const { data: studentRole } = await supabase.from('roles').select('id').eq('name', 'student').single()
      if (studentRole) {
        await supabase.from('user_roles').insert({ user_id: authData.user.id, role_id: studentRole.id })
      }

      set({
        user: authData.user, profile, status: 'authenticated',
        loading: false, initialized: true, showNotificationPrompt: true
      })
      toast.success('Account created successfully!')
    } catch (error: any) {
      set({ status: 'unauthenticated', loading: false, initialized: true })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // ============ LOGIN ============
  login: async (email: string, password: string) => {
    set({ status: 'loading', loading: true })

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      // Fetch profile via API
      const result = await api.get<{ user: User; profile: UserProfileWithDetails }>('/api/auth/profile')

      set({
        user: authData.user, profile: result.profile,
        status: 'authenticated', loading: false, initialized: true
      })
      toast.success('Welcome back!')
      if (typeof window !== 'undefined') window.location.href = '/dashboard'
    } catch (error: any) {
      set({ status: 'unauthenticated', loading: false, initialized: true })
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // ============ LOGIN WITH PHONE ============
  loginWithPhone: async (phone: string, password: string) => {
    set({ status: 'loading', loading: true })

    try {
      // Need direct supabase for phone->email lookup before auth
      const { data: userData, error: userError } = await supabase
        .from('users').select('email').eq('phone_number', phone).single()

      if (userError || !userData) throw new Error('No account found with this phone number')

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email, password
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      const result = await api.get<{ user: User; profile: UserProfileWithDetails }>('/api/auth/profile')

      set({
        user: authData.user, profile: result.profile,
        status: 'authenticated', loading: false, initialized: true
      })
      toast.success('Welcome back!')
      if (typeof window !== 'undefined') window.location.href = '/dashboard'
    } catch (error: any) {
      set({ status: 'unauthenticated', loading: false, initialized: true })
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // ============ LOGOUT ============
  logout: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null, status: 'unauthenticated', loading: false, initialized: true })
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/'
      }
      toast.success('Logged out successfully')
    } catch {
      set({ user: null, profile: null, status: 'unauthenticated', loading: false, initialized: true })
      if (typeof window !== 'undefined') window.location.href = '/'
    }
  },

  // ============ UPDATE PROFILE via API ============
  updateProfile: async (profileData: Partial<UserProfile>) => {
    const { user, profile } = get()
    if (!user || !profile) throw new Error('No authenticated user')

    try {
      const updatedProfile = await api.patch<UserProfileWithDetails>('/api/auth/profile', profileData)
      set({ profile: updatedProfile })
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  },

  dismissNotificationPrompt: () => set({ showNotificationPrompt: false }),
}))
