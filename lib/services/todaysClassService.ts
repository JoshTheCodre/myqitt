import { supabase } from '@/lib/supabase/client'
import { TimetableService } from './timetableService'

export interface TodaysClass {
  id: string
  date: string
  class_group_id: string
  semester_id: string
  timetable_entry_id?: string
  course_id: string
  start_time: string
  end_time: string
  location: string
  is_cancelled: boolean
  notes?: string
  created_by: string
  created_at?: string
  updated_at?: string
  // Joined data
  course?: {
    id: string
    code: string
    title: string
  }
}

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
  // Change indicators
  time_changed?: boolean
  location_changed?: boolean
  course_changed?: boolean
  original_location?: string
  original_start_time?: string
  original_end_time?: string
}

export class TodaysClassService {
  // Format time from HH:MM:SS to display format
  private static formatTime(timeStr: string): string {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    let hour = parseInt(hours)
    const period = hour >= 12 ? 'pm' : 'am'
    if (hour > 12) hour -= 12
    if (hour === 0) hour = 12
    
    if (minutes && minutes !== '00') {
      return `${hour}:${minutes}${period}`
    }
    return `${hour}${period}`
  }

  // Parse time input to HH:MM:SS format
  private static parseTimeInput(timeStr: string): string {
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
      return timeStr.length === 5 ? `${timeStr}:00` : timeStr
    }
    
