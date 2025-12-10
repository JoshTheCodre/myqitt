import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🔍 [SESSION API] Session check requested')
  try {
    const supabase = await createClient()
    
    // First verify the session is still valid
    console.log('📡 [SESSION API] Verifying current session...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ [SESSION API] User verification error:', userError.message)
      return NextResponse.json({ user: null, profile: null })
    }
    
    if (!user) {
      console.log('ℹ️ [SESSION API] No authenticated user found')
      return NextResponse.json({ user: null, profile: null })
    }

    // Double-check with session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('⚠️ [SESSION API] Session validation failed, clearing user')
      return NextResponse.json({ user: null, profile: null })
    }

    console.log('✅ [SESSION API] Valid session confirmed for user:', user.email, '(ID:', user.id + ')')

    // Fetch profile for authenticated user
    console.log('👤 [SESSION API] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('❌ [SESSION API] Profile fetch error:', profileError.message)
      // Still return user even if profile fails
      return NextResponse.json({ user: user, profile: null })
    }

    console.log('✅ [SESSION API] Session check completed for:', profile?.name || user.email)

    return NextResponse.json({ 
      user: user, 
      profile: profile 
    })
    
  } catch (error: any) {
    console.log('💥 [SESSION API] Unexpected error:', error)
    return NextResponse.json({ user: null, profile: null })
  }
}
