import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface TimetableEntry {
  id: string
  day: string
  time: string
  course: string
  venue: string
  lecturer: string
  user_id: string
}

export interface CreateTimetableData {
  day: string
  time: string
  course: string
  venue: string
  lecturer: string
  userId: string
}

export interface DaySchedule {
  day: string
  entries: TimetableEntry[]
}

export class TimetableService {
  // Get timetable for a user
  static async getTimetable(userId: string): Promise<{
    timetable: Record<string, Array<{ time: string; title: string; location: string; isOwner?: boolean; ownerName?: string }>>,
    hasTimetable: boolean,
    connectedUserNames: string[],
    usersWithoutTimetable: string[]
  }> {
    try {
      // Initialize grouped data
      const groupedData: Record<string, Array<{ time: string; title: string; location: string; isOwner?: boolean; ownerName?: string }>> = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      }

      let hasTimetable = false
      const connectedUserNames: string[] = []
      const usersWithoutTimetable: string[] = []

      // 1. Fetch user's own timetable  
      const { data: timetableRecord, error: ownError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', userId)
        .single()

      if (ownError && ownError.code !== 'PGRST116') {
        console.error('Error fetching timetable:', ownError)
      }

      // Add own timetable
      if (timetableRecord && timetableRecord.timetable_data) {
        const jsonData = timetableRecord.timetable_data as Record<string, Array<{ time: string; course?: string; course_code?: string; course_title?: string; venue: string }>>
        
        Object.entries(jsonData).forEach(([day, classes]) => {
          if (day in groupedData) {
            classes.forEach(classItem => {
              // Extract only course code (remove lecturer names after dash)
              let courseDisplay = classItem.course_code || classItem.course || 'TBD'
              if (courseDisplay.includes(' - ')) {
                courseDisplay = courseDisplay.split(' - ')[0].trim()
              }
              
              groupedData[day].push({
                time: classItem.time,
                title: courseDisplay,
                location: classItem.venue,
                isOwner: true
              })
            })
          }
        })
        hasTimetable = true
      }

      // 2. Fetch connected classmates' timetables
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)

      if (connections && connections.length > 0) {
        const connectedUserIds = connections.map(c => c.following_id)

        // Fetch connected users' names and timetables
        const { data: connectedUsersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', connectedUserIds)

        const { data: connectedTimetables } = await supabase
          .from('timetable')
          .select('user_id, timetable_data')
          .in('user_id', connectedUserIds)

        const userNamesMap = new Map(
          connectedUsersData?.map(u => [u.id, u.name]) || []
        )

        connectedUserNames.push(...(connectedUsersData?.map(u => u.name) || []))

        // Add connected users' timetables
        connectedTimetables?.forEach(tt => {
          if (tt.timetable_data) {
            const jsonData = tt.timetable_data as Record<string, Array<{ time: string; course?: string; course_code?: string; course_title?: string; venue: string }>>
            const ownerName = userNamesMap.get(tt.user_id) || 'Classmate'

            Object.entries(jsonData).forEach(([day, classes]) => {
              if (day in groupedData && classes.length > 0) {
                classes.forEach(classItem => {
                  // Extract only course code (remove lecturer names after dash)
                  let courseDisplay = classItem.course_code || classItem.course || 'TBD'
                  if (courseDisplay.includes(' - ')) {
                    courseDisplay = courseDisplay.split(' - ')[0].trim()
                  }
                  
                  groupedData[day].push({
                    time: classItem.time,
                    title: courseDisplay,
                    location: classItem.venue,
                    isOwner: false,
                    ownerName
                  })
                })
              }
            })
          }
        })

        // Check if connected users had no timetables
        const usersWithNoTimetable = connectedUserIds.filter(userId => {
          const hasData = connectedTimetables?.some(tt => 
            tt.user_id === userId && tt.timetable_data
          )
          return !hasData
        })

        if (usersWithNoTimetable.length > 0) {
          const userNames = usersWithNoTimetable.map(id => userNamesMap.get(id) || 'Classmate')
          usersWithoutTimetable.push(...userNames)
        }
      }

      return {
        timetable: groupedData,
        hasTimetable,
        connectedUserNames,
        usersWithoutTimetable
      }
    } catch (error: any) {
      toast.error('Failed to load timetable')
      throw error
    }
  }

  // Create timetable entry
  static async createTimetableEntry(data: CreateTimetableData): Promise<void> {
    try {
      const { error } = await supabase
        .from('timetable')
        .insert({
          day: data.day,
          time: data.time,
          course: data.course,
          venue: data.venue,
          lecturer: data.lecturer,
          user_id: data.userId
        })

      if (error) throw error
      toast.success('Timetable entry added successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add timetable entry')
      throw error
    }
  }

  // Update timetable entry
  static async updateTimetableEntry(
    entryId: string,
    userId: string,
    updates: Partial<CreateTimetableData>
  ): Promise<void> {
    try {
      const updateData: any = {}
      if (updates.day) updateData.day = updates.day
      if (updates.time) updateData.time = updates.time
      if (updates.course) updateData.course = updates.course
      if (updates.venue) updateData.venue = updates.venue
      if (updates.lecturer) updateData.lecturer = updates.lecturer

      const { error } = await supabase
        .from('timetable')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('Timetable entry updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update timetable entry')
      throw error
    }
  }

