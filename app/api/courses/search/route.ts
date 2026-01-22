import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/courses/search - Search courses by code or title
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return jsonResponse({ courses: [] })
    }

    // Get user's department
    const { data: profile } = await supabase
      .from('users')
      .select(`
        class_group:class_groups!users_class_group_id_fkey(
          department_id
        )
      `)
      .eq('id', userProfile.id)
      .single()

    const classGroupData = profile?.class_group as { department_id: string } | { department_id: string }[] | null
    const classGroup = Array.isArray(classGroupData) ? classGroupData[0] : classGroupData
    if (!classGroup?.department_id) {
      return jsonResponse({ courses: [] })
    }

    // Search courses
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, code, title, credit_unit, is_compulsory')
      .eq('department_id', classGroup.department_id)
      .or(`code.ilike.%${query}%,title.ilike.%${query}%`)
      .order('code')
      .limit(20)

    if (error) {
      console.error('Search courses error:', error)
      return errorResponse('Failed to search courses', 500)
    }

    return jsonResponse({
      courses: courses?.map(course => ({
        id: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        courseUnit: course.credit_unit,
        category: course.is_compulsory ? 'COMPULSORY' : 'ELECTIVE'
      })) || []
    })
  } catch (error) {
    console.error('Search courses error:', error)
    return errorResponse('Internal server error', 500)
  }
}
