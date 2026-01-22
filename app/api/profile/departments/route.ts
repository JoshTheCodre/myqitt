import { NextRequest } from 'next/server'
import { createSupabaseServerClient, jsonResponse, errorResponse } from '@/lib/api/server'

// GET /api/profile/departments?facultyId=xxx or ?schoolId=xxx - Get departments
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')
    const schoolId = searchParams.get('schoolId')

    if (facultyId) {
      // Get departments by faculty
      const { data: departments, error } = await supabase
        .from('departments')
        .select('id, faculty_id, name, code')
        .eq('faculty_id', facultyId)
        .order('name')

      if (error) {
        console.error('Fetch departments error:', error)
        return errorResponse('Failed to fetch departments', 500)
      }

      return jsonResponse({ departments: departments || [] })
    }

    if (schoolId) {
      // Get departments by school (via faculty)
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          id, 
          faculty_id, 
          name, 
          code,
          faculty:faculties!departments_faculty_id_fkey(school_id)
        `)
        .order('name')

      if (error) {
        console.error('Fetch departments error:', error)
        return errorResponse('Failed to fetch departments', 500)
      }

      // Filter by school_id
      const filtered = (departments || []).filter(
        dept => (dept.faculty as any)?.school_id === schoolId
      ).map(dept => ({
        id: dept.id,
        faculty_id: dept.faculty_id,
        name: dept.name,
        code: dept.code
      }))

      return jsonResponse({ departments: filtered })
    }

    return errorResponse('facultyId or schoolId is required', 400)
  } catch (error) {
    console.error('Departments fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}
