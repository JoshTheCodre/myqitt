import { create } from 'zustand'
import { api } from '@/utils/api-client'
import toast from 'react-hot-toast'

// ============ TYPES ============
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

// ============ HELPERS ============
export function formatDepartmentName(name: string): string {
  if (!name) return ''
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ============ LOCAL CACHE HELPERS ============
const ONE_HOUR = 60 * 60 * 1000

function getCached<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key)
    const timestamp = localStorage.getItem(`${key}_timestamp`)
    if (cached && timestamp && (Date.now() - parseInt(timestamp)) < ONE_HOUR) {
      return JSON.parse(cached) as T
    }
  } catch {}
  return null
}

function setCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    localStorage.setItem(`${key}_timestamp`, Date.now().toString())
  } catch {}
}

// ============ STATE ============
interface ProfileState {
  schools: School[]
  faculties: Faculty[]
  departments: Department[]
  levels: Level[]
  sessions: Session[]
  semesters: Semester[]
  loading: boolean

  // Actions
  fetchSchools: () => Promise<School[]>
  fetchFaculties: (schoolId: string) => Promise<Faculty[]>
  fetchDepartments: (facultyId: string) => Promise<Department[]>
  fetchDepartmentsBySchool: (schoolId: string) => Promise<Department[]>
  fetchLevels: (departmentId: string) => Promise<Level[]>
  fetchSessions: (schoolId: string) => Promise<Session[]>
  fetchSemesters: (schoolId: string) => Promise<Semester[]>
  getCourseRep: () => Promise<{ id: string; name: string; email?: string; phone_number?: string } | null>
  getInviteCode: () => Promise<string | null>
  getSchoolName: (schoolId: string) => Promise<string>
  updateProfile: (updates: { name?: string; phone_number?: string; bio?: string; avatar_url?: string }) => Promise<void>
  reset: () => void
}

const initialState = {
  schools: [],
  faculties: [],
  departments: [],
  levels: [],
  sessions: [],
  semesters: [],
  loading: false,
}

export const useProfileStore = create<ProfileState>((set) => ({
  ...initialState,

  fetchSchools: async () => {
    const cached = getCached<School[]>('schools_cache')
    if (cached) {
      set({ schools: cached })
      return cached
    }

    set({ loading: true })
    try {
      const schools = await api.get<School[]>('/api/profile?action=schools')
      setCache('schools_cache', schools)
      set({ schools, loading: false })
      return schools
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load schools')
      throw error
    }
  },

  fetchFaculties: async (schoolId: string) => {
    const cacheKey = `faculties_${schoolId}_cache`
    const cached = getCached<Faculty[]>(cacheKey)
    if (cached) {
      set({ faculties: cached })
      return cached
    }

    set({ loading: true })
    try {
      const faculties = await api.get<Faculty[]>(`/api/profile?action=faculties&schoolId=${schoolId}`)
      setCache(cacheKey, faculties)
      set({ faculties, loading: false })
      return faculties
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load faculties')
      throw error
    }
  },

  fetchDepartments: async (facultyId: string) => {
    const cacheKey = `departments_${facultyId}_cache`
    const cached = getCached<Department[]>(cacheKey)
    if (cached) {
      set({ departments: cached })
      return cached
    }

    set({ loading: true })
    try {
      const departments = await api.get<Department[]>(`/api/profile?action=departments&facultyId=${facultyId}`)
      setCache(cacheKey, departments)
      set({ departments, loading: false })
      return departments
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load departments')
      throw error
    }
  },

  fetchDepartmentsBySchool: async (schoolId: string) => {
    const cacheKey = `departments_school_${schoolId}_cache`
    const cached = getCached<Department[]>(cacheKey)
    if (cached) {
      set({ departments: cached })
      return cached
    }

    set({ loading: true })
    try {
      const departments = await api.get<Department[]>(`/api/profile?action=departments-by-school&schoolId=${schoolId}`)
      setCache(cacheKey, departments)
      set({ departments, loading: false })
      return departments
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load departments')
      throw error
    }
  },

  fetchLevels: async (departmentId: string) => {
    set({ loading: true })
    try {
      const levels = await api.get<Level[]>(`/api/profile?action=levels&departmentId=${departmentId}`)
      set({ levels, loading: false })
      return levels
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load levels')
      throw error
    }
  },

  fetchSessions: async (schoolId: string) => {
    set({ loading: true })
    try {
      const sessions = await api.get<Session[]>(`/api/profile?action=sessions&schoolId=${schoolId}`)
      set({ sessions, loading: false })
      return sessions
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load sessions')
      throw error
    }
  },

  fetchSemesters: async (schoolId: string) => {
    set({ loading: true })
    try {
      const semesters = await api.get<Semester[]>(`/api/profile?action=semesters&schoolId=${schoolId}`)
      set({ semesters, loading: false })
      return semesters
    } catch (error: any) {
      set({ loading: false })
      toast.error('Failed to load semesters')
      throw error
    }
  },

  getCourseRep: async () => {
    try {
      return await api.get<{ id: string; name: string; email?: string; phone_number?: string } | null>('/api/profile?action=course-rep')
    } catch {
      return null
    }
  },

  getInviteCode: async () => {
    try {
      return await api.get<string | null>('/api/profile?action=invite-code')
    } catch {
      return null
    }
  },

  getSchoolName: async (schoolId: string) => {
    try {
      return await api.get<string>(`/api/profile?action=school-name&schoolId=${schoolId}`)
    } catch {
      return 'Unknown School'
    }
  },

  updateProfile: async (updates) => {
    try {
      await api.patch('/api/profile', updates)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  },

  reset: () => set(initialState),
}))
