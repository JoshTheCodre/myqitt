import { NextRequest } from 'next/server'
import { createSupabaseServerClient, getAuthenticatedUserProfile, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api/server'

// GET /api/courses - Get courses for user's department and semester
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  try {
    // Get user profile with class_group info
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        current_semester_id,
        class_group:class_groups!users_class_group_id_fkey(
          id,
          department_id
        )
      `)
      .eq('id', userProfile.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return jsonResponse({ 
        courses: [], 
        grouped: { compulsory: [], elective: [] },
        totalCredits: 0 
      })
    }

    const classGroupData = profile.class_group as { id: string; department_id: string } | { id: string; department_id: string }[] | null
    const classGroup = Array.isArray(classGroupData) ? classGroupData[0] : classGroupData
    
    if (!classGroup?.department_id || !profile.current_semester_id) {
      return jsonResponse({ 
        courses: [], 
        grouped: { compulsory: [], elective: [] },
        totalCredits: 0 
      })
    }

    // Fetch courses for user's department and semester
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department_id', classGroup.department_id)
      .eq('semester_id', profile.current_semester_id)
      .order('code')

    if (error) {
      console.error('Error fetching courses:', error)
      return errorResponse('Failed to fetch courses', 500)
    }

    if (!courses || courses.length === 0) {
      return jsonResponse({ 
        courses: [], 
        grouped: { compulsory: [], elective: [] },
        totalCredits: 0 
      })
    }

    // Group by compulsory/elective
    const compulsory: any[] = []
    const elective: any[] = []
    let totalCredits = 0

    courses.forEach((course: any) => {
      const item = {
        id: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        courseUnit: course.credit_unit,
        category: course.is_compulsory ? 'COMPULSORY' : 'ELECTIVE',
        description: course.description,
        outline: course.outline
      }

      totalCredits += course.credit_unit || 0

      if (course.is_compulsory) {
        compulsory.push(item)
      } else {
        elective.push(item)
      }
    })

    return jsonResponse({
      courses,
      grouped: { compulsory, elective },
      totalCredits
    })
  } catch (error) {
    console.error('Courses fetch error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// POST /api/courses - Create a new course (course rep only)
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const userProfile = await getAuthenticatedUserProfile(supabase)

  if (!userProfile) {
    return unauthorizedResponse()
  }

  // Check if user is course rep
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userProfile.id)

  const isCourseRep = userRoles?.some((ur: any) => ur.role?.name === 'course_rep') || false

  if (!isCourseRep) {
    return errorResponse('Only course reps can create courses', 403)
  }

  try {
    const body = await request.json()
    const { code, title, description, credit_unit, is_compulsory } = body

    if (!code || !title) {
      return errorResponse('Code and title are required', 400)
    }

    // Get user's class_group to determine school_id and department_id
    const { data: profile } = await supabase
      .from('users')
      .select(`
        school_id,
        current_semester_id,
        class_group:class_groups!users_class_group_id_fkey(
          department_id
        )
      `)
      .eq('id', userProfile.id)
      .single()

    if (!profile?.school_id || !profile.current_semester_id) {
      return errorResponse('User profile missing school or semester', 400)
    }

    const classGroupData2 = profile.class_group as { department_id: string } | { department_id: string }[] | null
    const classGroup2 = Array.isArray(classGroupData2) ? classGroupData2[0] : classGroupData2
    if (!classGroup2?.department_id) {
      return errorResponse('User profile missing department', 400)
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        school_id: profile.school_id,
        department_id: classGroup2.department_id,
        semester_id: profile.current_semester_id,
        code,
        title,
        description: description || '',
        credit_unit: credit_unit || 3,
        is_compulsory: is_compulsory ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Create course error:', error)
      return errorResponse('Failed to create course', 500)
    }

    return jsonResponse({ course, message: 'Course created successfully' }, 201)
  } catch (error) {
    console.error('Create course error:', error)
    return errorResponse('Internal server error', 500)
  }
}
