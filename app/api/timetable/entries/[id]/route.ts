import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api/server'

// Helper to parse time input to HH:MM:SS format
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

// GET /api/timetable/entries/[id] - Get single entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    const { data: entry, error } = await supabase
      .from('timetable_entries')
      .select(`
        *,
        course:courses!timetable_entries_course_id_fkey(id, code, title),
        timetable:timetables!timetable_entries_timetable_id_fkey(class_group_id)
      `)
      .eq('id', id)
      .single()

    if (error || !entry) {
      return notFoundResponse('Entry not found')
    }

    // Verify user has access to this entry
    const timetable = entry.timetable as any
    if (timetable?.class_group_id !== userProfile.class_group_id) {
      return errorResponse('Access denied', 403)
    }

    return jsonResponse({ entry })
  } catch (error) {
    console.error('Get entry error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PATCH /api/timetable/entries/[id] - Update entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can update the timetable', 403)
  }

  try {
    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, location, notes } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (course_id !== undefined) updates.course_id = course_id
    if (day_of_week !== undefined) updates.day_of_week = day_of_week
    if (start_time !== undefined) updates.start_time = parseTimeInput(start_time)
    if (end_time !== undefined) updates.end_time = parseTimeInput(end_time)
    if (location !== undefined) updates.location = location
    if (notes !== undefined) updates.notes = notes

    const { data: entry, error } = await supabase
      .from('timetable_entries')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        course:courses!timetable_entries_course_id_fkey(id, code, title)
      `)
      .single()

    if (error) {
      console.error('Update entry error:', error)
      return errorResponse('Failed to update entry', 500)
    }

    return jsonResponse({ entry, message: 'Timetable updated!' })
  } catch (error) {
    console.error('Update entry error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/timetable/entries/[id] - Delete entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can delete timetable entries', 403)
  }

  try {
    const { error } = await supabase
      .from('timetable_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete entry error:', error)
      return errorResponse('Failed to delete entry', 500)
    }

    return jsonResponse({ message: 'Class removed from timetable!' })
  } catch (error) {
    console.error('Delete entry error:', error)
    return errorResponse('Internal server error', 500)
  }
}
