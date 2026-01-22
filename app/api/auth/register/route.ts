import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone_number } = body

    if (!email || !password || !name) {
      return errorResponse('Email, password, and name are required')
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

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone_number: phone_number || null,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return errorResponse('Failed to create user profile', 500)
    }

    // Assign student role
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'student')
      .single()

    if (studentRole) {
      await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role_id: studentRole.id })
    }

    return jsonResponse({
      user: authData.user,
      profile,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return errorResponse('Registration failed', 500)
  }
}
