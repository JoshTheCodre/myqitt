import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log('🔐 [LOGIN API] Login attempt for email:', email)

    if (!email || !password) {
      console.log('❌ [LOGIN API] Missing credentials')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    console.log('📡 [LOGIN API] Attempting Supabase auth...')

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.log('❌ [LOGIN API] Supabase auth failed:', authError.message)
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      console.log('❌ [LOGIN API] No user returned from Supabase')
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      )
    }

    console.log('✅ [LOGIN API] Supabase auth successful for user:', authData.user.id)

    // Fetch profile
    console.log('👤 [LOGIN API] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('❌ [LOGIN API] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    console.log('✅ [LOGIN API] Login completed successfully for:', profile?.name || authData.user.email)

    return NextResponse.json({
      user: authData.user,
      profile: profile,
      success: true
    })
  } catch (error: any) {
    console.log('💥 [LOGIN API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
