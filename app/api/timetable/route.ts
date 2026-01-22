import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

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

// Helper to parse time input to HH:MM:SS format
function parseTimeInput(timeStr: string): string {
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

// GET /api/timetable - Get timetable for user's class group
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  // Initialize grouped data
  const groupedData: Record<string, Array<{ time: string; title: string; location: string; id?: string; courseCode?: string }>> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  }

  if (!userProfile.class_group_id) {
    return jsonResponse({ 
      timetable: groupedData, 
      hasTimetable: false, 
      isCourseRep: false 
    })
  }

  try {
    // Check if user is course rep
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userProfile.id)

    const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

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
      .eq('class_group_id', userProfile.class_group_id)

    // If user has a semester set, filter by semester
    if (userProfile.current_semester_id) {
      query = query.eq('semester_id', userProfile.current_semester_id)
    }

    const { data: timetableRecord, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching timetable:', error)
      return errorResponse('Failed to fetch timetable', 500)
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
          const startTime = formatTime(entry.start_time)
          const endTime = formatTime(entry.end_time)
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

    return jsonResponse({
      timetable: groupedData,
      hasTimetable,
      isCourseRep,
      timetableId
    })
  } catch (error) {
    console.error('Timetable fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/timetable - Create timetable record and/or add entry
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return errorResponse('No class group associated with user', 400)
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can modify the timetable', 403)
  }

  if (!userProfile.current_semester_id) {
    return errorResponse('Please set your current semester before creating a timetable', 400)
  }

  try {
    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, location, notes } = body

    if (!course_id || !day_of_week || !start_time || !end_time) {
      return errorResponse('Course, day, start time, and end time are required', 400)
    }

    // Get or create timetable
    let timetableId: string

    const { data: existingTimetable } = await supabase
      .from('timetables')
      .select('id')
      .eq('class_group_id', userProfile.class_group_id)
      .eq('semester_id', userProfile.current_semester_id)
      .maybeSingle()

    if (existingTimetable) {
      timetableId = existingTimetable.id
    } else {
      // Create new timetable
      const { data: newTimetable, error: createError } = await supabase
        .from('timetables')
        .insert({
          class_group_id: userProfile.class_group_id,
          semester_id: userProfile.current_semester_id,
          created_by: userProfile.id
        })
        .select()
        .single()

      if (createError) {
        console.error('Create timetable error:', createError)
        return errorResponse('Failed to create timetable', 500)
      }
      timetableId = newTimetable.id
    }

    // Add entry
    const { data: entry, error } = await supabase
      .from('timetable_entries')
      .insert({
        timetable_id: timetableId,
        course_id,
        day_of_week,
        start_time: parseTimeInput(start_time),
        end_time: parseTimeInput(end_time),
        location: location || '',
        notes: notes || ''
      })
      .select(`
        *,
        course:courses!timetable_entries_course_id_fkey(id, code, title)
      `)
      .single()

    if (error) {
      console.error('Add entry error:', error)
      return errorResponse('Failed to add timetable entry', 500)
    }

    return jsonResponse({ entry, timetableId, message: 'Class added to timetable!' }, 201)
  } catch (error) {
    console.error('Add timetable entry error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/timetable - Save entire timetable (replace all entries)
export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return errorResponse('No class group associated with user', 400)
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can save the timetable', 403)
  }

  if (!userProfile.current_semester_id) {
    return errorResponse('Please set your current semester before saving a timetable', 400)
  }

  try {
    const body = await request.json()
    const { timetableData } = body // Record<string, Array<{ time: string; course_code: string; venue: string }>>

    if (!timetableData) {
      return errorResponse('Timetable data is required', 400)
    }

    // Get or create timetable
    let timetableId: string

    const { data: existingTimetable } = await supabase
      .from('timetables')
      .select('id')
      .eq('class_group_id', userProfile.class_group_id)
      .eq('semester_id', userProfile.current_semester_id)
      .maybeSingle()

    if (existingTimetable) {
      timetableId = existingTimetable.id
    } else {
      const { data: newTimetable, error: createError } = await supabase
        .from('timetables')
        .insert({
          class_group_id: userProfile.class_group_id,
          semester_id: userProfile.current_semester_id,
          created_by: userProfile.id
        })
        .select()
        .single()

      if (createError) {
        return errorResponse('Failed to create timetable', 500)
      }
      timetableId = newTimetable.id
    }

    // Delete existing entries for this timetable
    await supabase
      .from('timetable_entries')
      .delete()
      .eq('timetable_id', timetableId)

    // Get all course codes that we need to look up
    const courseCodes = new Set<string>()
    for (const classes of Object.values(timetableData)) {
      for (const cls of classes as any[]) {
        courseCodes.add(cls.course_code)
      }
    }

    // Look up course IDs from course codes
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, code')
      .eq('school_id', userProfile.school_id)
      .in('code', Array.from(courseCodes))

    if (courseError) {
      return errorResponse('Failed to look up courses', 500)
    }

    // Create a map of course_code -> course_id
    const courseMap = new Map<string, string>()
    courses?.forEach(course => {
      courseMap.set(course.code, course.id)
    })

    const entries: Array<{
      timetable_id: string
      day_of_week: string
      start_time: string
      end_time: string
      location: string
      course_id: string
    }> = []

    for (const [day, classes] of Object.entries(timetableData)) {
      for (const cls of classes as any[]) {
        // Parse time string like "9am-10am" to get start and end times
        const timeParts = cls.time.split('-')
        if (timeParts.length !== 2) continue

        // Look up course_id from course_code
        const courseId = courseMap.get(cls.course_code)
        if (!courseId) {
          console.warn(`Course not found for code: ${cls.course_code}`)
          continue
        }

        entries.push({
          timetable_id: timetableId,
          day_of_week: day,
          start_time: parseTimeInput(timeParts[0].trim()),
          end_time: parseTimeInput(timeParts[1].trim()),
          location: cls.venue,
          course_id: courseId
        })
      }
    }

    if (entries.length > 0) {
      const { error } = await supabase
        .from('timetable_entries')
        .insert(entries)

      if (error) {
        return errorResponse('Failed to save timetable entries', 500)
      }
    }

    return jsonResponse({ timetableId, entriesCount: entries.length, message: 'Timetable saved successfully!' })
  } catch (error) {
    console.error('Save timetable error:', error)
    return errorResponse('Internal server error', 500)
  }
}