    const match = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)/i)
    if (match) {
      let hour = parseInt(match[1])
      const minutes = match[2] || '00'
      const period = match[3].toLowerCase()
      
      if (period === 'pm' && hour !== 12) hour += 12
      if (period === 'am' && hour === 12) hour = 0
      
      return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
    }
    
    return timeStr
  }

  // Get today's classes with any overrides applied
  static async getTodaysClasses(userId: string, date?: string): Promise<MergedClass[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const dayName = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' })

      // Get user's class group info
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        return []
      }

      // 1. Get timetable entries for this day
      const { timetable } = await TimetableService.getTimetable(userId)
      const dayClasses = timetable[dayName] || []

      // 2. Get today's class overrides for this class group
      const { data: todaysData, error: todaysError } = await supabase
        .from('todays_classes')
        .select(`
          *,
          course:courses!todays_classes_course_id_fkey(
            id,
            code,
            title
          )
        `)
        .eq('class_group_id', userInfo.class_group_id)
        .eq('date', targetDate)

      if (todaysError) {
        console.error('Todays classes error:', todaysError)
      }

      // Create a map of updates by timetable_entry_id
      const updatesMap = new Map<string, TodaysClass>()
      const standaloneUpdates: TodaysClass[] = []

      todaysData?.forEach(update => {
        if (update.timetable_entry_id) {
          updatesMap.set(update.timetable_entry_id, update)
        } else {
          standaloneUpdates.push(update)
        }
      })

      // 3. Merge timetable entries with any updates
      const mergedClasses: MergedClass[] = dayClasses.map((cls, index) => {
        const entryId = cls.id || `${dayName}-${index}`
        const update = cls.id ? updatesMap.get(cls.id) : undefined

        // Parse original times
        const timeParts = cls.time.split('-')
        const originalStartTime = timeParts[0] || ''
        const originalEndTime = timeParts[1] || ''

        if (update) {
          const updateStartTime = this.formatTime(update.start_time)
          const updateEndTime = this.formatTime(update.end_time)
          
          const timeChanged = 
            updateStartTime !== originalStartTime || 
            updateEndTime !== originalEndTime
          const locationChanged = update.location !== cls.location
          const courseChanged = (update.course as any)?.code !== cls.title

          return {
            id: entryId,
            timetable_entry_id: cls.id,
            course_code: (update.course as any)?.code || cls.title,
            course_title: (update.course as any)?.title,
            start_time: updateStartTime,
            end_time: updateEndTime,
            location: update.location,
            day: dayName,
            is_cancelled: update.is_cancelled,
            notes: update.notes,
            has_update: true,
            todays_class_id: update.id,
            time_changed: timeChanged,
            location_changed: locationChanged,
            course_changed: courseChanged,
            original_location: locationChanged ? cls.location : undefined,
            original_start_time: timeChanged ? originalStartTime : undefined,
            original_end_time: timeChanged ? originalEndTime : undefined
          }
        }

        return {
          id: entryId,
          timetable_entry_id: cls.id,
          course_code: cls.title,
          start_time: originalStartTime,
          end_time: originalEndTime,
          location: cls.location,
          day: dayName,
          has_update: false
        }
      })

      // 4. Add any standalone updates (new classes not in timetable)
      standaloneUpdates.forEach(update => {
        mergedClasses.push({
          id: update.id,
          course_code: (update.course as any)?.code || 'TBD',
          course_title: (update.course as any)?.title,
          start_time: this.formatTime(update.start_time),
          end_time: this.formatTime(update.end_time),
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
      console.error('Failed to fetch today\'s classes:', error)
      return []
    }
  }

  // Create or update today's class override (course rep only)
  static async createTodaysClassUpdate(
    userId: string,
    data: {
      date: string
      timetable_entry_id?: string
      course_id: string
      start_time: string
      end_time: string
      location: string
      is_cancelled?: boolean
      notes?: string
    }
  ): Promise<void> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can update classes')
      }

      if (!userInfo.semester_id) {
        throw new Error('Please set your current semester')
      }

      // Check if update already exists for this entry and date
      if (data.timetable_entry_id) {
        const { data: existing } = await supabase
          .from('todays_classes')
          .select('id')
          .eq('class_group_id', userInfo.class_group_id)
          .eq('date', data.date)
          .eq('timetable_entry_id', data.timetable_entry_id)
          .single()

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('todays_classes')
            .update({
              course_id: data.course_id,
              start_time: this.parseTimeInput(data.start_time),
              end_time: this.parseTimeInput(data.end_time),
              location: data.location,
              is_cancelled: data.is_cancelled || false,
              notes: data.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (error) throw error
          return
        }
      }

      // Create new entry
      const { error } = await supabase
        .from('todays_classes')
        .insert({
          date: data.date,
          class_group_id: userInfo.class_group_id,
          semester_id: userInfo.semester_id,
          timetable_entry_id: data.timetable_entry_id,
          course_id: data.course_id,
          start_time: this.parseTimeInput(data.start_time),
          end_time: this.parseTimeInput(data.end_time),
          location: data.location,
          is_cancelled: data.is_cancelled || false,
          notes: data.notes,
          created_by: userId
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Error creating today\'s class update:', error)
      throw error
    }
  }

  // Cancel a class for today (course rep only)
  static async cancelClass(
    userId: string,
    date: string,
    timetableEntryId: string,
    courseId: string,
    notes?: string
  ): Promise<void> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can cancel classes')
      }

      // Check if entry exists
      const { data: existing } = await supabase
        .from('todays_classes')
        .select('id')
        .eq('class_group_id', userInfo.class_group_id)
        .eq('date', date)
        .eq('timetable_entry_id', timetableEntryId)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('todays_classes')
          .update({
            is_cancelled: true,
            notes: notes || 'Class cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Need to get original class info to create cancel entry
        if (!userInfo.semester_id) {
          throw new Error('Please set your current semester')
        }

        const { error } = await supabase
          .from('todays_classes')
          .insert({
            date,
            class_group_id: userInfo.class_group_id,
            semester_id: userInfo.semester_id,
            timetable_entry_id: timetableEntryId,
            course_id: courseId,
            start_time: '00:00:00',
            end_time: '00:00:00',
            location: '',
            is_cancelled: true,
            notes: notes || 'Class cancelled',
            created_by: userId
          })

        if (error) throw error
      }
    } catch (error: any) {
      console.error('Error cancelling class:', error)
      throw error
    }
  }

  // Delete today's class override (restore to timetable default)
  static async deleteTodaysClassUpdate(userId: string, todaysClassId: string): Promise<void> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can delete class updates')
      }

      const { error } = await supabase
        .from('todays_classes')
        .delete()
        .eq('id', todaysClassId)
        .eq('class_group_id', userInfo.class_group_id)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting today\'s class update:', error)
      throw error
    }
  }
}
