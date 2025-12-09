import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 [SESSION API] Session check requested')
  try {
    const supabase = await createClient()
    
    // Get current session
    console.log('📡 [SESSION API] Getting current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ [SESSION API] Session error:', sessionError)
      return NextResponse.json({ user: null, profile: null })
    }
    
    if (!session || !session.user) {
      console.log('ℹ️ [SESSION API] No active session found')
      return NextResponse.json({ user: null, profile: null })
    }

    console.log('✅ [SESSION API] Active session found for user:', session.user.email, '(ID:', session.user.id + ')')

    // Fetch profile for authenticated user
    console.log('👤 [SESSION API] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.log('❌ [SESSION API] Profile fetch error:', profileError)
      return NextResponse.json({ user: session.user, profile: null })
    }

    console.log('✅ [SESSION API] Session check completed for:', profile?.name || session.user.email)

    return NextResponse.json({ 
      user: session.user, 
      profile: profile 
    })
    
  } catch (error: any) {
    console.log('💥 [SESSION API] Unexpected error:', error)
    return NextResponse.json({ user: null, profile: null })
  }
}
