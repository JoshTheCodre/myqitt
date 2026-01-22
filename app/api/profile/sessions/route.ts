import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

// GET /api/profile/sessions?schoolId=xxx - Get sessions for a school
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return errorResponse('schoolId is required', 400)
    }

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, school_id, name, is_active')
      .eq('school_id', schoolId)
      .order('name', { ascending: false })

    if (error) {
      console.error('Fetch sessions error:', error)
      return errorResponse('Failed to fetch sessions', 500)
    }

    return jsonResponse({ sessions: sessions || [] })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
