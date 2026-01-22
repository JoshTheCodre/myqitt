import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

// GET /api/profile/semesters?schoolId=xxx - Get semesters for a school
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return errorResponse('schoolId is required', 400)
    }

    const { data: semesters, error } = await supabase
      .from('semesters')
      .select('id, school_id, name')
      .eq('school_id', schoolId)
      .order('name')

    if (error) {
      console.error('Fetch semesters error:', error)
      return errorResponse('Failed to fetch semesters', 500)
    }

    return jsonResponse({ semesters: semesters || [] })
  } catch (error) {
    console.error('Semesters fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
