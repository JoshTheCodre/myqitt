import { supabase } from '@/lib/supabase/client'

export interface TodaysClass {
  id: string
  user_id: string
  date: string
  timetable_id?: string
  course_code: string
  course_title: string
  start_time: string
  end_time: string
  location: string
  is_cancelled: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface MergedClass {
  id: string
  timetable_id?: string
  course_code: string
  start_time: string
  end_time: string
  location: string
  day: string
  is_cancelled?: boolean
  notes?: string
  has_update: boolean
  todays_class_id?: string
  // Change indicators
  time_changed?: boolean
  location_changed?: boolean
  course_changed?: boolean
  original_location?: string
  original_start_time?: string
  original_end_time?: string
}

interface TimetableClass {
  time: string
  venue: string
  course: string
}

export class TodaysClassService {
  // Parse time range like "9am-11am" or "9:00am-11:00am"
  private static parseTimeRange(timeStr: string): { start: string; end: string } {
    const [start, end] = timeStr.split('-').map(t => t.trim())
    
    // Normalize time format (e.g., "9am" -> "9:00am", "11am" -> "11:00am")
    const normalizeTime = (time: string): string => {
      // If already has colon, return as is
      if (time.includes(':')) return time
      
      // Extract hour and am/pm
      const match = time.match(/(\d+)(am|pm)/i)
      if (match) {
        const hour = match[1]
        const period = match[2].toLowerCase()
        return `${hour}:00${period}`
      }
      return time
    }
    
    return { 
      start: normalizeTime(start), 
      end: normalizeTime(end) 
    }
  }

  // Generate consistent ID for timetable entries (used as timetable_id)
  private static generateTimetableId(userId: string, day: string, index: number): string {
    return `${userId}-${day}-${index}`
  }

  // Get today's classes for a user (with overrides applied)
  static async getTodaysClasses(userId: string, date?: string): Promise<MergedClass[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      // TESTING: Force today to be Monday
      const dayName = 'Monday' // new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' })

      // 1. Get timetable JSONB data
      const { data: timetableRow, error: timetableError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', userId)
        .maybeSingle()

      if (timetableError) {
        console.error('Timetable error:', timetableError)
      }

      // Extract classes for the specific day from JSONB
      const dayClasses: TimetableClass[] = timetableRow?.timetable_data?.[dayName] || []

      // 2. Get today's class overrides
      const { data: todaysData, error: todaysError } = await supabase
        .from('todays_classes')
        .select('*')
        .eq('user_id', userId)
        .eq('date', targetDate)

      if (todaysError) {
        console.error('Todays classes error:', todaysError)
      }

      // Create a map of updates by timetable_id
      const updatesMap = new Map<string, TodaysClass>()
      const standaloneUpdates: TodaysClass[] = []

      todaysData?.forEach(update => {
        if (update.timetable_id) {
          updatesMap.set(update.timetable_id, update)
        } else {
          standaloneUpdates.push(update)
        }
      })

      // 3. Convert timetable classes to MergedClass format and merge with updates
      const mergedClasses: MergedClass[] = dayClasses.map((cls: TimetableClass, index: number) => {
        const timetableId = this.generateTimetableId(userId, dayName, index)
        const { start, end } = this.parseTimeRange(cls.time)
        
        // Find any update for this class
        const update = updatesMap.get(timetableId)

        if (update) {
          // Check what changed
          const timeChanged = update.start_time !== start || update.end_time !== end
          const locationChanged = update.location !== cls.venue
          const courseChanged = update.course_code !== cls.course

          return {
            id: timetableId,
            timetable_id: timetableId,
            course_code: update.course_code,
            start_time: update.start_time,
            end_time: update.end_time,
            location: update.location,
            day: dayName,
            is_cancelled: update.is_cancelled,
            notes: update.notes,
            has_update: true,
            todays_class_id: update.id,
            time_changed: timeChanged,
            location_changed: locationChanged,
            course_changed: courseChanged,
            original_location: cls.venue,
            original_start_time: start,
            original_end_time: end
          }
        }

        // No update, return timetable class
        return {
          id: timetableId,
          timetable_id: timetableId,
          course_code: cls.course,
          start_time: start,
          end_time: end,
          location: cls.venue,
          day: dayName,
          has_update: false
        }
      })

      // Add standalone updates (classes not in regular timetable)
      standaloneUpdates.forEach(update => {
        mergedClasses.push({
          id: update.id,
          course_code: update.course_code,
          start_time: update.start_time,
          end_time: update.end_time,
          location: update.location,
          day: dayName,
          is_cancelled: update.is_cancelled,
          notes: update.notes,
          has_update: true,
          todays_class_id: update.id
        })
      })

      // Sort by start time
      mergedClasses.sort((a, b) => a.start_time.localeCompare(b.start_time))

      return mergedClasses
    } catch (error: any) {
      console.error('Error getting today\'s classes:', error)
      return []
    }
  }

