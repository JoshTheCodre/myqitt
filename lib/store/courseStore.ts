import { create } from 'zustand'
import { CourseService, type CourseItem, type GroupedCourses } from '@/lib/services/courseService'

interface CourseState {
  // State
  courses: CourseItem[]
  groupedCourses: GroupedCourses | null
  userCourses: GroupedCourses | null
  searchResults: CourseItem[]
  selectedCourses: string[]
  loading: boolean
  error: string | null
  
  // Search term
  searchTerm: string

  // Actions
  fetchUserCourses: (userId: string) => Promise<void>
  searchCourses: (searchTerm: string, departmentId: string) => Promise<void>
  setSearchTerm: (term: string) => void
  toggleCourseSelection: (courseCode: string) => void
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
  searchTerm: '',
}

export const useCourseStore = create<CourseState>((set) => ({
  ...initialState,

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

  searchCourses: async (searchTerm: string, departmentId: string) => {
    if (!searchTerm.trim()) {
      set({ searchResults: [] })
      return
    }

    set({ loading: true, error: null })
    try {
      const searchResults = await CourseService.searchCourses(searchTerm, departmentId)
      set({ searchResults, searchTerm, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search courses',
        loading: false 
      })
    }
  },

  setSearchTerm: (searchTerm: string) => {
    set({ searchTerm })
  },

  toggleCourseSelection: (courseCode: string) => {
    set(state => ({
      selectedCourses: state.selectedCourses.includes(courseCode)
        ? state.selectedCourses.filter(code => code !== courseCode)
        : [...state.selectedCourses, courseCode]
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
    totalCredits: store.courses.reduce((sum, c) => sum + c.courseUnit, 0),
    userTotalCredits: [
      ...(store.userCourses?.compulsory || []),
      ...(store.userCourses?.elective || [])
    ].reduce((sum, c) => sum + c.courseUnit, 0),
    
    // Selected courses info
    selectedCount: store.selectedCourses.length,
    selectedCoursesData: store.courses.filter(c => store.selectedCourses.includes(c.courseCode)),
    selectedCredits: store.courses
      .filter(c => store.selectedCourses.includes(c.courseCode))
      .reduce((sum, c) => sum + c.courseUnit, 0),
    
    // Has data
    hasUserCourses: !!store.userCourses && 
      (store.userCourses.compulsory.length > 0 || store.userCourses.elective.length > 0),
    hasSearchResults: store.searchResults.length > 0,
    isSearching: store.searchTerm.length > 0,
  }
}
