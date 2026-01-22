import { create } from 'zustand'
import toast from 'react-hot-toast'
import { timetableApi, ApiError } from '@/lib/api/client'

// Types
export interface TimetableEntry {
  id: string
  time: string
  title: string
  location: string
  courseCode?: string
}

export interface TodayClass {
  id: string
  code: string
  title?: string
  program: string
  time: string
  status: string
  borderColor: string
  badgeBg: string
  badgeText: string
  dot: string
}

export interface NextClass {
  code: string
  venue: string
  time: string
}

export interface CreateEntryData {
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  location: string
  notes?: string
}

interface TimetableState {
  timetable: Record<string, TimetableEntry[]>
  hasTimetable: boolean
  isCourseRep: boolean
  timetableId?: string
  todaySchedule: TodayClass[]
  nextClass: NextClass | null
  loading: boolean
  todayLoading: boolean
  error: string | null
}

interface TimetableActions {
  fetchTimetable: () => Promise<void>
  fetchTodaySchedule: () => Promise<void>
  addEntry: (data: CreateEntryData) => Promise<void>
  updateEntry: (id: string, data: Partial<CreateEntryData>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  saveTimetable: (timetableData: Record<string, Array<{ time: string; course_code: string; venue: string }>>) => Promise<void>
  reset: () => void
}

const initialState: TimetableState = {
  timetable: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  },
  hasTimetable: false,
  isCourseRep: false,
  timetableId: undefined,
  todaySchedule: [],
  nextClass: null,
  loading: false,
  todayLoading: false,
  error: null,
}

export const useTimetableStore = create<TimetableState & TimetableActions>()((set, get) => ({
  ...initialState,

  // Fetch timetable
  fetchTimetable: async () => {
    set({ loading: true, error: null })
    
    try {
      const result = await timetableApi.get()
      
      set({
        timetable: (result.timetable || initialState.timetable) as Record<string, TimetableEntry[]>,
        hasTimetable: result.hasTimetable || false,
        isCourseRep: result.isCourseRep || false,
        timetableId: result.timetableId,
        loading: false,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch timetable'
      set({ error: message, loading: false })
      console.error('Fetch timetable error:', error)
    }
  },

  // Fetch today's schedule
  fetchTodaySchedule: async () => {
    set({ todayLoading: true })
    
    try {
      const result = await timetableApi.getToday()
      
      set({
        todaySchedule: (result.schedule || []) as TodayClass[],
        nextClass: (result.nextClass as NextClass) || null,
        todayLoading: false,
      })
    } catch (error) {
      console.error('Fetch today schedule error:', error)
      set({ todayLoading: false })
    }
  },

  // Add timetable entry
  addEntry: async (data: CreateEntryData) => {
    try {
      const result = await timetableApi.addEntry(data)
      toast.success(result.message || 'Class added to timetable!')
      
      // Refetch timetable to update the list
      await get().fetchTimetable()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to add class'
      toast.error(message)
      throw error
    }
  },

  // Update timetable entry
  updateEntry: async (id: string, data: Partial<CreateEntryData>) => {
    try {
      const result = await timetableApi.updateEntry(id, data)
      toast.success(result.message || 'Timetable updated!')
      
      // Refetch timetable to update the list
      await get().fetchTimetable()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update timetable'
      toast.error(message)
      throw error
    }
  },

  // Delete timetable entry
  deleteEntry: async (id: string) => {
    try {
      const result = await timetableApi.deleteEntry(id)
      toast.success(result.message || 'Class removed from timetable!')
      
      // Update local state
      set((state) => {
        const newTimetable = { ...state.timetable }
        for (const day of Object.keys(newTimetable)) {
          newTimetable[day] = newTimetable[day].filter(entry => entry.id !== id)
        }
        
        const hasTimetable = Object.values(newTimetable).some(entries => entries.length > 0)
        
        return { timetable: newTimetable, hasTimetable }
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete class'
      toast.error(message)
      throw error
    }
  },

  // Save entire timetable
  saveTimetable: async (timetableData: Record<string, Array<{ time: string; course_code: string; venue: string }>>) => {
    try {
      const result = await timetableApi.save(timetableData)
      toast.success(result.message || 'Timetable saved successfully!')
      
      // Refetch timetable to update the list
      await get().fetchTimetable()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save timetable'
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
export const useTimetable = () => useTimetableStore((state) => state.timetable)
export const useHasTimetable = () => useTimetableStore((state) => state.hasTimetable)
export const useTodaySchedule = () => useTimetableStore((state) => state.todaySchedule)
export const useNextClass = () => useTimetableStore((state) => state.nextClass)
export const useTimetableLoading = () => useTimetableStore((state) => state.loading)
