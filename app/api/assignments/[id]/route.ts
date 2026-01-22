import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api/server'

// GET /api/assignments/[id] - Get single assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses!assignments_course_id_fkey(id, code, title)
      `)
      .eq('id', id)
      .eq('class_group_id', userProfile.class_group_id)
      .single()

    if (error || !assignment) {
      return notFoundResponse('Assignment not found')
    }

    return jsonResponse({ assignment })
  } catch (error) {
    console.error('Get assignment error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// PUT /api/assignments/[id] - Update assignment (course rep only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return errorResponse('No class group associated with user', 400)
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can update assignments', 403)
  }

  try {
    const body = await request.json()
    const { course_id, title, description, due_at, attachment_urls } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (course_id !== undefined) updates.course_id = course_id
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (due_at !== undefined) updates.due_at = due_at
    if (attachment_urls !== undefined) updates.attachment_urls = attachment_urls

    const { data: assignment, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .eq('class_group_id', userProfile.class_group_id)
      .select(`
        *,
        course:courses!assignments_course_id_fkey(id, code, title)
      `)
      .single()

    if (error) {
      console.error('Update assignment error:', error)
      return errorResponse('Failed to update assignment', 500)
    }

    return jsonResponse({ assignment, message: 'Assignment updated successfully' })
  } catch (error) {
    console.error('Update assignment error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// DELETE /api/assignments/[id] - Delete assignment (course rep only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  if (!userProfile.class_group_id) {
    return errorResponse('No class group associated with user', 400)
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can delete assignments', 403)
  }

  try {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
      .eq('class_group_id', userProfile.class_group_id)

    if (error) {
      console.error('Delete assignment error:', error)
      return errorResponse('Failed to delete assignment', 500)
    }

    return jsonResponse({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return errorResponse('Internal server error', 500)
  }
}
