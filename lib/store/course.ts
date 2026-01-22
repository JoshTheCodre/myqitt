import { create } from 'zustand'
import toast from 'react-hot-toast'
import { coursesApi, ApiError } from '@/lib/api/client'

// Types
export interface Course {
  id: string
  code: string
  title: string
  description?: string
  credit_unit: number
  is_compulsory: boolean
  outline?: string
}

export interface CourseItem {
  id: string
  courseCode: string
  courseTitle: string
  courseUnit: number
  category: 'COMPULSORY' | 'ELECTIVE'
  description?: string
  outline?: string
}

export interface GroupedCourses {
  compulsory: CourseItem[]
  elective: CourseItem[]
}

export interface CourseDetail {
  course: Course
  assignmentCount: number
  weeklySchedule: Array<{ day: string; time: string; location: string }>
  isCourseRep: boolean
}

export interface CreateCourseData {
  code: string
  title: string
  description?: string
  credit_unit?: number
  is_compulsory?: boolean
}

interface CourseState {
  courses: Course[]
  grouped: GroupedCourses
  totalCredits: number
  currentCourse: CourseDetail | null
  searchResults: CourseItem[]
  loading: boolean
  detailLoading: boolean
  searchLoading: boolean
  error: string | null
}

interface CourseActions {
  fetchCourses: () => Promise<void>
  fetchCourseDetail: (id: string) => Promise<void>
  searchCourses: (query: string) => Promise<void>
  createCourse: (data: CreateCourseData) => Promise<void>
  updateCourse: (id: string, data: Partial<CreateCourseData & { outline?: string }>) => Promise<void>
  deleteCourse: (id: string) => Promise<void>
  clearSearch: () => void
  reset: () => void
}

const initialState: CourseState = {
  courses: [],
  grouped: { compulsory: [], elective: [] },
  totalCredits: 0,
  currentCourse: null,
  searchResults: [],
  loading: false,
  detailLoading: false,
  searchLoading: false,
  error: null,
}

export const useCourseStore = create<CourseState & CourseActions>()((set, get) => ({
  ...initialState,

  // Fetch courses
  fetchCourses: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await coursesApi.getAll()
      
      set({
        courses: (result.courses || []) as Course[],
        grouped: (result.grouped || { compulsory: [], elective: [] }) as GroupedCourses,
        totalCredits: result.totalCredits || 0,
        loading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch courses'
      set({ error: message, loading: false })
      console.error('Fetch courses error:', error)
    }
  },

  // Fetch single course detail
  fetchCourseDetail: async (id: string) => {
    set({ detailLoading: true })
    
    try {
      const result = await coursesApi.getById(id)
      
      set({
        currentCourse: result as CourseDetail,
        detailLoading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch course details'
      console.error('Fetch course detail error:', error)
      set({ detailLoading: false })
      toast.error(message)
    }
  },

  // Search courses
  searchCourses: async (query: string) => {
    if (!query || query.length < 2) {
      set({ searchResults: [] })
      return
    }

    set({ searchLoading: true })
    
    try {
      const result = await coursesApi.search(query)
      
      set({
        searchResults: (result.courses || []) as CourseItem[],
        searchLoading: false,
      })
    } catch (error) {
      console.error('Search courses error:', error)
      set({ searchLoading: false })
    }
  },

  // Create course
  createCourse: async (data: CreateCourseData) => {
    try {
      await coursesApi.create(data)
      toast.success('Course created successfully!')
      
      // Refetch courses
      await get().fetchCourses()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create course'
      toast.error(message)
      throw error
    }
  },

  // Update course
  updateCourse: async (id: string, data: Partial<CreateCourseData & { outline?: string }>) => {
    try {
      await coursesApi.update(id, data)
      toast.success('Course updated successfully!')
      
      // Update current course if it's the one being edited
      const { currentCourse } = get()
      if (currentCourse?.course.id === id) {
        set({
          currentCourse: {
            ...currentCourse,
            course: { ...currentCourse.course, ...data }
          }
        })
      }
      
      // Refetch courses
      await get().fetchCourses()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update course'
      toast.error(message)
      throw error
    }
  },

  // Delete course
  deleteCourse: async (id: string) => {
    try {
      await coursesApi.delete(id)
      toast.success('Course deleted successfully!')
      
      // Update local state
      set((state) => ({
        courses: state.courses.filter(c => c.id !== id),
        grouped: {
          compulsory: state.grouped.compulsory.filter(c => c.id !== id),
          elective: state.grouped.elective.filter(c => c.id !== id)
        }
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete course'
      toast.error(message)
      throw error
    }
  },

  // Clear search results
  clearSearch: () => {
    set({ searchResults: [] })
  },

  // Reset store
  reset: () => {
    set(initialState)
  },
}))

// Selectors
export const useCourses = () => useCourseStore((state) => state.courses)
export const useGroupedCourses = () => useCourseStore((state) => state.grouped)
export const useTotalCredits = () => useCourseStore((state) => state.totalCredits)
export const useCurrentCourse = () => useCourseStore((state) => state.currentCourse)
export const useCourseLoading = () => useCourseStore((state) => state.loading)
