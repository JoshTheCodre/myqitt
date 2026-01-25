import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api/server'

// PATCH /api/assignments/[id]/submit - Toggle submission status (personal per user)
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

    // Verify assignment exists and belongs to user's class group
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, class_group_id')
      .eq('id', id)
      .eq('class_group_id', userProfile.class_group_id)
      .single()

    if (assignmentError || !assignment) {
      return notFoundResponse('Assignment not found')
    }

    // Upsert user's personal submission status
    const { error: submissionError } = await supabase
      .from('user_assignment_submissions')
      .upsert({
        user_id: userProfile.id,
        assignment_id: id,
        submitted,
        submitted_at: submitted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,assignment_id'
      })

    if (submissionError) {
      console.error('Toggle submission error:', submissionError)
      return errorResponse('Failed to update submission status', 500)
    }

    // Return assignment with user's submission status
    const { data: fullAssignment } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses!assignments_course_id_fkey(id, code, title)
      `)
      .eq('id', id)
      .single()

    return jsonResponse({ 
      assignment: {
        ...fullAssignment,
        submitted,
        submitted_at: submitted ? new Date().toISOString() : null
      }, 
      message: submitted ? 'Marked as submitted!' : 'Marked as not submitted' 
    })
  } catch (error) {
    console.error('Toggle submission error:', error)
    return errorResponse('Internal server error', 500)
  }
}
