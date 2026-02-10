import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// Profile select query - matches authStore
const PROFILE_SELECT_QUERY = `
  *,
  school:schools!users_school_id_fkey(id, name),
  class_group:class_groups!users_class_group_id_fkey(
    id, name, school_id, department_id, level_id,
    department:departments!class_groups_department_id_fkey(id, name),
    level:levels!class_groups_level_id_fkey(id, level_number, name)
  ),
  current_session:sessions!users_current_session_id_fkey(id, name),
  current_semester:semesters!users_current_semester_id_fkey(id, name),
  user_roles(role:roles(id, name))
`

// GET /api/auth/profile - Get current user profile
export async function GET() {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { data: profile, error: profileError } = await supabase!
    .from('users')
    .select(PROFILE_SELECT_QUERY)
    .eq('id', user!.id)
    .single()

  if (profileError) {
    return jsonError('Failed to fetch profile', 500)
  }

  return jsonSuccess({ user, profile })
}

// PATCH /api/auth/profile - Update user profile
export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()

  const { data: updatedProfile, error: updateError } = await supabase!
    .from('users')
    .update(body)
    .eq('id', user!.id)
    .select(PROFILE_SELECT_QUERY)
    .single()

  if (updateError) {
    return jsonError(updateError.message || 'Failed to update profile', 500)
  }

  return jsonSuccess(updatedProfile)
}
