import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

// GET /api/profile/schools - Get all schools
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, logo_url')
      .order('name')

    if (error) {
      console.error('Fetch schools error:', error)
      return errorResponse('Failed to fetch schools', 500)
    }

    return jsonResponse({ schools: schools || [] })
  } catch (error) {
    console.error('Schools fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
