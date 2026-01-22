import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return errorResponse(error.message, 400)
    }

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return errorResponse('Logout failed', 500)
  }
}
