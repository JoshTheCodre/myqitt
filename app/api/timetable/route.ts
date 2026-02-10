import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// Helper: format time
function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  let hour = parseInt(hours)
  const period = hour >= 12 ? 'pm' : 'am'
  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12
  if (minutes && minutes !== '00') return `${hour}:${minutes}${period}`
  return `${hour}${period}`
}

// Helper: parse time input
function parseTimeInput(timeStr: string): string {
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

// Helper: get user class group info
async function getUserClassGroupInfo(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      class_group_id, current_semester_id, school_id,
      class_groups!inner(department_id),
      user_roles(role:roles(name))
    `)
    .eq('id', userId)
    .single()

  if (error || !data || !data.class_group_id) return null

  const userRoles = data.user_roles as any[] | null
  const isCourseRep = userRoles?.some((ur: any) => ur?.role?.name === 'course_rep') || false

  return {
    class_group_id: data.class_group_id,
    semester_id: data.current_semester_id || undefined,
    school_id: data.school_id || undefined,
    department_id: (data.class_groups as any)?.department_id || undefined,
    isCourseRep
  }
}

// GET /api/timetable
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const targetUserId = searchParams.get('userId') || user!.id

  if (action === 'today-schedule') return getTodaySchedule(supabase!, targetUserId)
  if (action === 'next-class') return getNextClass(supabase!, targetUserId)
  if (action === 'todays-classes') {
    const date = searchParams.get('date') || undefined
    return getTodaysClasses(supabase!, targetUserId, date)
  }
  if (action === 'user-info') return getUserInfo(supabase!, targetUserId)

  return getTimetable(supabase!, targetUserId)
}

// POST /api/timetable
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  const { action } = body

  if (action === 'add-entry') return addTimetableEntry(supabase!, user!.id, body.data)
  if (action === 'save-timetable') return saveTimetable(supabase!, user!.id, body.timetableData)
  if (action === 'update-todays-class') return createTodaysClassUpdate(supabase!, user!.id, body.data)
  if (action === 'cancel-class') return cancelClass(supabase!, user!.id, body)

  return jsonError('Unknown action')
}

// PATCH /api/timetable
export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  return updateTimetableEntry(supabase!, user!.id, body.entryId, body.data)
}

// DELETE /api/timetable
export async function DELETE(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const entryId = searchParams.get('entryId')
  const todaysClassId = searchParams.get('todaysClassId')

  if (todaysClassId) return deleteTodaysClassUpdate(supabase!, user!.id, todaysClassId)
  if (entryId) return deleteTimetableEntry(supabase!, user!.id, entryId)

  return jsonError('Missing ID')
}

// ============ HANDLERS ============

async function getUserInfo(supabase: any, userId: string) {
  const info = await getUserClassGroupInfo(supabase, userId)
  return jsonSuccess(info)
}

async function getTimetable(supabase: any, userId: string) {
  const groupedData: Record<string, any[]> = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
  }

  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess({ timetable: groupedData, hasTimetable: false, isCourseRep: false })

  let query = supabase
    .from('timetables')
    .select(`
      id, class_group_id, semester_id, updated_at,
      entries:timetable_entries(
        id, day_of_week, start_time, end_time, location, notes,
        course:courses!timetable_entries_course_id_fkey(id, code, title)
      )
    `)
    .eq('class_group_id', userInfo.class_group_id)

  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)

  const { data: timetableRecord } = await query.maybeSingle()

  let hasTimetable = false
  let timetableId: string | undefined

  if (timetableRecord?.entries) {
    timetableId = timetableRecord.id
    const entries = timetableRecord.entries as any[]

    entries.forEach((entry: any) => {
      const day = entry.day_of_week as string
      if (day in groupedData) {
        const startTime = formatTime(entry.start_time)
        const endTime = formatTime(entry.end_time)
        groupedData[day].push({
          id: entry.id,
          time: `${startTime}-${endTime}`,
          title: entry.course?.code || 'TBD',
          location: entry.location || 'TBA',
          courseCode: entry.course?.code
        })
      }
    })
    hasTimetable = entries.length > 0
  }

  // Sort by time
  Object.keys(groupedData).forEach(day => {
    groupedData[day].sort((a: any, b: any) => {
      const getStart = (t: string) => {
        const s = t.split('-')[0].trim()
        const isPM = s.toLowerCase().includes('pm')
        const h = parseInt(s.replace(/[^\d]/g, ''))
        if (isPM && h !== 12) return h + 12
        if (!isPM && h === 12) return 0
        return h
      }
      return getStart(a.time) - getStart(b.time)
    })
  })

  return jsonSuccess({
    timetable: groupedData,
    hasTimetable,
    isCourseRep: userInfo.isCourseRep,
    timetableId,
    lastUpdated: timetableRecord?.updated_at
  })
}

async function getTodaySchedule(supabase: any, userId: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  if (today === 'Sunday' || today === 'Saturday') return jsonSuccess([])

  const { data: timetableData } = await getTimetableRaw(supabase, userId)
  if (!timetableData?.hasTimetable) return jsonSuccess([])

  const todaysClasses = timetableData.timetable[today] || []
  if (todaysClasses.length === 0) return jsonSuccess([])

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  const formatted = todaysClasses.map((item: any, index: number) => {
    const timeParts = item.time.split('-')
    const parseT = (t: string) => {
      const m = t.match(/(\d+)(?::(\d+))?(am|pm)/i)
      if (!m) return { hour: 0, minute: 0 }
      let h = parseInt(m[1])
      const min = m[2] ? parseInt(m[2]) : 0
      const p = m[3].toLowerCase()
      if (p === 'pm' && h !== 12) h += 12
      if (p === 'am' && h === 12) h = 0
      return { hour: h, minute: min }
    }

    const startTime = parseT(timeParts[0])
    const endTime = parseT(timeParts[1])
    const currentTotal = currentHour * 60 + currentMinute
    const startTotal = startTime.hour * 60 + startTime.minute
    const endTotal = endTime.hour * 60 + endTime.minute

    let status = 'Upcoming', borderColor = 'border-l-blue-500', badgeBg = 'bg-blue-50', badgeText = 'text-blue-600', dot = 'bg-blue-600'

    if (currentTotal >= startTotal && currentTotal < endTotal) {
      status = 'Ongoing'; borderColor = 'border-l-amber-400'; badgeBg = 'bg-amber-50'; badgeText = 'text-amber-400'; dot = 'bg-amber-400'
    } else if (currentTotal >= endTotal) {
      status = 'Completed'; borderColor = 'border-l-gray-400'; badgeBg = 'bg-gray-50'; badgeText = 'text-gray-600'; dot = 'bg-gray-600'
    }

    return {
      id: item.id || `${today}-${index}`,
      code: item.title, program: item.location, time: item.time,
      status, borderColor, badgeBg, badgeText, dot
    }
  })

  return jsonSuccess(formatted)
}

async function getTimetableRaw(supabase: any, userId: string) {
  // Internal helper - returns raw timetable data
  const groupedData: Record<string, any[]> = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
  }

  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return { data: { timetable: groupedData, hasTimetable: false, isCourseRep: false } }

  let query = supabase
    .from('timetables')
    .select(`
      id, class_group_id, semester_id, updated_at,
      entries:timetable_entries(
        id, day_of_week, start_time, end_time, location, notes,
        course:courses!timetable_entries_course_id_fkey(id, code, title)
      )
    `)
    .eq('class_group_id', userInfo.class_group_id)

  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)
  const { data: timetableRecord } = await query.maybeSingle()

  let hasTimetable = false
  if (timetableRecord?.entries) {
    (timetableRecord.entries as any[]).forEach((entry: any) => {
      const day = entry.day_of_week as string
      if (day in groupedData) {
        groupedData[day].push({
          id: entry.id,
          time: `${formatTime(entry.start_time)}-${formatTime(entry.end_time)}`,
          title: entry.course?.code || 'TBD',
          location: entry.location || 'TBA',
          courseCode: entry.course?.code
        })
      }
    })
    hasTimetable = (timetableRecord.entries as any[]).length > 0
  }

  return { data: { timetable: groupedData, hasTimetable, isCourseRep: userInfo.isCourseRep } }
}

async function getNextClass(supabase: any, userId: string) {
  const schedule = await getTodayScheduleRaw(supabase, userId)
  const upcoming = schedule.find((c: any) => c.status === 'Upcoming')
  if (!upcoming) return jsonSuccess(null)
  return jsonSuccess({ code: upcoming.code, venue: upcoming.program, time: upcoming.time })
}

async function getTodayScheduleRaw(supabase: any, userId: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  if (today === 'Sunday' || today === 'Saturday') return []

  const { data: timetableData } = await getTimetableRaw(supabase, userId)
  if (!timetableData?.hasTimetable) return []

  const todaysClasses = timetableData.timetable[today] || []
  const now = new Date()
  const currentTotal = now.getHours() * 60 + now.getMinutes()

  return todaysClasses.map((item: any, index: number) => {
    const timeParts = item.time.split('-')
    const parseT = (t: string) => {
      const m = t.match(/(\d+)(?::(\d+))?(am|pm)/i)
      if (!m) return 0
      let h = parseInt(m[1])
      const min = m[2] ? parseInt(m[2]) : 0
      if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12
      if (m[3].toLowerCase() === 'am' && h === 12) h = 0
      return h * 60 + min
    }

    const startTotal = parseT(timeParts[0])
    const endTotal = parseT(timeParts[1])

    let status = 'Upcoming'
    if (currentTotal >= startTotal && currentTotal < endTotal) status = 'Ongoing'
    else if (currentTotal >= endTotal) status = 'Completed'

    return { id: item.id || `${today}-${index}`, code: item.title, program: item.location, time: item.time, status }
  })
}

async function getTodaysClasses(supabase: any, userId: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const dayName = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' })

  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess([])

  // Get timetable entries
  const { data: timetableData } = await getTimetableRaw(supabase, userId)
  const dayClasses = timetableData?.timetable[dayName] || []

  // Get overrides
  const { data: todaysData } = await supabase
    .from('todays_classes')
    .select(`*, course:courses!todays_classes_course_id_fkey(id, code, title)`)
    .eq('class_group_id', userInfo.class_group_id)
    .eq('date', targetDate)

  const updatesMap = new Map<string, any>()
  const standaloneUpdates: any[] = []

  todaysData?.forEach((update: any) => {
    if (update.timetable_entry_id) updatesMap.set(update.timetable_entry_id, update)
    else standaloneUpdates.push(update)
  })

  const merged = dayClasses.map((cls: any, index: number) => {
    const entryId = cls.id || `${dayName}-${index}`
    const update = cls.id ? updatesMap.get(cls.id) : undefined

    const timeParts = cls.time.split('-')
    const origStart = timeParts[0] || ''
    const origEnd = timeParts[1] || ''

    if (update) {
      const uStart = formatTime(update.start_time)
      const uEnd = formatTime(update.end_time)
      return {
        id: entryId,
        timetable_entry_id: cls.id,
        course_code: update.course?.code || cls.title,
        course_title: update.course?.title,
        start_time: uStart, end_time: uEnd,
        location: update.location, day: dayName,
        is_cancelled: update.is_cancelled, notes: update.notes,
        has_update: true, todays_class_id: update.id,
        time_changed: uStart !== origStart || uEnd !== origEnd,
        location_changed: update.location !== cls.location,
        course_changed: update.course?.code !== cls.title,
        original_location: update.location !== cls.location ? cls.location : undefined,
        original_start_time: uStart !== origStart ? origStart : undefined,
        original_end_time: uEnd !== origEnd ? origEnd : undefined
      }
    }

    return {
      id: entryId, timetable_entry_id: cls.id,
      course_code: cls.title, start_time: origStart, end_time: origEnd,
      location: cls.location, day: dayName, has_update: false
    }
  })

  standaloneUpdates.forEach((update: any) => {
    merged.push({
      id: update.id,
      timetable_entry_id: update.timetable_entry_id || null,
      course_code: update.course?.code || 'TBD',
      course_title: update.course?.title,
      start_time: formatTime(update.start_time),
      end_time: formatTime(update.end_time),
      location: update.location, day: dayName,
      is_cancelled: update.is_cancelled, notes: update.notes,
      has_update: true, todays_class_id: update.id,
      time_changed: false, location_changed: false, course_changed: false,
      original_location: undefined, original_start_time: undefined, original_end_time: undefined
    })
  })

  merged.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
  return jsonSuccess(merged)
}

async function addTimetableEntry(supabase: any, userId: string, data: any) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can update the timetable', 403)

  const timetableId = await getOrCreateTimetable(supabase, userId, userInfo)
  if (!timetableId) return jsonError('Could not create timetable')

  const { error: insertError } = await supabase
    .from('timetable_entries')
    .insert({
      timetable_id: timetableId,
      course_id: data.course_id,
      day_of_week: data.day_of_week,
      start_time: parseTimeInput(data.start_time),
      end_time: parseTimeInput(data.end_time),
      location: data.location,
      notes: data.notes
    })

  if (insertError) return jsonError(insertError.message, 500)
  return jsonSuccess({ created: true }, 201)
}

async function updateTimetableEntry(supabase: any, userId: string, entryId: string, data: any) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can update the timetable', 403)

  const updates: Record<string, any> = {}
  if (data.course_id) updates.course_id = data.course_id
  if (data.day_of_week) updates.day_of_week = data.day_of_week
  if (data.start_time) updates.start_time = parseTimeInput(data.start_time)
  if (data.end_time) updates.end_time = parseTimeInput(data.end_time)
  if (data.location) updates.location = data.location
  if (data.notes !== undefined) updates.notes = data.notes

  const { error: updateError } = await supabase.from('timetable_entries').update(updates).eq('id', entryId)
  if (updateError) return jsonError(updateError.message, 500)
  return jsonSuccess({ updated: true })
}

async function deleteTimetableEntry(supabase: any, userId: string, entryId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can delete timetable entries', 403)

  const { error: deleteError } = await supabase.from('timetable_entries').delete().eq('id', entryId)
  if (deleteError) return jsonError(deleteError.message, 500)
  return jsonSuccess({ deleted: true })
}

async function saveTimetable(supabase: any, userId: string, timetableData: Record<string, any[]>) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can save the timetable', 403)

  const timetableId = await getOrCreateTimetable(supabase, userId, userInfo)
  if (!timetableId) return jsonError('Could not create timetable')

  // Delete existing
  await supabase.from('timetable_entries').delete().eq('timetable_id', timetableId)

  // Collect course codes
  const courseCodes = new Set<string>()
  for (const classes of Object.values(timetableData)) {
    for (const cls of classes) courseCodes.add(cls.course_code)
  }

  const { data: courses } = await supabase
    .from('courses')
    .select('id, code')
    .eq('school_id', userInfo.school_id)
    .eq('department_id', userInfo.department_id)
    .in('code', Array.from(courseCodes))

  const courseMap = new Map<string, string>()
  courses?.forEach((c: any) => courseMap.set(c.code, c.id))

  const entries: any[] = []
  for (const [day, classes] of Object.entries(timetableData)) {
    for (const cls of classes) {
      const timeParts = cls.time.split('-')
      if (timeParts.length !== 2) continue
      const courseId = courseMap.get(cls.course_code)
      if (!courseId) continue

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
    const { error: insertError } = await supabase.from('timetable_entries').insert(entries)
    if (insertError) return jsonError(insertError.message, 500)
  }

  // Notify
  if (userInfo.isCourseRep) {
    try {
      const { data: connectees } = await supabase
        .from('connections')
        .select('follower_id, connection_types')
        .eq('following_id', userId)

      const recipients = (connectees || [])
        .filter((c: any) => c.connection_types?.includes('timetable'))
        .map((c: any) => c.follower_id)

      if (recipients.length > 0) {
        const notifications = recipients.map((uid: string) => ({
          user_id: uid, type: 'timetable_updated',
          title: 'Timetable Updated',
          message: 'Your class timetable has been updated. Check the changes!',
          data: { hostUserId: userId }, action_url: '/timetable', is_read: false
        }))
        await supabase.from('notifications').insert(notifications)
      }
    } catch {}
  }

  return jsonSuccess({ saved: true })
}

async function createTodaysClassUpdate(supabase: any, userId: string, data: any) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can update classes', 403)
  if (!userInfo.semester_id) return jsonError('Please set your current semester')

  if (data.timetable_entry_id) {
    const { data: existing } = await supabase
      .from('todays_classes')
      .select('id')
      .eq('class_group_id', userInfo.class_group_id)
      .eq('date', data.date)
      .eq('timetable_entry_id', data.timetable_entry_id)
      .single()

    if (existing) {
      const { error: updateError } = await supabase
        .from('todays_classes')
        .update({
          course_id: data.course_id,
          start_time: parseTimeInput(data.start_time),
          end_time: parseTimeInput(data.end_time),
          location: data.location,
          is_cancelled: data.is_cancelled || false,
          notes: data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) return jsonError(updateError.message, 500)
      return jsonSuccess({ updated: true })
    }
  }

  const { error: insertError } = await supabase
    .from('todays_classes')
    .insert({
      date: data.date,
      class_group_id: userInfo.class_group_id,
      semester_id: userInfo.semester_id,
      timetable_entry_id: data.timetable_entry_id,
      course_id: data.course_id,
      start_time: parseTimeInput(data.start_time),
      end_time: parseTimeInput(data.end_time),
      location: data.location,
      is_cancelled: data.is_cancelled || false,
      notes: data.notes,
      created_by: userId
    })

  if (insertError) return jsonError(insertError.message, 500)
  return jsonSuccess({ created: true }, 201)
}

async function cancelClass(supabase: any, userId: string, body: any) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can cancel classes', 403)

  const { date, timetableEntryId, courseId, notes } = body

  const { data: existing } = await supabase
    .from('todays_classes')
    .select('id')
    .eq('class_group_id', userInfo.class_group_id)
    .eq('date', date)
    .eq('timetable_entry_id', timetableEntryId)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from('todays_classes')
      .update({ is_cancelled: true, notes: notes || 'Class cancelled', updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (updateError) return jsonError(updateError.message, 500)
  } else {
    if (!userInfo.semester_id) return jsonError('Please set your current semester')
    const { error: insertError } = await supabase
      .from('todays_classes')
      .insert({
        date,
        class_group_id: userInfo.class_group_id,
        semester_id: userInfo.semester_id,
        timetable_entry_id: timetableEntryId,
        course_id: courseId,
        start_time: '00:00:00', end_time: '00:00:00',
        location: '', is_cancelled: true,
        notes: notes || 'Class cancelled',
        created_by: userId
      })
    if (insertError) return jsonError(insertError.message, 500)
  }

  return jsonSuccess({ cancelled: true })
}

async function deleteTodaysClassUpdate(supabase: any, userId: string, todaysClassId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can delete class updates', 403)

  const { error: deleteError } = await supabase
    .from('todays_classes')
    .delete()
    .eq('id', todaysClassId)
    .eq('class_group_id', userInfo.class_group_id)

  if (deleteError) return jsonError(deleteError.message, 500)
  return jsonSuccess({ deleted: true })
}

async function getOrCreateTimetable(supabase: any, userId: string, userInfo: any) {
  let query = supabase.from('timetables').select('id').eq('class_group_id', userInfo.class_group_id)
  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)
  const { data: existing } = await query.maybeSingle()

  if (existing) return existing.id

  if (!userInfo.semester_id) return null

  const { data: newTimetable, error } = await supabase
    .from('timetables')
    .insert({ class_group_id: userInfo.class_group_id, semester_id: userInfo.semester_id, created_by: userId })
    .select()
    .single()

  if (error) return null
  return newTimetable.id
}
