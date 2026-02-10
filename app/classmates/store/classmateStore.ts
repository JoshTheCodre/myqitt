import { create } from 'zustand'
import { api } from '@/utils/api-client'
import toast from 'react-hot-toast'

// ============ TYPES ============
export interface Classmate {
  id: string
  name: string
  email: string
  avatar_url?: string
  phone_number?: string
  bio?: string
  isCourseRep: boolean
  isVerifiedCourseRep: boolean
  schoolName?: string
  departmentName?: string
  levelNumber?: number
}

// ============ STATE ============
interface ClassmateState {
  classmates: Classmate[]
  searchResults: Classmate[]
  courseRep: Classmate | null
  classmatesCount: number
  loading: boolean
  error: string | null

  // Actions
  fetchClassmates: () => Promise<void>
  fetchClassmatesCount: () => Promise<void>
  fetchCourseRep: () => Promise<void>
  searchClassmates: (term: string) => Promise<void>
  reset: () => void
}

const initialState = {
  classmates: [],
  searchResults: [],
  courseRep: null,
  classmatesCount: 0,
  loading: false,
  error: null,
}

export const useClassmateStore = create<ClassmateState>((set) => ({
  ...initialState,

  fetchClassmates: async () => {
    set({ loading: true, error: null })
    try {
      const classmates = await api.get<Classmate[]>('/api/classmates')
      set({ classmates, loading: false })
    } catch (error: any) {
      toast.error('Failed to load classmates')
      set({ error: error.message, loading: false })
    }
  },

  fetchClassmatesCount: async () => {
    try {
      const classmatesCount = await api.get<number>('/api/classmates?action=count')
      set({ classmatesCount })
    } catch {}
  },

  fetchCourseRep: async () => {
    try {
      const courseRep = await api.get<Classmate | null>('/api/classmates?action=course-rep')
      set({ courseRep })
    } catch {}
  },

  searchClassmates: async (term: string) => {
    try {
      const searchResults = await api.get<Classmate[]>(`/api/classmates?action=search&term=${encodeURIComponent(term)}`)
      set({ searchResults })
    } catch {}
  },

  reset: () => set(initialState),
}))
