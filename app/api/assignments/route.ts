import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/assignments - Get all assignments for user's class group
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return jsonResponse({ assignments: [], stats: null, isCourseRep: false })
  }

  try {
    // Check if user is course rep
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userProfile.id)

    const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

    // Fetch assignments for user's class group
    let query = supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_at,
        attachment_urls,
        created_at,
        submitted,
        submitted_at,
        course:courses!assignments_course_id_fkey(
          id,
          code,
          title
        )
      `)
      .eq('class_group_id', userProfile.class_group_id)
      .order('due_at', { ascending: true })

    // Filter by semester if user has one set
    if (userProfile.current_semester_id) {
      query = query.eq('semester_id', userProfile.current_semester_id)
    }

    const { data: assignmentsData, error } = await query

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching assignments:', error)
      return errorResponse('Failed to fetch assignments', 500)
    }

    if (!assignmentsData || assignmentsData.length === 0) {
      return jsonResponse({ 
        assignments: [], 
        grouped: [],
        stats: { total: 0, submitted: 0, pending: 0, overdue: 0 },
        isCourseRep 
      })
    }

    // Calculate stats
    const now = new Date()
    const stats = {
      total: assignmentsData.length,
      submitted: assignmentsData.filter(a => a.submitted).length,
      pending: 0,
      overdue: 0
    }

    assignmentsData.forEach(assignment => {
      if (!assignment.submitted) {
        if (assignment.due_at && new Date(assignment.due_at) < now) {
          stats.overdue++
        } else {
          stats.pending++
        }
      }
    })

    // Group assignments by course code
    const groupedAssignments = assignmentsData.reduce((acc, item) => {
      const courseCode = (item.course as any)?.code || 'Unknown'
      const courseTitle = (item.course as any)?.title || ''
      
      const existing = acc.find((a: any) => a.courseCode === courseCode)
      
      const dueDate = item.due_at ? new Date(item.due_at) : null
      const dateLabel = dueDate 
        ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No due date'
      
      const assignmentDate = {
        id: item.id,
        date: item.due_at || '',
        label: dateLabel,
        title: item.title,
        description: item.description || '',
        submissionType: 'PDF Report',
        submitted: item.submitted || false,
        submitted_at: item.submitted_at
      }

      if (existing) {
        existing.dates.push(assignmentDate)
        existing.assignmentCount++
        if (item.submitted) existing.submittedCount++
      } else {
        acc.push({
          courseCode,
          courseTitle,
          assignmentCount: 1,
          submittedCount: item.submitted ? 1 : 0,
          dates: [assignmentDate]
        })
      }

      return acc
    }, [] as any[])

    return jsonResponse({
      assignments: assignmentsData,
      grouped: groupedAssignments,
      stats,
      isCourseRep
    })
  } catch (error) {
    console.error('Assignments fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/assignments - Create new assignment (course rep only)
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
    return errorResponse('Only course reps can create assignments', 403)
  }

  if (!userProfile.current_semester_id) {
    return errorResponse('Please set your current semester before creating assignments', 400)
  }

  try {
    const body = await request.json()
    const { course_id, title, description, due_at, attachment_urls } = body

    if (!course_id || !title) {
      return errorResponse('Course and title are required', 400)
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        class_group_id: userProfile.class_group_id,
        semester_id: userProfile.current_semester_id,
        course_id,
        title,
        description: description || '',
        due_at: due_at || null,
        attachment_urls: attachment_urls || [],
        created_by: userProfile.id
      })
      .select(`
        *,
        course:courses!assignments_course_id_fkey(id, code, title)
      `)
      .single()

    if (error) {
      console.error('Create assignment error:', error)
      return errorResponse('Failed to create assignment', 500)
    }

    return jsonResponse({ assignment, message: 'Assignment created successfully' }, 201)
  } catch (error) {
    console.error('Create assignment error:', error)
    return errorResponse('Internal server error', 500)
  }
}
