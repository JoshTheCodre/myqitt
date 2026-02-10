import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// Helper: get user class group info
async function getUserClassGroupInfo(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      class_group_id, current_semester_id, school_id,
      class_groups!inner(department_id),
      user_roles(role:roles(name))
    `)
    .eq('id', userId)
    .single()

  if (error || !data || !data.class_group_id) return null

  const userRoles = data.user_roles as any[] | null
  const isCourseRep = userRoles?.some((ur: any) => ur?.role?.name === 'course_rep') || false
  const classGroups = data.class_groups as any

  return {
    class_group_id: data.class_group_id,
    semester_id: data.current_semester_id || undefined,
    school_id: data.school_id || undefined,
    department_id: classGroups?.department_id || undefined,
    isCourseRep
  }
}

// GET /api/courses
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'search') {
    const term = searchParams.get('term') || ''
    const departmentId = searchParams.get('departmentId') || ''
    return searchCourses(supabase!, term, departmentId)
  }

  if (action === 'by-code') {
    const code = searchParams.get('code') || ''
    return getCourseIdByCode(supabase!, user!.id, code)
  }

  if (action === 'all-for-class-group') {
    const classGroupId = searchParams.get('classGroupId') || ''
    return getAllCoursesForClassGroup(supabase!, classGroupId)
  }

  // Default: get courses for current user
  return getCoursesForUser(supabase!, user!.id)
}

// PATCH /api/courses - Update course outline
export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  return updateCourseOutline(supabase!, user!.id, body.courseCode, body.outline)
}

// ============ HANDLERS ============

async function getCoursesForUser(supabase: any, userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(`
      id, current_semester_id,
      class_group:class_groups!users_class_group_id_fkey(id, department_id, level_id)
    `)
    .eq('id', userId)
    .single()

  if (profileError || !profile) return jsonSuccess({ compulsory: [], elective: [] })

  const classGroupData = profile.class_group
  const classGroup = Array.isArray(classGroupData) ? classGroupData[0] : classGroupData
  if (!classGroup?.department_id || !profile.current_semester_id) {
    return jsonSuccess({ compulsory: [], elective: [] })
  }

  let query = supabase
    .from('courses')
    .select('*')
    .eq('department_id', classGroup.department_id)
    .eq('semester_id', profile.current_semester_id)

  if (classGroup.level_id) query = query.eq('level_id', classGroup.level_id)

  const { data: courses, error: fetchError } = await query.order('code')
  if (fetchError || !courses) return jsonSuccess({ compulsory: [], elective: [] })

  const compulsory = courses.filter((c: any) => c.is_compulsory).map((c: any) => ({
    courseCode: c.code, courseTitle: c.title, courseUnit: c.credit_unit, category: 'COMPULSORY'
  }))
  const elective = courses.filter((c: any) => !c.is_compulsory).map((c: any) => ({
    courseCode: c.code, courseTitle: c.title, courseUnit: c.credit_unit, category: 'ELECTIVE'
  }))

  return jsonSuccess({ compulsory, elective })
}

async function searchCourses(supabase: any, searchTerm: string, departmentId: string) {
  if (!searchTerm.trim()) return jsonSuccess([])

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('department_id', departmentId)
    .or(`code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
    .order('code')
    .limit(20)

  return jsonSuccess((courses || []).map((c: any) => ({
    courseCode: c.code, courseTitle: c.title, courseUnit: c.credit_unit,
    category: c.is_compulsory ? 'COMPULSORY' : 'ELECTIVE'
  })))
}

async function getCourseIdByCode(supabase: any, userId: string, courseCode: string) {
  const { data: profile } = await supabase
    .from('users')
    .select(`current_semester_id, class_group:class_groups!users_class_group_id_fkey(department_id)`)
    .eq('id', userId)
    .single()

  if (!profile) return jsonSuccess(null)

  const classGroup = Array.isArray(profile.class_group) ? profile.class_group[0] : profile.class_group
  if (!classGroup?.department_id) return jsonSuccess(null)

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('code', courseCode)
    .eq('department_id', classGroup.department_id)
    .single()

  return jsonSuccess(course?.id || null)
}

async function getAllCoursesForClassGroup(supabase: any, classGroupId: string) {
  const { data: classGroup } = await supabase
    .from('class_groups')
    .select('department_id')
    .eq('id', classGroupId)
    .single()

  if (!classGroup) return jsonSuccess([])

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('department_id', classGroup.department_id)
    .order('code')

  return jsonSuccess(courses || [])
}

async function updateCourseOutline(supabase: any, userId: string, courseCode: string, outline: string) {
  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('id, code, title')
    .eq('code', courseCode)
    .single()

  if (fetchError || !course) return jsonError('Course not found', 404)

  const { error: updateError } = await supabase
    .from('courses')
    .update({ description: outline })
    .eq('code', courseCode)

  if (updateError) return jsonError(updateError.message, 500)

  // Send notification
  try {
    const { data: connectees } = await supabase
      .from('connections')
      .select('follower_id, connection_types')
      .eq('following_id', userId)

    const recipients = (connectees || [])
      .filter((c: any) => c.connection_types?.includes('course_outline'))
      .map((c: any) => c.follower_id)

    if (recipients.length > 0) {
      const notifications = recipients.map((uid: string) => ({
        user_id: uid,
        type: 'course_outline_updated',
        title: 'Course Outline Updated',
        message: `${course.code} - ${course.title} outline has been updated`,
        data: { hostUserId: userId, courseCode: course.code },
        action_url: `/courses/detail?code=${encodeURIComponent(course.code)}&title=${encodeURIComponent(course.title)}`,
        is_read: false,
      }))
      await supabase.from('notifications').insert(notifications)
    }
  } catch {}

  return jsonSuccess({ success: true, courseTitle: course.title })
}
