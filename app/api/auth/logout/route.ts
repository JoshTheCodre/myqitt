import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  console.log('🚪 [LOGOUT API] Logout request received')
  try {
    const supabase = await createClient()
    
    // Get current user before logout for logging
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('👤 [LOGOUT API] Logging out user:', user.email, '(ID:', user.id + ')')
    } else {
      console.log('⚠️ [LOGOUT API] No active user session found')
    }
    
    // Sign out from Supabase
    console.log('📡 [LOGOUT API] Calling Supabase signOut...')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.log('❌ [LOGOUT API] Supabase signOut error:', error)
    } else {
      console.log('✅ [LOGOUT API] Supabase signOut successful')
    }
    
    // Create response
    const response = NextResponse.json({ success: true })
    
    // Get all possible Supabase cookie names and clear them
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-auth-token'
    ]
    
    console.log('🍪 [LOGOUT API] Clearing cookies:', cookieNames.join(', '))
    
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      // Also try to delete directly
      response.cookies.delete(name)
    })
    
    console.log('✅ [LOGOUT API] Logout completed successfully, all cookies cleared')
    return response
    
  } catch (error: any) {
    console.log('💥 [LOGOUT API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    )
  }
}