  // Delete timetable entry
  static async deleteTimetableEntry(entryId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('timetable')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('Timetable entry deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete timetable entry')
      throw error
    }
  }

  // Get today's schedule
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
    connectedTo?: string
  }>> {
    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const today = days[new Date().getDay()]

      // Check if today is a weekend (no classes)
      if (today === 'Sunday' || today === 'Saturday') {
        return []
      }

      const todaysClasses: Array<{ time: string; course: string; venue: string; isOwner?: boolean; ownerName?: string }> = []

      // 1. Fetch user's own timetable
      const { data: timetableRecord, error: ownError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', userId)
        .single()

      if (ownError && ownError.code !== 'PGRST116') {
        console.error('Error fetching today\'s classes:', ownError)
      }

      if (timetableRecord && timetableRecord.timetable_data) {
        const jsonData = timetableRecord.timetable_data as Record<string, Array<{ time: string; course?: string; course_code?: string; course_title?: string; venue: string }>>
        const ownClasses = (jsonData[today] || []).map(c => {
          // Extract only course code (remove lecturer names after dash)
          let courseDisplay = c.course_code || c.course || 'TBD'
          if (courseDisplay.includes(' - ')) {
            courseDisplay = courseDisplay.split(' - ')[0].trim()
          }
          
          return { 
            time: c.time,
            course: courseDisplay,
            venue: c.venue,
            isOwner: true 
          }
        })
        todaysClasses.push(...ownClasses)
      }

      // 2. Fetch connected users' timetables
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)

      if (connections && connections.length > 0) {
        const connectedUserIds = connections.map(c => c.following_id)

        const { data: connectedUsers } = await supabase
          .from('users')
          .select('id, name')
          .in('id', connectedUserIds)

        const userNamesMap = new Map(
          connectedUsers?.map(u => [u.id, u.name]) || []
        )

        const { data: connectedTimetables } = await supabase
          .from('timetable')
          .select('user_id, timetable_data')
          .in('user_id', connectedUserIds)

        connectedTimetables?.forEach(tt => {
          if (tt.timetable_data) {
            const jsonData = tt.timetable_data as Record<string, Array<{ time: string; course?: string; course_code?: string; course_title?: string; venue: string }>>
            const ownerName = userNamesMap.get(tt.user_id) || 'Classmate'
            const connectedClasses = (jsonData[today] || []).map(c => {
              // Extract only course code (remove lecturer names after dash)
              let courseDisplay = c.course_code || c.course || 'TBD'
              if (courseDisplay.includes(' - ')) {
                courseDisplay = courseDisplay.split(' - ')[0].trim()
              }
              
              return {
                time: c.time,
                course: courseDisplay,
                venue: c.venue,
                isOwner: false,
                ownerName
              }
            })
            todaysClasses.push(...connectedClasses)
          }
        })
      }

      if (todaysClasses && todaysClasses.length > 0) {
        const currentTime = new Date()
        const currentHour = currentTime.getHours()
        const currentMinute = currentTime.getMinutes()

        const formattedClasses = todaysClasses.map((item, index) => {
          const [startTimeStr, endTimeStr] = item.time.split('-')
          
          const parseTime = (timeStr: string) => {
            const match = timeStr.match(/(\d+)(am|pm)/)
            if (!match) return { hour: 0, minute: 0 }
            let hour = parseInt(match[1])
            const period = match[2]
            
            if (period === 'pm' && hour !== 12) {
              hour += 12
            } else if (period === 'am' && hour === 12) {
              hour = 0
            }
            
            return { hour, minute: 0 }
          }

          const startTime = parseTime(startTimeStr)
          const endTime = parseTime(endTimeStr)

          // Determine status
          let status = 'Upcoming'
          let borderColor = item.isOwner ? 'border-l-blue-500' : 'border-l-emerald-500'
          let badgeBg = item.isOwner ? 'bg-blue-50' : 'bg-emerald-50'
          let badgeText = item.isOwner ? 'text-blue-600' : 'text-emerald-600'
          let dot = item.isOwner ? 'bg-blue-600' : 'bg-emerald-600'

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
            id: `${today}-${index}`,
            code: item.course,
            program: item.venue || 'TBA',
            time: item.time,
            status,
            borderColor,
            badgeBg,
            badgeText,
            dot,
            connectedTo: item.ownerName
          }
        })

        return formattedClasses
      }

      return []
    } catch (error: any) {
      console.error('Failed to fetch today\'s classes:', error)
      return []
    }
  }

  // Get next class
  static async getNextClass(userId: string): Promise<TimetableEntry | null> {
    try {
      const now = new Date()
      const today = now.toLocaleDateString('en-US', { weekday: 'long' })
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('user_id', userId)
        .eq('day', today)
        .gte('time', currentTime)
        .order('time', { ascending: true })
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    } catch (error: any) {
      return null
    }
  }
}