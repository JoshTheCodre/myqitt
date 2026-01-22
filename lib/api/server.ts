import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Helper to get authenticated user from request
export async function getAuthenticatedUser(supabase?: SupabaseClient) {
  const client = supabase || await createSupabaseServerClient()
  const { data: { user }, error } = await client.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Helper to get full user profile with related data
export async function getAuthenticatedUserProfile(supabase?: SupabaseClient) {
  const client = supabase || await createSupabaseServerClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await client
    .from('users')
    .select(`
      *,
      school:schools!users_school_id_fkey(id, name),
      class_group:class_groups!users_class_group_id_fkey(
        id, name, school_id, department_id, level_id,
        department:departments!class_groups_department_id_fkey(id, name),
        level:levels!class_groups_level_id_fkey(id, level_number, name)
      ),
      current_session:sessions!users_current_session_id_fkey(id, name),
      current_semester:semesters!users_current_semester_id_fkey(id, name),
      user_roles(role:roles(id, name))
    `)
    .eq('id', user.id)
    .single()

  if (profileError) {
    return null
  }

  return profile
}

// Helper to check if user has a specific role
export function hasRole(profile: { user_roles?: Array<{ role: { name: string } }> } | null, roleName: string): boolean {
  if (!profile?.user_roles) return false
  return profile.user_roles.some(ur => ur.role?.name === roleName)
}

// JSON response helpers
export function jsonResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status })
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 })
}

export function notFoundResponse(message: string = 'Not found') {
  return Response.json({ error: message }, { status: 404 })
}
