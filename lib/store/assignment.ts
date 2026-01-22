import { create } from 'zustand'
import toast from 'react-hot-toast'
import { assignmentsApi, ApiError } from '@/lib/api/client'

// Types
export interface Assignment {
  id: string
  class_group_id: string
  semester_id: string
  course_id: string
  title: string
  description: string
  due_at?: string
  attachment_urls?: string[]
  created_by: string
  created_at?: string
  updated_at?: string
  submitted?: boolean
  submitted_at?: string
  course?: {
    id: string
    code: string
    title: string
  }
}

export interface AssignmentDate {
  id: string
  date: string
  label: string
  title: string
  description: string
  submissionType?: string
  submitted?: boolean
  submitted_at?: string
}

export interface GroupedAssignment {
  courseCode: string
  courseTitle?: string
  assignmentCount: number
  submittedCount: number
  dates: AssignmentDate[]
}

export interface AssignmentStats {
  total: number
  submitted: number
  pending: number
  overdue: number
}

export interface NextAssignment {
  title: string
  courseCode: string
  dueDate: string
  daysLeft: number
}

export interface CreateAssignmentData {
  course_id: string
  title: string
  description?: string
  due_at?: string
  attachment_urls?: string[]
}

interface AssignmentState {
  assignments: Assignment[]
  grouped: GroupedAssignment[]
  stats: AssignmentStats | null
  nextAssignment: NextAssignment | null
  upcomingCount: number
  isCourseRep: boolean
  loading: boolean
  statsLoading: boolean
  error: string | null
}

interface AssignmentActions {
  fetchAssignments: () => Promise<void>
  fetchStats: () => Promise<void>
  createAssignment: (data: CreateAssignmentData) => Promise<void>
  updateAssignment: (id: string, data: Partial<CreateAssignmentData>) => Promise<void>
  deleteAssignment: (id: string) => Promise<void>
  toggleSubmission: (id: string, submitted: boolean) => Promise<void>
  reset: () => void
}

const initialState: AssignmentState = {
  assignments: [],
  grouped: [],
  stats: null,
  nextAssignment: null,
  upcomingCount: 0,
  isCourseRep: false,
  loading: false,
  statsLoading: false,
  error: null,
}

export const useAssignmentStore = create<AssignmentState & AssignmentActions>()((set, get) => ({
  ...initialState,

  // Fetch all assignments
  fetchAssignments: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await assignmentsApi.getAll()
      
      set({
        assignments: (result.assignments || []) as Assignment[],
        grouped: (result.grouped || []) as GroupedAssignment[],
        stats: (result.stats as AssignmentStats) || null,
        isCourseRep: result.isCourseRep || false,
        loading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch assignments'
      set({ error: message, loading: false })
      console.error('Fetch assignments error:', error)
    }
  },

  // Fetch just stats
  fetchStats: async () => {
    set({ statsLoading: true })
    
    try {
      const result = await assignmentsApi.getStats()
      
      set({
        stats: (result.stats as AssignmentStats) || null,
        nextAssignment: (result.nextAssignment as NextAssignment) || null,
        upcomingCount: result.upcomingCount || 0,
        statsLoading: false,
      })
    } catch (error) {
      console.error('Fetch stats error:', error)
      set({ statsLoading: false })
    }
  },

  // Create assignment
  createAssignment: async (data: CreateAssignmentData) => {
    try {
      await assignmentsApi.create(data)
      toast.success('Assignment created successfully!')
      
      // Refetch assignments to update the list
      await get().fetchAssignments()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create assignment'
      toast.error(message)
      throw error
    }
  },

  // Update assignment
  updateAssignment: async (id: string, data: Partial<CreateAssignmentData>) => {
    try {
      await assignmentsApi.update(id, data)
      toast.success('Assignment updated successfully!')
      
      // Refetch assignments to update the list
      await get().fetchAssignments()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update assignment'
      toast.error(message)
      throw error
    }
  },

  // Delete assignment
  deleteAssignment: async (id: string) => {
    try {
      await assignmentsApi.delete(id)
      toast.success('Assignment deleted successfully!')
      
      // Update local state
      set((state) => ({
        assignments: state.assignments.filter(a => a.id !== id),
        grouped: state.grouped.map(g => ({
          ...g,
          dates: g.dates.filter(d => d.id !== id),
          assignmentCount: g.dates.filter(d => d.id !== id).length,
          submittedCount: g.dates.filter(d => d.id !== id && d.submitted).length
        })).filter(g => g.dates.length > 0)
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete assignment'
      toast.error(message)
      throw error
    }
  },

  // Toggle submission status
  toggleSubmission: async (id: string, submitted: boolean) => {
    try {
      const result = await assignmentsApi.toggleSubmission(id, submitted)
      toast.success(result.message || (submitted ? 'Marked as submitted!' : 'Marked as not submitted'))
      
      // Update local state
      set((state) => {
        // Update assignments list
        const assignments = state.assignments.map(a => 
          a.id === id ? { ...a, submitted, submitted_at: submitted ? new Date().toISOString() : undefined } : a
        )
        
        // Update grouped assignments
        const grouped = state.grouped.map(g => ({
          ...g,
          dates: g.dates.map(d => 
            d.id === id ? { ...d, submitted, submitted_at: submitted ? new Date().toISOString() : undefined } : d
          ),
          submittedCount: g.dates.reduce((count, d) => 
            count + (d.id === id ? (submitted ? 1 : 0) : (d.submitted ? 1 : 0)), 0
          )
        }))
        
        // Update stats
        const stats = state.stats ? {
          ...state.stats,
          submitted: state.stats.submitted + (submitted ? 1 : -1),
          pending: state.stats.pending + (submitted ? -1 : 1),
        } : null
        
        return { assignments, grouped, stats }
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update submission status'
      toast.error(message)
      throw error
    }
  },

  // Reset store
  reset: () => {
    set(initialState)
  },
}))

// Selectors
export const useAssignments = () => useAssignmentStore((state) => state.assignments)
export const useGroupedAssignments = () => useAssignmentStore((state) => state.grouped)
export const useAssignmentStats = () => useAssignmentStore((state) => state.stats)
export const useNextAssignment = () => useAssignmentStore((state) => state.nextAssignment)
export const useAssignmentLoading = () => useAssignmentStore((state) => state.loading)
