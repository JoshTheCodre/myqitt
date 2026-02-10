import { create } from 'zustand'
import { api } from '@/utils/api-client'

export interface CourseItem {
  courseCode: string
  courseTitle: string
  courseUnit: number
  category: 'COMPULSORY' | 'ELECTIVE'
}

export interface GroupedCourses {
  compulsory: CourseItem[]
  elective: CourseItem[]
}

export interface CarryoverCourseItem {
  id: string
  courseCode: string
  courseTitle: string
  courseUnit: number
  category: 'CARRYOVER'
  completed: boolean
  completedAt: string | null
}

export interface CreateCarryoverData {
  course_code: string
  course_title: string
  credit_unit: number
}

interface CourseState {
  courses: CourseItem[]
  groupedCourses: GroupedCourses | null
  userCourses: GroupedCourses | null
  carryoverCourses: CarryoverCourseItem[]
  searchResults: CourseItem[]
  selectedCourses: string[]
  loading: boolean
  carryoverLoading: boolean
  error: string | null
  searchTerm: string

  // Actions - all fetch from API
  fetchUserCourses: () => Promise<void>
  fetchCarryoverCourses: () => Promise<void>
  addCarryoverCourse: (data: CreateCarryoverData) => Promise<CarryoverCourseItem | null>
  markCarryoverComplete: (courseId: string) => Promise<boolean>
  removeCarryoverCourse: (courseId: string) => Promise<boolean>
  searchCourses: (searchTerm: string, departmentId: string) => Promise<void>
  getCourseIdByCode: (courseCode: string) => Promise<string | null>
  updateCourseOutline: (courseCode: string, outline: string) => Promise<{ success: boolean; error?: string; courseTitle?: string }>
  getAllCoursesForClassGroup: (classGroupId: string) => Promise<any[]>
  setSearchTerm: (term: string) => void
  toggleCourseSelection: (courseCode: string) => void
  clearSelection: () => void
  reset: () => void
}

const initialState = {
  courses: [],
  groupedCourses: null,
  userCourses: null,
  carryoverCourses: [],
  searchResults: [],
  selectedCourses: [],
  loading: false,
  carryoverLoading: false,
  error: null,
  searchTerm: '',
}

export const useCourseStore = create<CourseState>((set) => ({
  ...initialState,

  fetchUserCourses: async () => {
    set({ loading: true, error: null })
    try {
      const userCourses = await api.get<GroupedCourses>('/api/courses')
      set({ userCourses, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch user courses',
        loading: false
      })
    }
  },

  fetchCarryoverCourses: async () => {
    set({ carryoverLoading: true })
    try {
      const carryoverCourses = await api.get<CarryoverCourseItem[]>('/api/carryover')
      set({ carryoverCourses, carryoverLoading: false })
    } catch {
      set({ carryoverLoading: false })
    }
  },

  addCarryoverCourse: async (data: CreateCarryoverData) => {
    try {
      const newCourse = await api.post<CarryoverCourseItem>('/api/carryover', data)
      if (newCourse) {
        set(state => ({ carryoverCourses: [...state.carryoverCourses, newCourse] }))
      }
      return newCourse
    } catch (error) {
      throw error
    }
  },

  markCarryoverComplete: async (courseId: string) => {
    try {
      await api.patch('/api/carryover', { courseId })
      set(state => ({ carryoverCourses: state.carryoverCourses.filter(c => c.id !== courseId) }))
      return true
    } catch {
      return false
    }
  },

  removeCarryoverCourse: async (courseId: string) => {
    try {
      await api.delete(`/api/carryover?id=${courseId}`)
      set(state => ({ carryoverCourses: state.carryoverCourses.filter(c => c.id !== courseId) }))
      return true
    } catch {
      return false
    }
  },

  searchCourses: async (searchTerm: string, departmentId: string) => {
    if (!searchTerm.trim()) {
      set({ searchResults: [] })
      return
    }
    set({ loading: true, error: null })
    try {
      const searchResults = await api.get<CourseItem[]>(
        `/api/courses?action=search&term=${encodeURIComponent(searchTerm)}&departmentId=${departmentId}`
      )
      set({ searchResults, searchTerm, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search courses',
        loading: false
      })
    }
  },

  getCourseIdByCode: async (courseCode: string) => {
    try {
      return await api.get<string | null>(`/api/courses?action=by-code&code=${encodeURIComponent(courseCode)}`)
    } catch {
      return null
    }
  },

  updateCourseOutline: async (courseCode: string, outline: string) => {
    try {
      return await api.patch<{ success: boolean; error?: string; courseTitle?: string }>('/api/courses', { courseCode, outline })
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  getAllCoursesForClassGroup: async (classGroupId: string) => {
    try {
      return await api.get<any[]>(`/api/courses?action=all-for-class-group&classGroupId=${classGroupId}`)
    } catch {
      return []
    }
  },

  setSearchTerm: (searchTerm: string) => set({ searchTerm }),

  toggleCourseSelection: (courseCode: string) => {
    set(state => ({
      selectedCourses: state.selectedCourses.includes(courseCode)
        ? state.selectedCourses.filter(code => code !== courseCode)
        : [...state.selectedCourses, courseCode]
    }))
  },

  clearSelection: () => set({ selectedCourses: [] }),
  reset: () => set(initialState),
}))

// Selectors for derived state
export const useCourseSelectors = () => {
  const store = useCourseStore()

  return {
    totalCoursesCount: store.courses.length,
    userCompulsoryCount: store.userCourses?.compulsory.length || 0,
    userElectiveCount: store.userCourses?.elective.length || 0,
    userTotalCount: (store.userCourses?.compulsory.length || 0) + (store.userCourses?.elective.length || 0),
    carryoverCount: store.carryoverCourses.length,
    carryoverCredits: store.carryoverCourses.reduce((sum, c) => sum + c.courseUnit, 0),
    totalCredits: store.courses.reduce((sum, c) => sum + c.courseUnit, 0),
    userTotalCredits: [
      ...(store.userCourses?.compulsory || []),
      ...(store.userCourses?.elective || [])
    ].reduce((sum, c) => sum + c.courseUnit, 0),
    selectedCount: store.selectedCourses.length,
    selectedCoursesData: store.courses.filter(c => store.selectedCourses.includes(c.courseCode)),
    selectedCredits: store.courses
      .filter(c => store.selectedCourses.includes(c.courseCode))
      .reduce((sum, c) => sum + c.courseUnit, 0),
    hasUserCourses: !!store.userCourses &&
      (store.userCourses.compulsory.length > 0 || store.userCourses.elective.length > 0),
    hasCarryoverCourses: store.carryoverCourses.length > 0,
    hasSearchResults: store.searchResults.length > 0,
    isSearching: store.searchTerm.length > 0,
  }
}

// Static helper (no supabase, pure calculation)
export function calculateTotalCredits(courses: CourseItem[]): number {
  return courses.reduce((total, course) => total + course.courseUnit, 0)
}
