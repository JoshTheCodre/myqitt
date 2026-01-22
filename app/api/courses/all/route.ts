import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/courses/all - Get all courses for class group (all semesters)
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    // Get user's class_group to find department
    const { data: profile } = await supabase
      .from('users')
      .select(`
        class_group:class_groups!users_class_group_id_fkey(
          department_id
        )
      `)
      .eq('id', userProfile.id)
      .single()

    const classGroup = profile?.class_group as { department_id: string } | { department_id: string }[] | null
    const departmentId = Array.isArray(classGroup) ? classGroup[0]?.department_id : classGroup?.department_id
    if (!departmentId) {
      return jsonResponse({ courses: [] })
    }

    // Fetch all courses for department
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department_id', departmentId)
      .order('code')

    if (error) {
      console.error('Fetch all courses error:', error)
      return errorResponse('Failed to fetch courses', 500)
    }

    return jsonResponse({ courses: courses || [] })
  } catch (error) {
    console.error('Fetch all courses error:', error)
    return errorResponse('Internal server error', 500)
  }
}
