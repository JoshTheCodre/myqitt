import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/classmates/course-rep - Get course rep for user's class group
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return jsonResponse({ courseRep: null })
  }

  try {
    // Find the level rep for this class group
    const { data: levelRep, error } = await supabase
      .from('level_reps')
      .select(`
        user:users!level_reps_user_id_fkey(
          id,
          name,
          email,
          avatar_url,
          phone_number,
          bio
        )
      `)
      .eq('class_group_id', userProfile.class_group_id)
      .eq('is_active', true)
      .single()

    if (error || !levelRep?.user) {
      return jsonResponse({ courseRep: null })
    }

    const user = levelRep.user as any
    return jsonResponse({
      courseRep: {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        avatar_url: user.avatar_url,
        phone_number: user.phone_number,
        bio: user.bio,
        isCourseRep: true
      }
    })
  } catch (error) {
    console.error('Get course rep error:', error)
    return jsonResponse({ courseRep: null })
  }
}
