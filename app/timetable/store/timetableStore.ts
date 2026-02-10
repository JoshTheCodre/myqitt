import { create } from 'zustand'
import { api } from '@/utils/api-client'
import toast from 'react-hot-toast'

// ============ TYPES ============
export interface MergedClass {
  id: string
  timetable_entry_id?: string
  course_code: string
  course_title?: string
  start_time: string
  end_time: string
  location: string
  day: string
  is_cancelled?: boolean
  notes?: string
  has_update: boolean
  todays_class_id?: string
  time_changed?: boolean
  location_changed?: boolean
  course_changed?: boolean
  original_location?: string
  original_start_time?: string
  original_end_time?: string
}

export interface TodayScheduleItem {
  id: string
  code: string
  program: string
  time: string
  status: string
  borderColor: string
  badgeBg: string
  badgeText: string
  dot: string
}

export interface CreateTimetableEntryData {
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  location: string
  notes?: string
}

export interface UserClassGroupInfo {
  class_group_id: string
  semester_id?: string
  school_id?: string
  department_id?: string
  isCourseRep: boolean
}

// ============ STATE ============
interface TimetableState {
  timetable: Record<string, Array<{ time: string; title: string; location: string; id?: string; courseCode?: string }>>
  hasTimetable: boolean
  isCourseRep: boolean
  timetableId?: string
  lastUpdated?: string
  todaySchedule: TodayScheduleItem[]
  todaysClasses: MergedClass[]
  nextClass: { code: string; venue: string; time: string } | null
  userInfo: UserClassGroupInfo | null
  loading: boolean
  error: string | null

  // Actions
  fetchTimetable: (userId?: string) => Promise<void>
  fetchTodaySchedule: (userId?: string) => Promise<void>
  fetchTodaysClasses: (userId?: string, date?: string) => Promise<void>
  fetchNextClass: (userId?: string) => Promise<void>
  fetchUserInfo: (userId?: string) => Promise<void>
  addEntry: (data: CreateTimetableEntryData) => Promise<void>
  updateEntry: (entryId: string, data: Partial<CreateTimetableEntryData>) => Promise<void>
  deleteEntry: (entryId: string) => Promise<void>
  saveTimetable: (timetableData: Record<string, Array<{ time: string; course_code: string; venue: string }>>) => Promise<void>
  createTodaysClassUpdate: (data: any) => Promise<void>
  cancelClass: (date: string, timetableEntryId: string, courseId: string, notes?: string) => Promise<void>
  deleteTodaysClassUpdate: (todaysClassId: string) => Promise<void>
  reset: () => void
}

const emptyTimetable = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] }

const initialState = {
  timetable: emptyTimetable,
  hasTimetable: false,
  isCourseRep: false,
  timetableId: undefined,
  lastUpdated: undefined,
  todaySchedule: [],
  todaysClasses: [],
  nextClass: null,
  userInfo: null,
  loading: false,
  error: null,
}

export const useTimetableStore = create<TimetableState>((set) => ({
  ...initialState,

  fetchTimetable: async (userId?: string) => {
    set({ loading: true, error: null })
    try {
      const params = userId ? `?userId=${userId}` : ''
      const result = await api.get<{
        timetable: Record<string, any[]>
        hasTimetable: boolean
        isCourseRep: boolean
        timetableId?: string
        lastUpdated?: string
      }>(`/api/timetable${params}`)
      set({
        timetable: result.timetable,
        hasTimetable: result.hasTimetable,
        isCourseRep: result.isCourseRep,
        timetableId: result.timetableId,
        lastUpdated: result.lastUpdated,
        loading: false
      })
    } catch (error: any) {
      toast.error('Failed to load timetable')
      set({ error: error.message, loading: false })
    }
  },

  fetchTodaySchedule: async (userId?: string) => {
    try {
      const params = userId ? `&userId=${userId}` : ''
      const todaySchedule = await api.get<TodayScheduleItem[]>(`/api/timetable?action=today-schedule${params}`)
      set({ todaySchedule })
    } catch {}
  },

  fetchTodaysClasses: async (userId?: string, date?: string) => {
    try {
      let params = '?action=todays-classes'
      if (userId) params += `&userId=${userId}`
      if (date) params += `&date=${date}`
      const todaysClasses = await api.get<MergedClass[]>(`/api/timetable${params}`)
      set({ todaysClasses })
    } catch {}
  },

  fetchNextClass: async (userId?: string) => {
    try {
      const params = userId ? `&userId=${userId}` : ''
      const nextClass = await api.get<{ code: string; venue: string; time: string } | null>(`/api/timetable?action=next-class${params}`)
      set({ nextClass })
    } catch {}
  },

  fetchUserInfo: async (userId?: string) => {
    try {
      const params = userId ? `&userId=${userId}` : ''
      const userInfo = await api.get<UserClassGroupInfo | null>(`/api/timetable?action=user-info${params}`)
      set({ userInfo })
    } catch {}
  },

  addEntry: async (data: CreateTimetableEntryData) => {
    try {
      await api.post('/api/timetable', { action: 'add-entry', data })
      toast.success('Class added to timetable!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add class')
      throw error
    }
  },

  updateEntry: async (entryId: string, data: Partial<CreateTimetableEntryData>) => {
    try {
      await api.patch('/api/timetable', { entryId, data })
      toast.success('Timetable updated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update timetable')
      throw error
    }
  },

  deleteEntry: async (entryId: string) => {
    try {
      await api.delete(`/api/timetable?entryId=${entryId}`)
      toast.success('Class removed from timetable!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete entry')
      throw error
    }
  },

  saveTimetable: async (timetableData) => {
    try {
      await api.post('/api/timetable', { action: 'save-timetable', timetableData })
      toast.success('Timetable saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save timetable')
      throw error
    }
  },

  createTodaysClassUpdate: async (data: any) => {
    try {
      await api.post('/api/timetable', { action: 'update-todays-class', data })
    } catch (error: any) {
      throw error
    }
  },

  cancelClass: async (date: string, timetableEntryId: string, courseId: string, notes?: string) => {
    try {
      await api.post('/api/timetable', { action: 'cancel-class', date, timetableEntryId, courseId, notes })
    } catch (error: any) {
      throw error
    }
  },

  deleteTodaysClassUpdate: async (todaysClassId: string) => {
    try {
      await api.delete(`/api/timetable?todaysClassId=${todaysClassId}`)
    } catch (error: any) {
      throw error
    }
  },

  reset: () => set(initialState),
}))
