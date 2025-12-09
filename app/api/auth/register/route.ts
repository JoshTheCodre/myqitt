import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, userData } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      )
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name: userData.name || '',
        phone_number: userData.phone_number,
        school: userData.school,
        department: userData.department,
        level: userData.level,
        semester: userData.semester,
        bio: userData.bio,
      })

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    const profile = {
      id: authData.user.id,
      email,
      name: userData.name || '',
      phone_number: userData.phone_number,
      school: userData.school,
      department: userData.department,
      level: userData.level,
      semester: userData.semester,
    }

    return NextResponse.json({
      user: authData.user,
      profile,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
