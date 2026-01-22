import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

// GET /api/profile/levels?departmentId=xxx - Get levels for a department
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')

    if (!departmentId) {
      return errorResponse('departmentId is required', 400)
    }

    const { data: levels, error } = await supabase
      .from('levels')
      .select('id, department_id, level_number, name')
      .eq('department_id', departmentId)
      .order('level_number')

    if (error) {
      console.error('Fetch levels error:', error)
      return errorResponse('Failed to fetch levels', 500)
    }

    return jsonResponse({ levels: levels || [] })
  } catch (error) {
    console.error('Levels fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
