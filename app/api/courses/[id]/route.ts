import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api/server'

// GET /api/courses/[id] - Get single course with details
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
    // Get course with assignment count
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !course) {
      return notFoundResponse('Course not found')
    }

    // Get assignment count for this course
    let assignmentQuery = supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', id)
      .eq('class_group_id', userProfile.class_group_id)

    if (userProfile.current_semester_id) {
      assignmentQuery = assignmentQuery.eq('semester_id', userProfile.current_semester_id)
    }

    const { count: assignmentCount } = await assignmentQuery

    // Get weekly schedule for this course from timetable
    let weeklySchedule: any[] = []
    
    const { data: timetable } = await supabase
      .from('timetables')
      .select(`
        entries:timetable_entries(
          id,
          day_of_week,
          start_time,
          end_time,
          location
        )
      `)
      .eq('class_group_id', userProfile.class_group_id)
      .maybeSingle()

    if (timetable?.entries) {
      // Filter for entries matching this course (we need to join with course_id)
      const { data: courseEntries } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('course_id', id)

      if (courseEntries) {
        weeklySchedule = courseEntries.map(entry => ({
          day: entry.day_of_week,
          time: `${formatTime(entry.start_time)}-${formatTime(entry.end_time)}`,
          location: entry.location || 'TBA'
        }))
      }
    }

    // Check if user is course rep
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userProfile.id)

    const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

    return jsonResponse({
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        credit_unit: course.credit_unit,
        is_compulsory: course.is_compulsory,
        outline: course.outline
      },
      assignmentCount: assignmentCount || 0,
      weeklySchedule,
      isCourseRep
    })
  } catch (error) {
    console.error('Get course error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/courses/[id] - Update course (course rep only)
export async function PUT(
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
    return errorResponse('Only course reps can update courses', 403)
  }

  try {
    const body = await request.json()
    const { code, title, description, credit_unit, is_compulsory, outline } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (code !== undefined) updates.code = code
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (credit_unit !== undefined) updates.credit_unit = credit_unit
    if (is_compulsory !== undefined) updates.is_compulsory = is_compulsory
    if (outline !== undefined) updates.outline = outline

    const { data: course, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update course error:', error)
      return errorResponse('Failed to update course', 500)
    }

    return jsonResponse({ course, message: 'Course updated successfully' })
  } catch (error) {
    console.error('Update course error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/courses/[id] - Delete course (course rep only)
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
    return errorResponse('Only course reps can delete courses', 403)
  }

  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete course error:', error)
      return errorResponse('Failed to delete course', 500)
    }

    return jsonResponse({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// Helper to format time
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
