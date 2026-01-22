import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api/server'

// PATCH /api/assignments/[id]/submit - Toggle submission status
export async function PATCH(
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
    const body = await request.json()
    const { submitted } = body

    if (typeof submitted !== 'boolean') {
      return errorResponse('submitted must be a boolean', 400)
    }

    const updates = {
      submitted,
      submitted_at: submitted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }

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
      console.error('Toggle submission error:', error)
      return errorResponse('Failed to update submission status', 500)
    }

    if (!assignment) {
      return notFoundResponse('Assignment not found')
    }

    return jsonResponse({ 
      assignment, 
      message: submitted ? 'Marked as submitted!' : 'Marked as not submitted' 
    })
  } catch (error) {
    console.error('Toggle submission error:', error)
    return errorResponse('Internal server error', 500)
  }
}
