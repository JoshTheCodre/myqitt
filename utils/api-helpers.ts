import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Helper to get authenticated user from the request.
 * Returns the supabase client and user, or an error response.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { supabase, user, error: null }
}

/**
 * Standard JSON success response
 */
export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status })
}

/**
 * Standard JSON error response
 */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
