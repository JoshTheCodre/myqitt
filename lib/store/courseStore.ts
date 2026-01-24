import { create } from 'zustand'
import { CourseService, type CourseItem, type GroupedCourses } from '@/lib/services/courseService'
import { CarryoverService, type CarryoverCourseItem, type CreateCarryoverData } from '@/lib/services/carryoverService'

interface CourseState {
  // State
  courses: CourseItem[]
  groupedCourses: GroupedCourses | null
  userCourses: GroupedCourses | null
  carryoverCourses: CarryoverCourseItem[]
  searchResults: CourseItem[]
  selectedCourses: string[]
  loading: boolean
  carryoverLoading: boolean
  error: string | null
  
  // Search term
  searchTerm: string

  // Actions
  fetchUserCourses: (userId: string) => Promise<void>
  fetchCarryoverCourses: (userId: string) => Promise<void>
  addCarryoverCourse: (userId: string, data: CreateCarryoverData) => Promise<CarryoverCourseItem | null>
  markCarryoverComplete: (courseId: string) => Promise<boolean>
  removeCarryoverCourse: (courseId: string) => Promise<boolean>
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

  fetchCarryoverCourses: async (userId: string) => {
    set({ carryoverLoading: true })
    try {
      const carryoverCourses = await CarryoverService.getCarryoverCourses(userId)
      set({ carryoverCourses, carryoverLoading: false })
    } catch (error) {
      console.error('Failed to fetch carryover courses:', error)
      set({ carryoverLoading: false })
    }
  },

  addCarryoverCourse: async (userId: string, data: CreateCarryoverData) => {
    try {
      const newCourse = await CarryoverService.addCarryoverCourse(userId, data)
      if (newCourse) {
        set(state => ({
          carryoverCourses: [...state.carryoverCourses, newCourse]
        }))
      }
      return newCourse
    } catch (error) {
      throw error
    }
  },

  markCarryoverComplete: async (courseId: string) => {
    const success = await CarryoverService.markAsCompleted(courseId)
    if (success) {
      set(state => ({
        carryoverCourses: state.carryoverCourses.filter(c => c.id !== courseId)
      }))
    }
    return success
  },

  removeCarryoverCourse: async (courseId: string) => {
    const success = await CarryoverService.deleteCarryoverCourse(courseId)
    if (success) {
      set(state => ({
        carryoverCourses: state.carryoverCourses.filter(c => c.id !== courseId)
      }))
    }
    return success
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
    
    // Carryover courses
    carryoverCount: store.carryoverCourses.length,
    carryoverCredits: store.carryoverCourses.reduce((sum, c) => sum + c.courseUnit, 0),
    
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
    hasCarryoverCourses: store.carryoverCourses.length > 0,
    hasSearchResults: store.searchResults.length > 0,
    isSearching: store.searchTerm.length > 0,
  }
}
