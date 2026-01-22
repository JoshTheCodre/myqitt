import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      phone_number,
      school_id,
      department_id,
      level_number,
      session_id,
      semester_id
    } = body

    if (!email || !password || !name || !school_id || !department_id || !level_number) {
      return errorResponse('Missing required fields')
    }

    const supabase = await createSupabaseServerClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return errorResponse(authError.message, 400)
    }

    if (!authData.user) {
      return errorResponse('User creation failed', 400)
    }

    // 1. First check if level exists for this department
    let levelId: string | null = null
    const { data: existingLevel } = await supabase
      .from('levels')
      .select('id')
      .eq('department_id', department_id)
      .eq('level_number', level_number)
      .single()

    if (existingLevel) {
      levelId = existingLevel.id
    } else {
      // Create level
      const { data: newLevel, error: levelError } = await supabase
        .from('levels')
        .insert({
          department_id: department_id,
          level_number: level_number,
          name: `${level_number * 100} Level`
        })
        .select()
        .single()

      if (levelError) {
        return errorResponse('Failed to create level', 500)
      }
      levelId = newLevel.id
    }

    // 2. Check if class_group exists or create one
    let classGroupId: string | null = null
    const { data: existingClassGroup } = await supabase
      .from('class_groups')
      .select('id')
      .eq('school_id', school_id)
      .eq('department_id', department_id)
      .eq('level_id', levelId)
      .single()

    if (existingClassGroup) {
      classGroupId = existingClassGroup.id
    } else {
      const { data: newClassGroup, error: cgError } = await supabase
        .from('class_groups')
        .insert({
          school_id: school_id,
          department_id: department_id,
          level_id: levelId,
          name: `${level_number * 100} Level`
        })
        .select()
        .single()

      if (cgError) {
        return errorResponse('Failed to create class group', 500)
      }
      classGroupId = newClassGroup.id
    }

    // 3. Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // 4. Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name: name || '',
        phone_number: phone_number || null,
        school_id: school_id,
        class_group_id: classGroupId,
        current_session_id: session_id || null,
        current_semester_id: semester_id || null,
        invite_code: inviteCode,
      })
      .select()
      .single()

    if (profileError) {
      return errorResponse('Failed to create user profile', 500)
    }

    // 5. Get role IDs and assign roles
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', ['student', 'course_rep'])

    if (roles) {
      const roleInserts = roles.map(role => ({
        user_id: authData.user!.id,
        role_id: role.id
      }))
      await supabase.from('user_roles').insert(roleInserts)
    }

    // 6. Create level_rep entry
    const { data: levelRep, error: levelRepError } = await supabase
      .from('level_reps')
      .insert({
        user_id: authData.user.id,
        class_group_id: classGroupId,
        is_active: true
      })
      .select()
      .single()

    if (levelRepError) {
      return errorResponse('Failed to create level rep record', 500)
    }

    // 7. Create level_invite entry
    await supabase
      .from('level_invites')
      .insert({
        level_rep_id: levelRep.id,
        class_group_id: classGroupId,
        invite_code: inviteCode,
        is_active: true
      })

    return jsonResponse({
      user: authData.user,
      profile,
      inviteCode,
    })
  } catch (error) {
    console.error('Course rep registration error:', error)
    return errorResponse('Registration failed', 500)
  }
}
