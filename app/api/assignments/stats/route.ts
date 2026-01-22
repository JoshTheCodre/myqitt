import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/assignments/stats - Get assignment statistics
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return jsonResponse({ 
      stats: { total: 0, submitted: 0, pending: 0, overdue: 0 },
      nextAssignment: null,
      upcomingCount: 0
    })
  }

  try {
    // Get all assignments
    let query = supabase
      .from('assignments')
      .select('id, due_at, submitted')
      .eq('class_group_id', userProfile.class_group_id)

    if (userProfile.current_semester_id) {
      query = query.eq('semester_id', userProfile.current_semester_id)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Stats fetch error:', error)
      return errorResponse('Failed to fetch stats', 500)
    }

    const now = new Date()
    const stats = {
      total: assignments?.length || 0,
      submitted: assignments?.filter(a => a.submitted).length || 0,
      pending: 0,
      overdue: 0
    }

    let upcomingCount = 0

    assignments?.forEach(assignment => {
      if (!assignment.submitted) {
        if (assignment.due_at && new Date(assignment.due_at) < now) {
          stats.overdue++
        } else {
          stats.pending++
        }
      }
      // Count upcoming (due in the future)
      if (assignment.due_at && new Date(assignment.due_at) >= now) {
        upcomingCount++
      }
    })

    // Get next assignment due
    let nextAssignment = null
    let nextQuery = supabase
      .from('assignments')
      .select(`
        title,
        due_at,
        course:courses!assignments_course_id_fkey(code)
      `)
      .eq('class_group_id', userProfile.class_group_id)
      .gte('due_at', now.toISOString())
      .order('due_at', { ascending: true })
      .limit(1)

    if (userProfile.current_semester_id) {
      nextQuery = nextQuery.eq('semester_id', userProfile.current_semester_id)
    }

    const { data: nextData } = await nextQuery.single()

    if (nextData?.due_at) {
      const dueDate = new Date(nextData.due_at)
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      nextAssignment = {
        title: nextData.title,
        courseCode: (nextData.course as any)?.code || 'Unknown',
        dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        daysLeft: Math.max(0, diffDays)
      }
    }

    return jsonResponse({ stats, nextAssignment, upcomingCount })
  } catch (error) {
    console.error('Stats error:', error)
    return errorResponse('Internal server error', 500)
  }
}
