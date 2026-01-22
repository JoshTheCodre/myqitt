import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password } = body

    if (!password) {
      return errorResponse('Password is required')
    }

    if (!email && !phone) {
      return errorResponse('Email or phone is required')
    }

    const supabase = await createSupabaseServerClient()

    let authResult

    if (email) {
      // Email login
      authResult = await supabase.auth.signInWithPassword({
        email,
        password,
      })
    } else {
      // Phone login - find user by phone first
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('phone_number', phone)
        .single()

      if (!userData?.email) {
        return errorResponse('No account found with this phone number', 404)
      }

      authResult = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })
    }

    if (authResult.error) {
      return errorResponse(authResult.error.message, 401)
    }

    if (!authResult.data.user) {
      return errorResponse('Login failed', 401)
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
      .eq('id', authResult.data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    return jsonResponse({
      user: authResult.data.user,
      profile: profile || null,
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Login failed', 500)
  }
}
