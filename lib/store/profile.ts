import { create } from 'zustand'
import toast from 'react-hot-toast'
import { profileApi, ApiError } from '@/lib/api/client'

// Types
export interface School {
  id: string
  name: string
  logo_url?: string
}

export interface Faculty {
  id: string
  school_id: string
  name: string
  code?: string
}

export interface Department {
  id: string
  faculty_id: string
  name: string
  code?: string
}

export interface Level {
  id: string
  department_id: string
  level_number: number
  name: string
}

export interface Session {
  id: string
  school_id: string
  name: string
  is_active: boolean
}

export interface Semester {
  id: string
  school_id: string
  name: string
}

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
  school?: { id: string; name: string; logo_url?: string }
  class_group?: {
    id: string
    name?: string
    department?: { id: string; name: string }
    level?: { id: string; level_number: number; name: string }
  }
  current_session?: { id: string; name: string }
  current_semester?: { id: string; name: string }
  user_roles?: Array<{ role: { id: string; name: string } }>
  isCourseRep?: boolean
}

interface ProfileState {
  profile: UserProfile | null
  inviteCode: string | null
  schools: School[]
  faculties: Faculty[]
  departments: Department[]
  levels: Level[]
  sessions: Session[]
  semesters: Semester[]
  loading: boolean
  schoolsLoading: boolean
  facultiesLoading: boolean
  departmentsLoading: boolean
  levelsLoading: boolean
  sessionsLoading: boolean
  semestersLoading: boolean
  error: string | null
}

interface ProfileActions {
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  fetchSchools: () => Promise<void>
  fetchFaculties: (schoolId: string) => Promise<void>
  fetchDepartments: (facultyId?: string, schoolId?: string) => Promise<void>
  fetchLevels: (departmentId: string) => Promise<void>
  fetchSessions: (schoolId: string) => Promise<void>
  fetchSemesters: (schoolId: string) => Promise<void>
  reset: () => void
}

const initialState: ProfileState = {
  profile: null,
  inviteCode: null,
  schools: [],
  faculties: [],
  departments: [],
  levels: [],
  sessions: [],
  semesters: [],
  loading: false,
  schoolsLoading: false,
  facultiesLoading: false,
  departmentsLoading: false,
  levelsLoading: false,
  sessionsLoading: false,
  semestersLoading: false,
  error: null,
}

export const useProfileStore = create<ProfileState & ProfileActions>()((set, get) => ({
  ...initialState,

  // Fetch user profile
  fetchProfile: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await profileApi.get()
      
      set({
        profile: (result.profile as UserProfile) || null,
        inviteCode: result.inviteCode || null,
        loading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch profile'
      set({ error: message, loading: false })
      console.error('Fetch profile error:', error)
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<UserProfile>) => {
    try {
      await profileApi.update(data)
      toast.success('Profile updated successfully!')
      
      // Update local state
      const { profile } = get()
      if (profile) {
        set({ profile: { ...profile, ...data } })
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update profile'
      toast.error(message)
      throw error
    }
  },

  // Fetch schools
  fetchSchools: async () => {
    set({ schoolsLoading: true })
    
    try {
      const result = await profileApi.getSchools()
      set({ schools: result.schools || [], schoolsLoading: false })
    } catch (error) {
      console.error('Fetch schools error:', error)
      set({ schoolsLoading: false })
    }
  },

  // Fetch faculties
  fetchFaculties: async (schoolId: string) => {
    set({ facultiesLoading: true })
    
    try {
      const result = await profileApi.getFaculties(schoolId)
      set({ faculties: (result.faculties || []) as Faculty[], facultiesLoading: false })
    } catch (error) {
      console.error('Fetch faculties error:', error)
      set({ facultiesLoading: false })
    }
  },

  // Fetch departments
  fetchDepartments: async (facultyId?: string, schoolId?: string) => {
    set({ departmentsLoading: true })
    
    try {
      const result = await profileApi.getDepartments(facultyId, schoolId)
      set({ departments: (result.departments || []) as Department[], departmentsLoading: false })
    } catch (error) {
      console.error('Fetch departments error:', error)
      set({ departmentsLoading: false })
    }
  },

  // Fetch levels
  fetchLevels: async (departmentId: string) => {
    set({ levelsLoading: true })
    
    try {
      const result = await profileApi.getLevels(departmentId)
      set({ levels: (result.levels || []) as Level[], levelsLoading: false })
    } catch (error) {
      console.error('Fetch levels error:', error)
      set({ levelsLoading: false })
    }
  },

  // Fetch sessions
  fetchSessions: async (schoolId: string) => {
    set({ sessionsLoading: true })
    
    try {
      const result = await profileApi.getSessions(schoolId)
      set({ sessions: (result.sessions || []) as Session[], sessionsLoading: false })
    } catch (error) {
      console.error('Fetch sessions error:', error)
      set({ sessionsLoading: false })
    }
  },

  // Fetch semesters
  fetchSemesters: async (schoolId: string) => {
    set({ semestersLoading: true })
    
    try {
      const result = await profileApi.getSemesters(schoolId)
      set({ semesters: (result.semesters || []) as Semester[], semestersLoading: false })
    } catch (error) {
      console.error('Fetch semesters error:', error)
      set({ semestersLoading: false })
    }
  },

  // Reset store
  reset: () => {
    set(initialState)
  },
}))

// Selectors
export const useUserProfile = () => useProfileStore((state) => state.profile)
export const useInviteCode = () => useProfileStore((state) => state.inviteCode)
export const useSchools = () => useProfileStore((state) => state.schools)
export const useFaculties = () => useProfileStore((state) => state.faculties)
export const useDepartments = () => useProfileStore((state) => state.departments)
export const useLevels = () => useProfileStore((state) => state.levels)
export const useSessions = () => useProfileStore((state) => state.sessions)
export const useSemesters = () => useProfileStore((state) => state.semesters)
export const useProfileLoading = () => useProfileStore((state) => state.loading)
