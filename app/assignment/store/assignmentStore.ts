import { create } from 'zustand'
import { api } from '@/utils/api-client'
import toast from 'react-hot-toast'

// ============ TYPES ============
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
  course?: { id: string; code: string; title: string }
}

export interface AssignmentStats {
  total: number
  submitted: number
  pending: number
  overdue: number
}

export interface CreateAssignmentData {
  course_id: string
  title: string
  description: string
  due_at?: string
  attachment_urls?: string[]
}

// ============ STATE ============
interface AssignmentState {
  assignments: GroupedAssignment[]
  assignmentsList: Assignment[]
  stats: AssignmentStats
  isCourseRep: boolean
  unreadCount: number
  unviewedIds: string[]
  upcomingCount: number
  nextAssignment: { title: string; courseCode: string; dueDate: string; daysLeft: number } | null
  loading: boolean
  error: string | null

  // Actions
  fetchAssignments: () => Promise<void>
  fetchAssignmentsList: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  fetchUnviewedIds: () => Promise<void>
  fetchUpcomingCount: () => Promise<void>
  fetchNextAssignment: () => Promise<void>
  createAssignment: (data: CreateAssignmentData) => Promise<void>
  updateAssignment: (assignmentId: string, data: Partial<CreateAssignmentData>) => Promise<void>
  deleteAssignment: (assignmentId: string) => Promise<void>
  toggleSubmission: (assignmentId: string, submitted: boolean) => Promise<void>
  markAsViewed: (assignmentId: string) => Promise<void>
  reset: () => void
}

const initialState = {
  assignments: [],
  assignmentsList: [],
  stats: { total: 0, submitted: 0, pending: 0, overdue: 0 },
  isCourseRep: false,
  unreadCount: 0,
  unviewedIds: [],
  upcomingCount: 0,
  nextAssignment: null,
  loading: false,
  error: null,
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  ...initialState,

  fetchAssignments: async () => {
    set({ loading: true, error: null })
    try {
      const result = await api.get<{ assignments: GroupedAssignment[]; isCourseRep: boolean }>('/api/assignments')
      set({ assignments: result.assignments, isCourseRep: result.isCourseRep, loading: false })
    } catch (error: any) {
      toast.error('Failed to load assignments')
      set({ error: error.message, loading: false })
    }
  },

  fetchAssignmentsList: async () => {
    try {
      const list = await api.get<Assignment[]>('/api/assignments?action=list')
      set({ assignmentsList: list })
    } catch {}
  },

  fetchStats: async () => {
    try {
      const stats = await api.get<AssignmentStats>('/api/assignments?action=stats')
      set({ stats })
    } catch {}
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await api.get<number>('/api/assignments?action=unread-count')
      set({ unreadCount })
    } catch {}
  },

  fetchUnviewedIds: async () => {
    try {
      const unviewedIds = await api.get<string[]>('/api/assignments?action=unviewed-ids')
      set({ unviewedIds })
    } catch {}
  },

  fetchUpcomingCount: async () => {
    try {
      const upcomingCount = await api.get<number>('/api/assignments?action=upcoming-count')
      set({ upcomingCount })
    } catch {}
  },

  fetchNextAssignment: async () => {
    try {
      const nextAssignment = await api.get<{ title: string; courseCode: string; dueDate: string; daysLeft: number } | null>('/api/assignments?action=next')
      set({ nextAssignment })
    } catch {}
  },

  createAssignment: async (data: CreateAssignmentData) => {
    try {
      await api.post('/api/assignments', data)
      toast.success('Assignment created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment')
      throw error
    }
  },

  updateAssignment: async (assignmentId: string, data: Partial<CreateAssignmentData>) => {
    try {
      await api.patch('/api/assignments', { assignmentId, data })
      toast.success('Assignment updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update assignment')
      throw error
    }
  },

  deleteAssignment: async (assignmentId: string) => {
    try {
      await api.delete(`/api/assignments?id=${assignmentId}`)
      toast.success('Assignment deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment')
      throw error
    }
  },

  toggleSubmission: async (assignmentId: string, submitted: boolean) => {
    try {
      await api.post('/api/assignments', { action: 'toggle-submission', assignmentId, submitted })
    } catch (error: any) {
      throw error
    }
  },

  markAsViewed: async (assignmentId: string) => {
    try {
      await api.post('/api/assignments', { action: 'mark-viewed', assignmentId })
    } catch {}
  },

  reset: () => set(initialState),
}))
