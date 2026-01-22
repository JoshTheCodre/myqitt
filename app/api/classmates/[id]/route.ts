import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api/server'

// GET /api/classmates/[id] - Get single classmate profile
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
    const { data: classmate, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar_url,
        phone_number,
        bio,
        class_group_id,
        user_roles(role:roles(name)),
        school:schools!users_school_id_fkey(name),
        class_group:class_groups!users_class_group_id_fkey(
          department:departments!class_groups_department_id_fkey(name),
          level:levels!class_groups_level_id_fkey(level_number)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !classmate) {
      return notFoundResponse('Classmate not found')
    }

    // Verify they're in the same class group
    if (classmate.class_group_id !== userProfile.class_group_id) {
      return errorResponse('Access denied', 403)
    }

    const isCourseRep = (classmate.user_roles as any[])?.some(
      ur => ur.role?.name === 'course_rep'
    ) || false

    return jsonResponse({
      classmate: {
        id: classmate.id,
        name: classmate.name || 'Unknown',
        email: classmate.email,
        avatar_url: classmate.avatar_url || undefined,
        phone_number: classmate.phone_number || undefined,
        bio: classmate.bio || undefined,
        isCourseRep,
        schoolName: (classmate.school as any)?.name,
        departmentName: (classmate.class_group as any)?.department?.name,
        levelNumber: (classmate.class_group as any)?.level?.level_number
      }
    })
  } catch (error) {
    console.error('Get classmate error:', error)
    return errorResponse('Internal server error', 500)
  }
}
