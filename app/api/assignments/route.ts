import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// Helper: get user class group info
async function getUserClassGroupInfo(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      class_group_id,
      current_semester_id,
      school_id,
      class_groups!inner(department_id),
      user_roles(role:roles(name))
    `)
    .eq('id', userId)
    .single()

  if (error || !data || !data.class_group_id) return null

  const userRoles = data.user_roles as any[] | null
  const isCourseRep = userRoles?.some((ur: any) => ur?.role?.name === 'course_rep') || false
  const classGroups = data.class_groups as any

  return {
    class_group_id: data.class_group_id,
    semester_id: data.current_semester_id || undefined,
    school_id: data.school_id || undefined,
    department_id: classGroups?.department_id || undefined,
    isCourseRep
  }
}

// GET /api/assignments - Get user's assignments (grouped)
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Route to different handlers based on action
  if (action === 'list') return getAssignmentsList(supabase!, user!.id)
  if (action === 'stats') return getAssignmentStats(supabase!, user!.id)
  if (action === 'upcoming-count') return getUpcomingCount(supabase!, user!.id)
  if (action === 'next') return getNextAssignment(supabase!, user!.id)
  if (action === 'unread-count') return getUnreadCount(supabase!, user!.id)
  if (action === 'unviewed-ids') return getUnviewedIds(supabase!, user!.id)

  return getGroupedAssignments(supabase!, user!.id)
}

// POST /api/assignments - Create assignment
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  const { action } = body

  if (action === 'toggle-submission') {
    return toggleSubmission(supabase!, user!.id, body.assignmentId, body.submitted)
  }
  if (action === 'mark-viewed') {
    return markAsViewed(supabase!, user!.id, body.assignmentId)
  }

  return createAssignment(supabase!, user!.id, body)
}

// PATCH /api/assignments - Update assignment
export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  return updateAssignment(supabase!, user!.id, body.assignmentId, body.data)
}

// DELETE /api/assignments - Delete assignment
export async function DELETE(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get('id')

  if (!assignmentId) return jsonError('Missing assignment ID')
  return deleteAssignment(supabase!, user!.id, assignmentId)
}

// ============ HANDLER FUNCTIONS ============

async function getGroupedAssignments(supabase: any, userId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess({ assignments: [], isCourseRep: false })

  let query = supabase
    .from('assignments')
    .select(`
      id, title, description, due_at, attachment_urls, created_at,
      course:courses!assignments_course_id_fkey(id, code, title)
    `)
    .eq('class_group_id', userInfo.class_group_id)
    .order('due_at', { ascending: true })

  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)

  const { data: assignmentsData, error: fetchError } = await query
  if (fetchError && fetchError.code !== 'PGRST116') {
    return jsonError('Failed to fetch assignments', 500)
  }
  if (!assignmentsData || assignmentsData.length === 0) {
    return jsonSuccess({ assignments: [], isCourseRep: userInfo.isCourseRep })
  }

  // Fetch user's submission status
  const assignmentIds = assignmentsData.map((a: any) => a.id)
  const { data: submissions } = await supabase
    .from('user_assignment_submissions')
    .select('assignment_id, submitted, submitted_at')
    .eq('user_id', userId)
    .in('assignment_id', assignmentIds)

  const submissionMap = new Map<string, { submitted: boolean; submitted_at: string | null }>()
  submissions?.forEach((s: any) => {
    submissionMap.set(s.assignment_id, { submitted: s.submitted, submitted_at: s.submitted_at })
  })

  // Group by course
  const groupedAssignments = assignmentsData.reduce((acc: any[], item: any) => {
    const courseCode = item.course?.code || 'Unknown'
    const courseTitle = item.course?.title || ''
    const existing = acc.find((a: any) => a.courseCode === courseCode)
    const dueDate = item.due_at ? new Date(item.due_at) : null
    const dateLabel = dueDate
      ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'No due date'
    const userSubmission = submissionMap.get(item.id)
    const isSubmitted = userSubmission?.submitted || false
    const submittedAt = userSubmission?.submitted_at || null

    const assignmentDate = {
      id: item.id,
      date: item.due_at || '',
      label: dateLabel,
      title: item.title,
      description: item.description || '',
      submissionType: 'PDF Report',
      submitted: isSubmitted,
      submitted_at: submittedAt || undefined
    }

    if (existing) {
      existing.dates.push(assignmentDate)
      existing.assignmentCount++
      if (isSubmitted) existing.submittedCount++
    } else {
      acc.push({
        courseCode,
        courseTitle,
        assignmentCount: 1,
        submittedCount: isSubmitted ? 1 : 0,
        dates: [assignmentDate]
      })
    }
    return acc
  }, [])

  return jsonSuccess({ assignments: groupedAssignments, isCourseRep: userInfo.isCourseRep })
}

async function getAssignmentsList(supabase: any, userId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess([])

  let query = supabase
    .from('assignments')
    .select(`*, course:courses!assignments_course_id_fkey(id, code, title)`)
    .eq('class_group_id', userInfo.class_group_id)
    .order('due_at', { ascending: true })

  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)
  const { data, error: fetchError } = await query
  if (fetchError) return jsonError('Failed to fetch assignments', 500)
  return jsonSuccess(data || [])
}

async function createAssignment(supabase: any, userId: string, body: any) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can create assignments', 403)
  if (!userInfo.semester_id) return jsonError('Please set your current semester')

  const { data: newAssignment, error: insertError } = await supabase
    .from('assignments')
    .insert({
      class_group_id: userInfo.class_group_id,
      semester_id: userInfo.semester_id,
      course_id: body.course_id,
      title: body.title,
      description: body.description,
      due_at: body.due_at,
      attachment_urls: body.attachment_urls || [],
      created_by: userId
    })
    .select()
    .single()

  if (insertError) return jsonError(insertError.message, 500)

  // Send notification to connectees
  await sendAssignmentNotification(supabase, userId, 'assignment_created', body.title, newAssignment.id, body.due_at)

  return jsonSuccess(newAssignment, 201)
}

async function updateAssignment(supabase: any, userId: string, assignmentId: string, data: any) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can update assignments', 403)

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (data.course_id) updates.course_id = data.course_id
  if (data.title) updates.title = data.title
  if (data.description !== undefined) updates.description = data.description
  if (data.due_at !== undefined) updates.due_at = data.due_at
  if (data.attachment_urls) updates.attachment_urls = data.attachment_urls

  const { data: updated, error: updateError } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', assignmentId)
    .eq('class_group_id', userInfo.class_group_id)
    .select('title')
    .single()

  if (updateError) return jsonError(updateError.message, 500)

  const changes = []
  if (data.title) changes.push('title')
  if (data.description !== undefined) changes.push('description')
  if (data.due_at !== undefined) changes.push('due date')
  if (data.attachment_urls) changes.push('attachments')
  const changesText = changes.length > 0 ? changes.join(', ') : 'content'

  await sendAssignmentNotification(supabase, userId, 'assignment_updated', updated.title, assignmentId, undefined, changesText)

  return jsonSuccess(updated)
}

async function deleteAssignment(supabase: any, userId: string, assignmentId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonError('Could not get user info')
  if (!userInfo.isCourseRep) return jsonError('Only course reps can delete assignments', 403)

  const { data: assignment } = await supabase
    .from('assignments')
    .select('title')
    .eq('id', assignmentId)
    .eq('class_group_id', userInfo.class_group_id)
    .single()

  const { error: deleteError } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('class_group_id', userInfo.class_group_id)

  if (deleteError) return jsonError(deleteError.message, 500)

  if (assignment) {
    await sendAssignmentNotification(supabase, userId, 'assignment_deleted', assignment.title)
  }

  return jsonSuccess({ deleted: true })
}

async function getAssignmentStats(supabase: any, userId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess({ total: 0, submitted: 0, pending: 0, overdue: 0 })

  // Check connection
  const { data: connection } = await supabase
    .from('connections')
    .select('connection_types')
    .eq('follower_id', userId)
    .single()

  const isConnectedForAssignments = connection?.connection_types?.includes('assignments') || false
  if (!userInfo.isCourseRep && !isConnectedForAssignments) {
    return jsonSuccess({ total: 0, submitted: 0, pending: 0, overdue: 0 })
  }

  let assignmentQuery = supabase
    .from('assignments')
    .select('id, due_at')
    .eq('class_group_id', userInfo.class_group_id)

  if (userInfo.semester_id) assignmentQuery = assignmentQuery.eq('semester_id', userInfo.semester_id)

  const { data: assignments, error: aError } = await assignmentQuery
  if (aError || !assignments) return jsonSuccess({ total: 0, submitted: 0, pending: 0, overdue: 0 })

  const assignmentIds = assignments.map((a: any) => a.id)
  const { data: submissions } = await supabase
    .from('user_assignment_submissions')
    .select('assignment_id, submitted')
    .eq('user_id', userId)
    .in('assignment_id', assignmentIds)

  const submissionMap = new Map<string, boolean>()
  submissions?.forEach((s: any) => submissionMap.set(s.assignment_id, s.submitted))

  const now = new Date()
  const stats = { total: assignments.length, submitted: 0, pending: 0, overdue: 0 }

  assignments.forEach((assignment: any) => {
    const isSubmitted = submissionMap.get(assignment.id) || false
    if (isSubmitted) {
      stats.submitted++
    } else if (assignment.due_at && new Date(assignment.due_at) < now) {
      stats.overdue++
    } else {
      stats.pending++
    }
  })

  return jsonSuccess(stats)
}

async function getUpcomingCount(supabase: any, userId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess(0)

  const now = new Date().toISOString()
  let query = supabase
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('class_group_id', userInfo.class_group_id)
    .gte('due_at', now)

  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)
  const { count } = await query
  return jsonSuccess(count || 0)
}

async function getNextAssignment(supabase: any, userId: string) {
  const userInfo = await getUserClassGroupInfo(supabase, userId)
  if (!userInfo) return jsonSuccess(null)

  const now = new Date().toISOString()
  let query = supabase
    .from('assignments')
    .select(`title, due_at, course:courses!assignments_course_id_fkey(code)`)
    .eq('class_group_id', userInfo.class_group_id)
    .gte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(1)

  if (userInfo.semester_id) query = query.eq('semester_id', userInfo.semester_id)
  const { data, error: fetchError } = await query.single()
  if (fetchError || !data) return jsonSuccess(null)

  const dueDate = new Date(data.due_at)
  const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return jsonSuccess({
    title: data.title,
    courseCode: (data.course as any)?.code || 'Unknown',
    dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysLeft: Math.max(0, diffDays)
  })
}

async function toggleSubmission(supabase: any, userId: string, assignmentId: string, submitted: boolean) {
  const { error: upsertError } = await supabase
    .from('user_assignment_submissions')
    .upsert({
      user_id: userId,
      assignment_id: assignmentId,
      submitted,
      submitted_at: submitted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,assignment_id' })

  if (upsertError) return jsonError(upsertError.message, 500)
  return jsonSuccess({ submitted })
}

async function markAsViewed(supabase: any, userId: string, assignmentId: string) {
  const { error: upsertError } = await supabase
    .from('assignment_views')
    .upsert(
      { user_id: userId, assignment_id: assignmentId, viewed_at: new Date().toISOString() },
      { onConflict: 'user_id,assignment_id' }
    )

  return jsonSuccess(!upsertError)
}

async function getUnreadCount(supabase: any, userId: string) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`class_group_id, current_semester_id, user_roles(role:roles(name))`)
    .eq('id', userId)
    .single()

  if (userError || !userData?.class_group_id) return jsonSuccess(0)

  const userRoles = userData.user_roles as any[] | null
  const isCourseRep = userRoles?.some((ur: any) => ur?.role?.name === 'course_rep') || false

  const { data: connection } = await supabase
    .from('connections')
    .select('connection_types')
    .eq('follower_id', userId)
    .single()

  const isConnectedForAssignments = connection?.connection_types?.includes('assignments') || false
  if (!isCourseRep && !isConnectedForAssignments) return jsonSuccess(0)

  let query = supabase.from('assignments').select('id, created_at').eq('class_group_id', userData.class_group_id)
  if (userData.current_semester_id) query = query.eq('semester_id', userData.current_semester_id)

  const { data: assignments } = await query.order('created_at', { ascending: false })
  if (!assignments) return jsonSuccess(0)

  const { data: views } = await supabase
    .from('assignment_views')
    .select('assignment_id, viewed_at')
    .eq('user_id', userId)

  const viewedMap = new Map((views || []).map((v: any) => [v.assignment_id, true]))
  const unreadCount = assignments.filter((a: any) => !viewedMap.has(a.id)).length
  return jsonSuccess(unreadCount)
}

async function getUnviewedIds(supabase: any, userId: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('class_group_id, current_semester_id')
    .eq('id', userId)
    .single()

  if (!userData?.class_group_id) return jsonSuccess([])

  let query = supabase.from('assignments').select('id, created_at').eq('class_group_id', userData.class_group_id)
  if (userData.current_semester_id) query = query.eq('semester_id', userData.current_semester_id)

  const { data: assignments } = await query
  if (!assignments) return jsonSuccess([])

  const { data: views } = await supabase
    .from('assignment_views')
    .select('assignment_id')
    .eq('user_id', userId)

  const viewedSet = new Set((views || []).map((v: any) => v.assignment_id))
  return jsonSuccess(assignments.filter((a: any) => !viewedSet.has(a.id)).map((a: any) => a.id))
}

// ============ NOTIFICATION HELPER ============
async function sendAssignmentNotification(
  supabase: any,
  hostUserId: string,
  type: string,
  title: string,
  assignmentId?: string,
  dueDate?: string,
  changes?: string
) {
  try {
    const { data: connectees } = await supabase
      .from('connections')
      .select('follower_id, connection_types')
      .eq('following_id', hostUserId)

    if (!connectees?.length) return

    const recipients = connectees
      .filter((c: any) => c.connection_types?.includes('assignments'))
      .map((c: any) => c.follower_id)

    if (recipients.length === 0) return

    let message = ''
    let actionUrl = '/assignment'

    switch (type) {
      case 'assignment_created':
        message = `A new assignment "${title}" has been created${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}`
        break
      case 'assignment_updated':
        message = `"${title}" has been updated${changes ? `: ${changes}` : ''}`
        break
      case 'assignment_deleted':
        message = `"${title}" has been removed`
        break
    }

    const notifications = recipients.map((userId: string) => ({
      user_id: userId,
      type,
      title: type === 'assignment_created' ? 'New Assignment' : type === 'assignment_updated' ? 'Assignment Updated' : 'Assignment Deleted',
      message,
      data: { assignmentId, hostUserId },
      action_url: actionUrl,
      is_read: false,
    }))

    await supabase.from('notifications').insert(notifications)

    // Send push notifications
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .in('user_id', recipients)
      .eq('is_active', true)

    if (tokens?.length) {
      await supabase.functions.invoke('send-notification', {
        body: {
          tokens: tokens.map((t: any) => t.token),
          notification: {
            title: notifications[0].title,
            body: message,
            data: { assignmentId, hostUserId },
            url: actionUrl
          }
        }
      }).catch(() => {})
    }
  } catch (err) {
    console.error('Failed to send notification:', err)
  }
}
