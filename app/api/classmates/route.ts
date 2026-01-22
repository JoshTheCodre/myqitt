import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/classmates - Get all classmates in user's class group
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return jsonResponse({ classmates: [], count: 0, courseRep: null })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Build query for classmates
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar_url,
        phone_number,
        bio,
        user_roles(role:roles(name)),
        school:schools!users_school_id_fkey(name),
        class_group:class_groups!users_class_group_id_fkey(
          department:departments!class_groups_department_id_fkey(name),
          level:levels!class_groups_level_id_fkey(level_number)
        )
      `)
      .eq('class_group_id', userProfile.class_group_id)

    // Add search filter if provided
    if (search && search.length >= 2) {
      query = query.ilike('name', `%${search}%`)
    }

    query = query.order('name')

    const { data: classmates, error } = await query

    if (error) {
      console.error('Fetch classmates error:', error)
      return errorResponse('Failed to fetch classmates', 500)
    }

    if (!classmates?.length) {
      return jsonResponse({ classmates: [], count: 0, courseRep: null })
    }

    // Transform to response format
    const result = classmates.map(user => {
      const isCourseRep = (user.user_roles as any[])?.some(
        ur => ur.role?.name === 'course_rep'
      ) || false

      return {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        avatar_url: user.avatar_url || undefined,
        phone_number: user.phone_number || undefined,
        bio: user.bio || undefined,
        isCourseRep,
        schoolName: (user.school as any)?.name,
        departmentName: (user.class_group as any)?.department?.name,
        levelNumber: (user.class_group as any)?.level?.level_number
      }
    })

    // Sort: course rep first, then alphabetically by name
    result.sort((a, b) => {
      if (a.isCourseRep && !b.isCourseRep) return -1
      if (!a.isCourseRep && b.isCourseRep) return 1
      return (a.name || '').localeCompare(b.name || '')
    })

    // Find course rep
    const courseRep = result.find(c => c.isCourseRep) || null

    return jsonResponse({
      classmates: result,
      count: result.length,
      courseRep
    })
  } catch (error) {
    console.error('Classmates fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
