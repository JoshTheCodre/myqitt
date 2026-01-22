import { create } from 'zustand'
import toast from 'react-hot-toast'
import { classmatesApi, ApiError } from '@/lib/api/client'

// Types
export interface Classmate {
  id: string
  name: string
  email: string
  avatar_url?: string
  phone_number?: string
  bio?: string
  isCourseRep: boolean
  schoolName?: string
  departmentName?: string
  levelNumber?: number
}

interface ClassmateState {
  classmates: Classmate[]
  count: number
  courseRep: Classmate | null
  loading: boolean
  error: string | null
}

interface ClassmateActions {
  fetchClassmates: () => Promise<void>
  searchClassmates: (query: string) => Promise<void>
  getCourseRep: () => Promise<void>
  reset: () => void
}

const initialState: ClassmateState = {
  classmates: [],
  count: 0,
  courseRep: null,
  loading: false,
  error: null,
}

export const useClassmateStore = create<ClassmateState & ClassmateActions>()((set, get) => ({
  ...initialState,

  // Fetch all classmates
  fetchClassmates: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await classmatesApi.getAll()
      
      set({
        classmates: (result.classmates || []) as Classmate[],
        count: result.count || 0,
        courseRep: (result.courseRep as Classmate) || null,
        loading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch classmates'
      set({ error: message, loading: false })
      console.error('Fetch classmates error:', error)
    }
  },

  // Search classmates
  searchClassmates: async (query: string) => {
    if (!query || query.length < 2) {
      // Reset to full list
      await get().fetchClassmates()
      return
    }

    set({ loading: true, error: null })
    
    try {
      const result = await classmatesApi.search(query)
      
      set({
        classmates: (result.classmates || []) as Classmate[],
        count: result.count || 0,
        loading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to search classmates'
      set({ error: message, loading: false })
      console.error('Search classmates error:', error)
    }
  },

  // Get course rep specifically
  getCourseRep: async () => {
    try {
      const result = await classmatesApi.getCourseRep()
      set({ courseRep: (result.courseRep as Classmate) || null })
    } catch (error) {
      console.error('Get course rep error:', error)
    }
  },

  // Reset store
  reset: () => {
    set(initialState)
  },
}))

// Selectors
export const useClassmates = () => useClassmateStore((state) => state.classmates)
export const useClassmatesCount = () => useClassmateStore((state) => state.count)
export const useCourseRep = () => useClassmateStore((state) => state.courseRep)
export const useClassmatesLoading = () => useClassmateStore((state) => state.loading)
