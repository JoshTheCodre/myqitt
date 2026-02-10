import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// GET /api/profile - Get profile data (schools, faculties, departments, etc.)
export async function GET(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'schools') return getSchools(supabase!)
  if (action === 'faculties') {
    const schoolId = searchParams.get('schoolId') || ''
    return getFaculties(supabase!, schoolId)
  }
  if (action === 'departments') {
    const facultyId = searchParams.get('facultyId') || ''
    return getDepartments(supabase!, facultyId)
  }
  if (action === 'departments-by-school') {
    const schoolId = searchParams.get('schoolId') || ''
    return getDepartmentsBySchool(supabase!, schoolId)
  }
  if (action === 'levels') {
    const departmentId = searchParams.get('departmentId') || ''
    return getLevels(supabase!, departmentId)
  }
  if (action === 'sessions') {
    const schoolId = searchParams.get('schoolId') || ''
    return getSessions(supabase!, schoolId)
  }
  if (action === 'semesters') {
    const schoolId = searchParams.get('schoolId') || ''
    return getSemesters(supabase!, schoolId)
  }
  if (action === 'course-rep') {
    const userId = searchParams.get('userId') || ''
    return getCourseRepForDepartment(supabase!, userId)
  }
  if (action === 'invite-code') {
    const userId = searchParams.get('userId') || ''
    return getInviteCode(supabase!, userId)
  }
  if (action === 'school-name') {
    const schoolId = searchParams.get('schoolId') || ''
    return getSchoolName(supabase!, schoolId)
  }

  return jsonError('Unknown action')
}

// PATCH /api/profile - Update profile
export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()

  if (body.action === 'upload-avatar') {
    return jsonError('Use client-side upload for avatar', 400)
  }

  const { error: updateError } = await supabase!
    .from('users')
    .update({ ...body.updates, updated_at: new Date().toISOString() })
    .eq('id', user!.id)

  if (updateError) return jsonError(updateError.message, 500)
  return jsonSuccess({ updated: true })
}

// ============ HANDLERS ============

async function getSchools(supabase: any) {
  const { data, error: fetchError } = await supabase
    .from('schools')
    .select('id, name, logo_url')
    .order('name')

  if (fetchError) return jsonError('Failed to load schools', 500)
  return jsonSuccess(data || [])
}

async function getFaculties(supabase: any, schoolId: string) {
  const { data, error: fetchError } = await supabase
    .from('faculties')
    .select('id, school_id, name, code')
    .eq('school_id', schoolId)
    .order('name')

  if (fetchError) return jsonError('Failed to load faculties', 500)
  return jsonSuccess(data || [])
}

async function getDepartments(supabase: any, facultyId: string) {
  const { data, error: fetchError } = await supabase
    .from('departments')
    .select('id, faculty_id, name, code')
    .eq('faculty_id', facultyId)
    .order('name')

  if (fetchError) return jsonError('Failed to load departments', 500)
  return jsonSuccess(data || [])
}

async function getDepartmentsBySchool(supabase: any, schoolId: string) {
  const { data, error: fetchError } = await supabase
    .from('departments')
    .select(`id, faculty_id, name, code, faculty:faculties!departments_faculty_id_fkey(school_id)`)
    .order('name')

  if (fetchError) return jsonError('Failed to load departments', 500)

  const filtered = (data || []).filter((dept: any) => dept.faculty?.school_id === schoolId)
  return jsonSuccess(filtered)
}

async function getLevels(supabase: any, departmentId: string) {
  const { data, error: fetchError } = await supabase
    .from('levels')
    .select('id, department_id, level_number, name')
    .eq('department_id', departmentId)
    .order('level_number')

  if (fetchError) return jsonError('Failed to load levels', 500)
  return jsonSuccess(data || [])
}

async function getSessions(supabase: any, schoolId: string) {
  const { data, error: fetchError } = await supabase
    .from('sessions')
    .select('id, school_id, name, is_active')
    .eq('school_id', schoolId)
    .order('name', { ascending: false })

  if (fetchError) return jsonError('Failed to load sessions', 500)
  return jsonSuccess(data || [])
}

async function getSemesters(supabase: any, schoolId: string) {
  const { data, error: fetchError } = await supabase
    .from('semesters')
    .select('id, school_id, name')
    .eq('school_id', schoolId)
    .order('name')

  if (fetchError) return jsonError('Failed to load semesters', 500)
  return jsonSuccess(data || [])
}

async function getCourseRepForDepartment(supabase: any, userId: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('class_group_id')
    .eq('id', userId)
    .single()

  if (!userData?.class_group_id) return jsonSuccess(null)

  const { data: levelRep } = await supabase
    .from('level_reps')
    .select(`user:users!level_reps_user_id_fkey(id, name, email, phone_number)`)
    .eq('class_group_id', userData.class_group_id)
    .eq('is_active', true)
    .single()

  if (!levelRep?.user) return jsonSuccess(null)

  const u = levelRep.user as any
  return jsonSuccess({ id: u.id, name: u.name || 'Unknown', email: u.email, phone_number: u.phone_number })
}

async function getInviteCode(supabase: any, userId: string) {
  const { data: levelRep } = await supabase
    .from('level_reps')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (!levelRep) return jsonSuccess(null)

  const { data: invite } = await supabase
    .from('level_invites')
    .select('invite_code')
    .eq('level_rep_id', levelRep.id)
    .eq('is_active', true)
    .single()

  return jsonSuccess(invite?.invite_code || null)
}

async function getSchoolName(supabase: any, schoolId: string) {
  const { data } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single()

  return jsonSuccess(data?.name || 'Unknown School')
}
