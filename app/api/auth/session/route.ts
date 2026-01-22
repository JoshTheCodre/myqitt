import { createSupabaseServerClient, jsonResponse } from '@/lib/api/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonResponse(null)
    }

    // Fetch full profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
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
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return jsonResponse({ user, profile: null })
    }

    return jsonResponse({ user, profile })
  } catch (error) {
    console.error('Session error:', error)
    return jsonResponse(null)
  }
}
