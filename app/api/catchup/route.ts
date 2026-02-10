import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// GET /api/catchup
export async function GET(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const schoolId = searchParams.get('schoolId') || undefined
  const departmentId = searchParams.get('departmentId') || undefined
  const levelNumber = searchParams.get('levelNumber') ? parseInt(searchParams.get('levelNumber')!) : undefined
  const classGroupId = searchParams.get('classGroupId') || undefined

  const { data, error: fetchError } = await supabase!
    .from('catchups')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })

  if (fetchError) return jsonError('Failed to fetch catch-up items', 500)
  if (!data || data.length === 0) return jsonSuccess([])

  // Filter based on targeting
  const filtered = data.filter((item: any) => {
    const targets = item.targets
    if (targets.global) return true

    const matchesSchool = targets.schools.length === 0 || (schoolId && targets.schools.includes(schoolId))
    const matchesDepartment = targets.departments.length === 0 || (departmentId && targets.departments.includes(departmentId))
    const matchesLevel = targets.levels.length === 0 || (levelNumber && targets.levels.includes(levelNumber))
    const matchesClassGroup = !targets.class_groups?.length || (classGroupId && targets.class_groups.includes(classGroupId))

    return matchesSchool && matchesDepartment && matchesLevel && matchesClassGroup
  })

  return jsonSuccess(filtered)
}
