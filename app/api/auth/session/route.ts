import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ user: null, profile: null })
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ user, profile })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get session' },
      { status: 500 }
    )
  }
}