  // Get today's classes for a connected user
  static async getConnectedUserTodaysClasses(connectedUserId: string, date?: string): Promise<MergedClass[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      // TESTING: Force today to be Monday
      const dayName = 'Monday' // new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' })

      // Get connected user's timetable JSONB data
      const { data: timetableRow, error: timetableError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', connectedUserId)
        .maybeSingle()

      if (timetableError) {
        console.error('Connected user timetable error:', timetableError)
      }

      // Extract classes for the specific day
      const dayClasses: TimetableClass[] = timetableRow?.timetable_data?.[dayName] || []

      // Get connected user's today's updates (RLS allows viewing connected user's updates)
      const { data: todaysData, error: todaysError } = await supabase
        .from('todays_classes')
        .select('*')
        .eq('user_id', connectedUserId)
        .eq('date', targetDate)

      if (todaysError) {
        console.error('Connected user todays classes error:', todaysError)
      }

      // Create a map of updates
      const updatesMap = new Map<string, TodaysClass>()
      const standaloneUpdates: TodaysClass[] = []

      todaysData?.forEach(update => {
        if (update.timetable_id) {
          updatesMap.set(update.timetable_id, update)
        } else {
          standaloneUpdates.push(update)
        }
      })

      // Convert and merge
      const mergedClasses: MergedClass[] = dayClasses.map((cls: TimetableClass, index: number) => {
        const timetableId = this.generateTimetableId(connectedUserId, dayName, index)
        const { start, end } = this.parseTimeRange(cls.time)
        
        const update = updatesMap.get(timetableId)

        if (update) {
          const timeChanged = update.start_time !== start || update.end_time !== end
          const locationChanged = update.location !== cls.venue
          const courseChanged = update.course_code !== cls.course

          return {
            id: timetableId,
            timetable_id: timetableId,
            course_code: update.course_code,
            start_time: update.start_time,
            end_time: update.end_time,
            location: update.location,
            day: dayName,
            is_cancelled: update.is_cancelled,
            notes: update.notes,
            has_update: true,
            todays_class_id: update.id,
            time_changed: timeChanged,
            location_changed: locationChanged,
            course_changed: courseChanged,
            original_location: cls.venue,
            original_start_time: start,
            original_end_time: end
          }
        }

        return {
          id: timetableId,
          timetable_id: timetableId,
          course_code: cls.course,
          start_time: start,
          end_time: end,
          location: cls.venue,
          day: dayName,
          has_update: false
        }
      })

      // Add standalone updates
      standaloneUpdates.forEach(update => {
        mergedClasses.push({
          id: update.id,
          course_code: update.course_code,
          start_time: update.start_time,
          end_time: update.end_time,
          location: update.location,
          day: dayName,
          is_cancelled: update.is_cancelled,
          notes: update.notes,
          has_update: true,
          todays_class_id: update.id
        })
      })

      // Sort by start time
      mergedClasses.sort((a, b) => a.start_time.localeCompare(b.start_time))

      return mergedClasses
    } catch (error: any) {
      console.error('Error getting connected user\'s today\'s classes:', error)
      return []
    }
  }

  // Get a specific today's class update
  static async getTodaysClassUpdate(userId: string, timetableId: string, date?: string): Promise<TodaysClass | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('todays_classes')
        .select('*')
        .eq('user_id', userId)
        .eq('timetable_id', timetableId)
        .eq('date', targetDate)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting today\'s class update:', error)
      return null
    }
  }

  // Delete old updates (cleanup)
  static async cleanupOldUpdates(): Promise<void> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]

      const { error } = await supabase
        .from('todays_classes')
        .delete()
        .lt('date', cutoffDate)

      if (error) throw error
    } catch (error: any) {
      console.error('Error cleaning up old updates:', error)
    }
  }
}
