import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
    
    // Sign out from Supabase with scope 'local' to clear cookies properly
    console.log('📡 [LOGOUT API] Calling Supabase signOut with local scope...')
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    
    if (error) {
      console.log('❌ [LOGOUT API] Supabase signOut error:', error)
    } else {
      console.log('✅ [LOGOUT API] Supabase signOut successful')
    }
    
    // Create response with proper cookie clearing
    const response = NextResponse.json({ success: true })
    
    // Get all Supabase cookie patterns (including encoded ones)
    const cookiePatterns = [
      // Standard Supabase cookies
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'sb-auth-token',
      // URL encoded versions
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}-auth-token`,
      // Auth cookies with project reference
      'supabase.auth.token',
      'sb-localhost-auth-token'
    ]
    
    console.log('🍪 [LOGOUT API] Clearing all Supabase cookies...')
    
    // Clear cookies with multiple strategies
    cookiePatterns.forEach(name => {
      // Method 1: Set expired cookie
      response.cookies.set(name, '', {
        expires: new Date(0),
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      // Method 2: Direct deletion
      response.cookies.delete(name)
      
      // Method 3: Set with different paths
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })
    
    // Also clear any cookies from the request headers by parsing them
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';')
      cookies.forEach(cookie => {
        const [name] = cookie.trim().split('=')
        if (name && (name.includes('sb-') || name.includes('supabase'))) {
          console.log('🍪 [LOGOUT API] Found and clearing cookie:', name)
          response.cookies.set(name, '', {
            expires: new Date(0),
            maxAge: 0,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
        }
      })
    }
    
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
