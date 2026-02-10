import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// GET /api/carryover
export async function GET() {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { data, error: fetchError } = await supabase!
    .from('user_carryover_courses')
    .select('*')
    .eq('user_id', user!.id)
    .eq('completed', false)
    .order('course_code')

  if (fetchError) return jsonError('Failed to fetch carryover courses', 500)

  return jsonSuccess((data || []).map((course: any) => ({
    id: course.id,
    courseCode: course.course_code,
    courseTitle: course.course_title,
    courseUnit: course.credit_unit,
    category: 'CARRYOVER',
    completed: course.completed,
    completedAt: course.completed_at
  })))
}

// POST /api/carryover - Add carryover course
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()

  const { data: course, error: insertError } = await supabase!
    .from('user_carryover_courses')
    .insert({
      user_id: user!.id,
      course_code: body.course_code.toUpperCase().trim(),
      course_title: body.course_title.trim(),
      credit_unit: body.credit_unit,
      completed: false
    })
    .select()
    .single()

  if (insertError) return jsonError(insertError.message, 500)

  return jsonSuccess({
    id: course.id,
    courseCode: course.course_code,
    courseTitle: course.course_title,
    courseUnit: course.credit_unit,
    category: 'CARRYOVER',
    completed: course.completed,
    completedAt: course.completed_at
  }, 201)
}

// PATCH /api/carryover - Mark as completed
export async function PATCH(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()

  const { error: updateError } = await supabase!
    .from('user_carryover_courses')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', body.courseId)

  if (updateError) return jsonError(updateError.message, 500)
  return jsonSuccess({ completed: true })
}

// DELETE /api/carryover
export async function DELETE(request: NextRequest) {
  const { supabase, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('id')
  if (!courseId) return jsonError('Missing course ID')

  const { error: deleteError } = await supabase!
    .from('user_carryover_courses')
    .delete()
    .eq('id', courseId)

  if (deleteError) return jsonError(deleteError.message, 500)
  return jsonSuccess({ deleted: true })
}
