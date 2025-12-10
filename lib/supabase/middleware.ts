import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip session refresh for logout endpoint to prevent re-authentication
  if (pathname === '/api/auth/logout') {
    console.log('🚪 [MIDDLEWARE] Skipping session refresh for logout endpoint')
    return NextResponse.next()
  }
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Only refresh session if not on logout flow
    console.log('🔄 [MIDDLEWARE] Refreshing session for:', pathname)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('⚠️ [MIDDLEWARE] Session refresh error:', error.message)
    } else if (user) {
      console.log('✅ [MIDDLEWARE] Session refreshed for user:', user.email)
    } else {
      console.log('ℹ️ [MIDDLEWARE] No user session found')
    }
  } catch (error) {
    console.log('❌ [MIDDLEWARE] Session refresh failed:', error)
  }

  return supabaseResponse
}
