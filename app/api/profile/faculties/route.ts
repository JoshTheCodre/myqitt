import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

// GET /api/profile/faculties?schoolId=xxx - Get faculties for a school
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return errorResponse('schoolId is required', 400)
    }

    const { data: faculties, error } = await supabase
      .from('faculties')
      .select('id, school_id, name, code')
      .eq('school_id', schoolId)
      .order('name')

    if (error) {
      console.error('Fetch faculties error:', error)
      return errorResponse('Failed to fetch faculties', 500)
    }

    return jsonResponse({ faculties: faculties || [] })
  } catch (error) {
    console.error('Faculties fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
