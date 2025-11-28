import { create } from 'zustand'
import type { Course, CourseFilters, GroupedCourses } from '@/lib/types/course'
import { CourseService } from '@/lib/services/courseService'

interface CourseState {
  // State
  courses: Course[]
  groupedCourses: GroupedCourses | null
  userCourses: GroupedCourses | null
  searchResults: Course[]
  selectedCourses: string[]
  loading: boolean
  error: string | null
  
  // Filters
  filters: CourseFilters
  searchTerm: string

  // Actions
  fetchCourses: (filters?: CourseFilters) => Promise<void>
  fetchGroupedCourses: (filters?: CourseFilters) => Promise<void>
  fetchUserCourses: (userId: string) => Promise<void>
  searchCourses: (searchTerm: string, filters?: CourseFilters) => Promise<void>
  setFilters: (filters: CourseFilters) => void
  setSearchTerm: (term: string) => void
  toggleCourseSelection: (courseId: string) => void
  clearSelection: () => void
  reset: () => void
}

const initialState = {
  courses: [],
  groupedCourses: null,
  userCourses: null,
  searchResults: [],
  selectedCourses: [],
  loading: false,
  error: null,
  filters: {},
  searchTerm: '',
}

export const useCourseStore = create<CourseState>((set, get) => ({
  ...initialState,

  fetchCourses: async (filters?: CourseFilters) => {
    set({ loading: true, error: null })
    try {
      const courses = await CourseService.getCourses(filters)
      set({ courses, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        loading: false 
      })
    }
  },

  fetchGroupedCourses: async (filters?: CourseFilters) => {
    set({ loading: true, error: null })
    try {
      const groupedCourses = await CourseService.getGroupedCourses(filters)
      set({ groupedCourses, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        loading: false 
      })
    }
  },

  fetchUserCourses: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const userCourses = await CourseService.getCoursesForUser(userId)
      set({ userCourses, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user courses',
        loading: false 
      })
    }
  },

  searchCourses: async (searchTerm: string, filters?: CourseFilters) => {
    if (!searchTerm.trim()) {
      set({ searchResults: [] })
      return
    }

    set({ loading: true, error: null })
    try {
      const searchResults = await CourseService.searchCourses(searchTerm, filters)
      set({ searchResults, searchTerm, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search courses',
        loading: false 
      })
    }
  },

  setFilters: (filters: CourseFilters) => {
    set({ filters })
    // Automatically refetch with new filters
    get().fetchGroupedCourses(filters)
  },

  setSearchTerm: (searchTerm: string) => {
    set({ searchTerm })
    // Debounce search
    const timeoutId = setTimeout(() => {
      get().searchCourses(searchTerm, get().filters)
    }, 300)
    return () => clearTimeout(timeoutId)
  },

  toggleCourseSelection: (courseId: string) => {
    set(state => ({
      selectedCourses: state.selectedCourses.includes(courseId)
        ? state.selectedCourses.filter(id => id !== courseId)
        : [...state.selectedCourses, courseId]
    }))
  },

  clearSelection: () => {
    set({ selectedCourses: [] })
  },

  reset: () => {
    set(initialState)
  }
}))

// Selectors for derived state
export const useCourseSelectors = () => {
  const store = useCourseStore()
  
  return {
    // Total courses count
    totalCoursesCount: store.courses.length,
    
    // User courses counts
    userCompulsoryCount: store.userCourses?.compulsory.length || 0,
    userElectiveCount: store.userCourses?.elective.length || 0,
    userTotalCount: (store.userCourses?.compulsory.length || 0) + (store.userCourses?.elective.length || 0),
    
    // Total credits
    totalCredits: store.courses.reduce((sum, c) => sum + c.credits, 0),
    userTotalCredits: [
      ...(store.userCourses?.compulsory || []),
      ...(store.userCourses?.elective || [])
    ].reduce((sum, c) => sum + c.credits, 0),
    
    // Selected courses info
    selectedCount: store.selectedCourses.length,
    selectedCoursesData: store.courses.filter(c => store.selectedCourses.includes(c.id)),
    selectedCredits: store.courses
      .filter(c => store.selectedCourses.includes(c.id))
      .reduce((sum, c) => sum + c.credits, 0),
    
    // Has data
    hasUserCourses: !!store.userCourses && 
      (store.userCourses.compulsory.length > 0 || store.userCourses.elective.length > 0),
    hasSearchResults: store.searchResults.length > 0,
    isSearching: store.searchTerm.length > 0,
  }
}
