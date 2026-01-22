import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/profile - Get current user's full profile
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    // Get user profile with all related data
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone_number,
        avatar_url,
        bio,
        school_id,
        class_group_id,
        current_session_id,
        current_semester_id,
        invite_code,
        created_at,
        updated_at,
        school:schools!users_school_id_fkey(id, name, logo_url),
        class_group:class_groups!users_class_group_id_fkey(
          id,
          name,
          department:departments!class_groups_department_id_fkey(id, name),
          level:levels!class_groups_level_id_fkey(id, level_number, name)
        ),
        current_session:sessions!users_current_session_id_fkey(id, name),
        current_semester:semesters!users_current_semester_id_fkey(id, name),
        user_roles(role:roles(id, name))
      `)
      .eq('id', userProfile.id)
      .single()

    if (error) {
      console.error('Fetch profile error:', error)
      return errorResponse('Failed to fetch profile', 500)
    }

    // Get invite code if user is course rep
    let inviteCode = null
    const isCourseRep = (profile.user_roles as any[])?.some(
      ur => ur.role?.name === 'course_rep'
    ) || false

    if (isCourseRep) {
      const { data: levelRep } = await supabase
        .from('level_reps')
        .select('id')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .single()

      if (levelRep) {
        const { data: invite } = await supabase
          .from('level_invites')
          .select('invite_code')
          .eq('level_rep_id', levelRep.id)
          .eq('is_active', true)
          .single()

        inviteCode = invite?.invite_code || null
      }
    }

    return jsonResponse({
      profile: {
        ...profile,
        isCourseRep
      },
      inviteCode
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { name, phone_number, bio, avatar_url, current_session_id, current_semester_id } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updates.name = name
    if (phone_number !== undefined) updates.phone_number = phone_number
    if (bio !== undefined) updates.bio = bio
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (current_session_id !== undefined) updates.current_session_id = current_session_id
    if (current_semester_id !== undefined) updates.current_semester_id = current_semester_id

    const { data: profile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userProfile.id)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return errorResponse('Failed to update profile', 500)
    }

    return jsonResponse({ profile, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update profile error:', error)
    return errorResponse('Internal server error', 500)
  }
}
