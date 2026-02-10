import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// GET /api/classmates
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'count') return getClassmatesCount(supabase!, user!.id)
  if (action === 'course-rep') return getCourseRep(supabase!, user!.id)
  if (action === 'search') {
    const term = searchParams.get('term') || ''
    return searchClassmates(supabase!, user!.id, term)
  }

  return getClassmates(supabase!, user!.id)
}

// ============ HANDLERS ============

async function getClassmates(supabase: any, userId: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('class_group_id')
    .eq('id', userId)
    .single()

  if (!userData?.class_group_id) return jsonSuccess([])

  const { data: classmates, error: fetchError } = await supabase
    .from('users')
    .select(`
      id, name, email, avatar_url, phone_number, bio,
      user_roles(role:roles(name), verified),
      school:schools!users_school_id_fkey(name),
      class_group:class_groups!users_class_group_id_fkey(
        department:departments!class_groups_department_id_fkey(name),
        level:levels!class_groups_level_id_fkey(level_number)
      )
    `)
    .eq('class_group_id', userData.class_group_id)
    .order('name')

  if (fetchError) return jsonError('Failed to fetch classmates', 500)

  const result = (classmates || []).map((user: any) => {
    const courseRepRole = user.user_roles?.find((ur: any) => ur.role?.name === 'course_rep')
    const isCourseRep = !!courseRepRole
    const isVerifiedCourseRep = isCourseRep && courseRepRole?.verified === true

    return {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      avatar_url: user.avatar_url || undefined,
      phone_number: user.phone_number || undefined,
      bio: user.bio || undefined,
      isCourseRep,
      isVerifiedCourseRep,
      schoolName: user.school?.name,
      departmentName: user.class_group?.department?.name,
      levelNumber: user.class_group?.level?.level_number
    }
  })

  result.sort((a: any, b: any) => {
    if (a.isVerifiedCourseRep && !b.isVerifiedCourseRep) return -1
    if (!a.isVerifiedCourseRep && b.isVerifiedCourseRep) return 1
    return (a.name || '').localeCompare(b.name || '')
  })

  return jsonSuccess(result)
}

async function getClassmatesCount(supabase: any, userId: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('class_group_id')
    .eq('id', userId)
    .single()

  if (!userData?.class_group_id) return jsonSuccess(0)

  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('class_group_id', userData.class_group_id)

  return jsonSuccess(count || 0)
}

async function getCourseRep(supabase: any, userId: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('class_group_id')
    .eq('id', userId)
    .single()

  if (!userData?.class_group_id) return jsonSuccess(null)

  const { data: levelRep } = await supabase
    .from('level_reps')
    .select(`user:users!level_reps_user_id_fkey(id, name, email, avatar_url, phone_number, bio)`)
    .eq('class_group_id', userData.class_group_id)
    .eq('is_active', true)
    .single()

  if (!levelRep?.user) return jsonSuccess(null)

  const u = levelRep.user as any
  return jsonSuccess({
    id: u.id,
    name: u.name || 'Unknown',
    email: u.email,
    avatar_url: u.avatar_url,
    phone_number: u.phone_number,
    bio: u.bio,
    isCourseRep: true,
    isVerifiedCourseRep: true
  })
}

async function searchClassmates(supabase: any, userId: string, term: string) {
  const { data: userData } = await supabase
    .from('users')
    .select('class_group_id')
    .eq('id', userId)
    .single()

  if (!userData?.class_group_id) return jsonSuccess([])

  const { data: classmates } = await supabase
    .from('users')
    .select(`id, name, email, avatar_url, phone_number, bio, user_roles(role:roles(name), verified)`)
    .eq('class_group_id', userData.class_group_id)
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(20)

  return jsonSuccess((classmates || []).map((user: any) => {
    const courseRepRole = user.user_roles?.find((ur: any) => ur.role?.name === 'course_rep')
    return {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      avatar_url: user.avatar_url || undefined,
      phone_number: user.phone_number || undefined,
      bio: user.bio || undefined,
      isCourseRep: !!courseRepRole,
      isVerifiedCourseRep: !!courseRepRole && courseRepRole?.verified === true
    }
  }))
}
