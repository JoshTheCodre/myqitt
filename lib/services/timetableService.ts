import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// New schema-aligned interfaces
export interface TimetableEntry {
  id: string
  timetable_id: string
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  location: string
  notes?: string
  created_at?: string
  updated_at?: string
  // Joined course data
  course?: {
    id: string
    code: string
    title: string
  }
}

export interface Timetable {
  id: string
  class_group_id: string
  semester_id: string
  created_by: string
  created_at?: string
  updated_at?: string
  entries?: TimetableEntry[]
}

export interface CreateTimetableEntryData {
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  location: string
  notes?: string
}

export interface DaySchedule {
  day: string
  entries: Array<{
    id: string
    time: string
    title: string
    location: string
    courseCode?: string
    courseTitle?: string
    notes?: string
  }>
}

export interface UserClassGroupInfo {
  class_group_id: string
  semester_id?: string
  school_id?: string
  isCourseRep: boolean
}

export class TimetableService {
  // Get user's class group info
  static async getUserClassGroupInfo(userId: string): Promise<UserClassGroupInfo | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          class_group_id,
          current_semester_id,
          school_id,
          user_roles(role:roles(name))
        `)
        .eq('id', userId)
        .single()

      if (error || !data || !data.class_group_id) return null

      // Check if user has course_rep role - user_roles returns array of { role: { name } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userRoles = data.user_roles as any[] | null
      const isCourseRep = userRoles?.some(
        (ur) => ur?.role?.name === 'course_rep'
      ) || false

      return {
        class_group_id: data.class_group_id,
        semester_id: data.current_semester_id || undefined,
        school_id: data.school_id || undefined,
        isCourseRep
      }
    } catch (error) {
      console.error('Error getting user class group info:', error)
      return null
    }
  }

  // Get timetable for user's class group (using new timetables + timetable_entries structure)
  static async getTimetable(userId: string): Promise<{
    timetable: Record<string, Array<{ time: string; title: string; location: string; id?: string; courseCode?: string }>>,
    hasTimetable: boolean,
    isCourseRep: boolean,
    timetableId?: string
  }> {
    try {
      // Initialize grouped data
      const groupedData: Record<string, Array<{ time: string; title: string; location: string; id?: string; courseCode?: string }>> = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      }

      // Get user's class group info
      const userInfo = await this.getUserClassGroupInfo(userId)
      if (!userInfo) {
        return { timetable: groupedData, hasTimetable: false, isCourseRep: false }
      }

      // Fetch timetable with entries for user's class group
      let query = supabase
        .from('timetables')
        .select(`
          id,
          class_group_id,
          semester_id,
          entries:timetable_entries(
            id,
            day_of_week,
            start_time,
            end_time,
            location,
            notes,
            course:courses!timetable_entries_course_id_fkey(
              id,
              code,
              title
            )
          )
        `)
        .eq('class_group_id', userInfo.class_group_id)

      // If user has a semester set, filter by semester
      if (userInfo.semester_id) {
        query = query.eq('semester_id', userInfo.semester_id)
      }

      const { data: timetableRecord, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching timetable:', error)
      }

      let hasTimetable = false
      let timetableId: string | undefined

      if (timetableRecord && timetableRecord.entries) {
        timetableId = timetableRecord.id
        const entries = timetableRecord.entries as any[]
        
        entries.forEach(entry => {
          const day = entry.day_of_week as string
          if (day in groupedData) {
            // Format time display
            const startTime = this.formatTime(entry.start_time)
            const endTime = this.formatTime(entry.end_time)
            const timeDisplay = `${startTime}-${endTime}`
            
            const courseCode = entry.course?.code || 'TBD'
            
            groupedData[day].push({
              id: entry.id,
              time: timeDisplay,
              title: courseCode,
              location: entry.location || 'TBA',
              courseCode: entry.course?.code
            })
          }
        })
        
        hasTimetable = entries.length > 0
      }

      // Sort entries by start time for each day
      Object.keys(groupedData).forEach(day => {
        groupedData[day].sort((a, b) => {
          return a.time.localeCompare(b.time)
        })
      })

      return {
        timetable: groupedData,
        hasTimetable,
        isCourseRep: userInfo.isCourseRep,
        timetableId
      }
    } catch (error: any) {
      toast.error('Failed to load timetable')
      throw error
    }
  }

  // Format time from HH:MM:SS to display format (e.g., "9am")
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
    // If already in HH:MM:SS format, return as is
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
      return timeStr.length === 5 ? `${timeStr}:00` : timeStr
    }
    
    // Parse formats like "9am", "10:30am", "2pm"
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

  // Create or get timetable for class group
  static async getOrCreateTimetable(userId: string): Promise<string | null> {
    try {
      const userInfo = await this.getUserClassGroupInfo(userId)
      if (!userInfo || !userInfo.class_group_id) {
        throw new Error('User is not in a class group')
      }

      // Check if timetable exists
      let query = supabase
        .from('timetables')
        .select('id')
        .eq('class_group_id', userInfo.class_group_id)

      if (userInfo.semester_id) {
        query = query.eq('semester_id', userInfo.semester_id)
      }

      const { data: existing } = await query.maybeSingle()

      if (existing) {
        return existing.id
      }

      // Create new timetable
      if (!userInfo.semester_id) {
        throw new Error('Please set your current semester before creating a timetable')
      }

      const { data: newTimetable, error } = await supabase
        .from('timetables')
        .insert({
          class_group_id: userInfo.class_group_id,
          semester_id: userInfo.semester_id,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error
      return newTimetable.id
    } catch (error) {
      console.error('Error creating timetable:', error)
      return null
    }
  }

  // Add timetable entry (course rep only)
  static async addTimetableEntry(
    userId: string,
    data: CreateTimetableEntryData
  ): Promise<void> {
    try {
      const userInfo = await this.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can update the timetable')
      }

      // Get or create timetable
      const timetableId = await this.getOrCreateTimetable(userId)
      if (!timetableId) {
        throw new Error('Could not create timetable')
      }

      const { error } = await supabase
        .from('timetable_entries')
        .insert({
          timetable_id: timetableId,
          course_id: data.course_id,
          day_of_week: data.day_of_week,
          start_time: this.parseTimeInput(data.start_time),
          end_time: this.parseTimeInput(data.end_time),
          location: data.location,
          notes: data.notes
        })

      if (error) throw error
      toast.success('Class added to timetable!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add class')
      throw error
    }
  }

  // Update timetable entry (course rep only)
  static async updateTimetableEntry(
    userId: string,
    entryId: string,
    data: Partial<CreateTimetableEntryData>
  ): Promise<void> {
    try {
      const userInfo = await this.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can update the timetable')
      }

      const updates: Record<string, any> = {}
      if (data.course_id) updates.course_id = data.course_id
      if (data.day_of_week) updates.day_of_week = data.day_of_week
      if (data.start_time) updates.start_time = this.parseTimeInput(data.start_time)
      if (data.end_time) updates.end_time = this.parseTimeInput(data.end_time)
      if (data.location) updates.location = data.location
      if (data.notes !== undefined) updates.notes = data.notes

      const { error } = await supabase
        .from('timetable_entries')
        .update(updates)
        .eq('id', entryId)

      if (error) throw error
      toast.success('Timetable updated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update timetable')
      throw error
    }
  }

  // Delete timetable entry (course rep only)
  static async deleteTimetableEntry(userId: string, entryId: string): Promise<void> {
    try {
      const userInfo = await this.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can delete timetable entries')
      }

      const { error } = await supabase
        .from('timetable_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error
      toast.success('Class removed from timetable!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete entry')
      throw error
    }
  }

  // Get today's schedule for dashboard
  static async getTodaySchedule(userId: string): Promise<Array<{
    id: string
    code: string
    program: string
    time: string
    status: string
    borderColor: string
    badgeBg: string
    badgeText: string
    dot: string
  }>> {
    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const today = days[new Date().getDay()]

      // Check if today is a weekend (no classes)
      if (today === 'Sunday' || today === 'Saturday') {
        return []
      }

      const { timetable, hasTimetable } = await this.getTimetable(userId)
      
      if (!hasTimetable) {
        return []
      }

      const todaysClasses = timetable[today] || []

      if (todaysClasses.length === 0) {
        return []
      }

      const currentTime = new Date()
      const currentHour = currentTime.getHours()
      const currentMinute = currentTime.getMinutes()

      const formattedClasses = todaysClasses.map((item, index) => {
        const timeParts = item.time.split('-')
        const startTimeStr = timeParts[0]
        const endTimeStr = timeParts[1]
        
        const parseTimeDisplay = (timeStr: string) => {
          const match = timeStr.match(/(\d+)(?::(\d+))?(am|pm)/i)
          if (!match) return { hour: 0, minute: 0 }
          let hour = parseInt(match[1])
          const minute = match[2] ? parseInt(match[2]) : 0
          const period = match[3].toLowerCase()
          
          if (period === 'pm' && hour !== 12) hour += 12
          if (period === 'am' && hour === 12) hour = 0
          
          return { hour, minute }
        }

        const startTime = parseTimeDisplay(startTimeStr)
        const endTime = parseTimeDisplay(endTimeStr)

        // Determine status
        let status = 'Upcoming'
        let borderColor = 'border-l-blue-500'
        let badgeBg = 'bg-blue-50'
        let badgeText = 'text-blue-600'
        let dot = 'bg-blue-600'

        const currentTotalMinutes = currentHour * 60 + currentMinute
        const startTotalMinutes = startTime.hour * 60 + startTime.minute
        const endTotalMinutes = endTime.hour * 60 + endTime.minute

        if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
          status = 'Ongoing'
          borderColor = 'border-l-amber-400'
          badgeBg = 'bg-amber-50'
          badgeText = 'text-amber-400'
          dot = 'bg-amber-400'
        } else if (currentTotalMinutes >= endTotalMinutes) {
          status = 'Completed'
          borderColor = 'border-l-gray-400'
          badgeBg = 'bg-gray-50'
          badgeText = 'text-gray-600'
          dot = 'bg-gray-600'
        }

        return {
          id: item.id || `${today}-${index}`,
          code: item.title,
          program: item.location,
          time: item.time,
          status,
          borderColor,
          badgeBg,
          badgeText,
          dot
        }
      })

      return formattedClasses
    } catch (error: any) {
      console.error('Failed to fetch today\'s classes:', error)
      return []
    }
  }

  // Get next class
  static async getNextClass(userId: string): Promise<{
    code: string
    venue: string
    time: string
  } | null> {
    try {
      const todaySchedule = await this.getTodaySchedule(userId)
      const upcomingClass = todaySchedule.find(c => c.status === 'Upcoming')
      
      if (upcomingClass) {
        return {
          code: upcomingClass.code,
          venue: upcomingClass.program,
          time: upcomingClass.time
        }
      }
      
      return null
    } catch (error: any) {
      return null
    }
  }

  // Save entire timetable (for the add/update timetable page)
  // This replaces all entries for the class group's timetable
  static async saveTimetable(
    userId: string, 
    timetableData: Record<string, Array<{ time: string; course_code: string; venue: string }>>
  ): Promise<void> {
    try {
      const userInfo = await this.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can save the timetable')
      }

      // Get or create timetable record
      const timetableId = await this.getOrCreateTimetable(userId)
      if (!timetableId) {
        throw new Error('Could not create timetable')
      }

      // Delete existing entries for this timetable
      await supabase
        .from('timetable_entries')
        .delete()
        .eq('timetable_id', timetableId)

      // Prepare entries to insert
      const entries: Array<{
        timetable_id: string
        day_of_week: string
        start_time: string
        end_time: string
        location: string
        course_id: string
      }> = []

      // Get all course codes that we need to look up
      const courseCodes = new Set<string>()
      for (const [_, classes] of Object.entries(timetableData)) {
        for (const cls of classes) {
          courseCodes.add(cls.course_code)
        }
      }

      // Look up course IDs from course codes
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, code')
        .eq('school_id', userInfo.schoolId)
        .eq('department_id', userInfo.departmentId)
        .in('code', Array.from(courseCodes))

      if (courseError) throw courseError

      // Create a map of course_code -> course_id
      const courseMap = new Map<string, string>()
      courses?.forEach(course => {
        courseMap.set(course.code, course.id)
      })

      for (const [day, classes] of Object.entries(timetableData)) {
        for (const cls of classes) {
          // Parse time string like "9am-10am" to get start and end times
          const timeParts = cls.time.split('-')
          if (timeParts.length !== 2) continue

          // Look up course_id from course_code
          const courseId = courseMap.get(cls.course_code)
          if (!courseId) {
            console.warn(`Course not found for code: ${cls.course_code}`)
            continue // Skip this entry if course not found
          }

          entries.push({
            timetable_id: timetableId,
            day_of_week: day,
            start_time: this.parseTimeInput(timeParts[0].trim()),
            end_time: this.parseTimeInput(timeParts[1].trim()),
            location: cls.venue,
            course_id: courseId
          })
        }
      }

      if (entries.length > 0) {
        const { error } = await supabase
          .from('timetable_entries')
          .insert(entries)

        if (error) throw error
      }

      toast.success('Timetable saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save timetable')
      throw error
    }
  }
}
