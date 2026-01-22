import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, unauthorizedResponse } from '@/lib/api/server'

// Helper to format time from HH:MM:SS to display format (e.g., "9am")
function formatTime(timeStr: string): string {
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

// GET /api/timetable/today - Get today's schedule
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return jsonResponse({ schedule: [], nextClass: null })
  }

  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = days[new Date().getDay()]

    // Check if today is a weekend (no classes)
    if (today === 'Sunday' || today === 'Saturday') {
      return jsonResponse({ schedule: [], nextClass: null, isWeekend: true })
    }

    // Fetch timetable with entries for user's class group
    let query = supabase
      .from('timetables')
      .select(`
        id,
        entries:timetable_entries(
          id,
          day_of_week,
          start_time,
          end_time,
          location,
          course:courses!timetable_entries_course_id_fkey(
            id,
            code,
            title
          )
        )
      `)
      .eq('class_group_id', userProfile.class_group_id)

    if (userProfile.current_semester_id) {
      query = query.eq('semester_id', userProfile.current_semester_id)
    }

    const { data: timetableRecord, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching timetable:', error)
    }

    if (!timetableRecord || !timetableRecord.entries) {
      return jsonResponse({ schedule: [], nextClass: null })
    }

    // Filter for today's entries
    const entries = (timetableRecord.entries as any[]).filter(
      entry => entry.day_of_week === today
    )

    if (entries.length === 0) {
      return jsonResponse({ schedule: [], nextClass: null })
    }

    const currentTime = new Date()
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTotalMinutes = currentHour * 60 + currentMinute

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

    const parseTimeFromDb = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':')
      return { hour: parseInt(hours), minute: parseInt(minutes || '0') }
    }

    const formattedClasses = entries.map((entry, index) => {
      const startTimeFormatted = formatTime(entry.start_time)
      const endTimeFormatted = formatTime(entry.end_time)
      const timeDisplay = `${startTimeFormatted}-${endTimeFormatted}`

      const startTime = parseTimeFromDb(entry.start_time)
      const endTime = parseTimeFromDb(entry.end_time)

      // Determine status
      let status = 'Upcoming'
      let borderColor = 'border-l-blue-500'
      let badgeBg = 'bg-blue-50'
      let badgeText = 'text-blue-600'
      let dot = 'bg-blue-600'

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
        id: entry.id,
        code: entry.course?.code || 'TBD',
        title: entry.course?.title || '',
        program: entry.location || 'TBA',
        time: timeDisplay,
        status,
        borderColor,
        badgeBg,
        badgeText,
        dot,
        startMinutes: startTotalMinutes
      }
    })

    // Sort by start time
    formattedClasses.sort((a, b) => a.startMinutes - b.startMinutes)

    // Find next class
    const nextClass = formattedClasses.find(c => c.status === 'Upcoming')
    
    return jsonResponse({
      schedule: formattedClasses,
      nextClass: nextClass ? {
        code: nextClass.code,
        venue: nextClass.program,
        time: nextClass.time
      } : null
    })
  } catch (error) {
    console.error('Today schedule error:', error)
    return jsonResponse({ schedule: [], nextClass: null })
  }
}
