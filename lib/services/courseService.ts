import { supabase } from '@/lib/supabase/client'

export interface Course {
  id: string
  school_id: string
  department_id: string
  semester_id: string
  code: string
  title: string
  description?: string
  credit_unit: number
  is_compulsory: boolean
  created_at?: string
  updated_at?: string
}

export interface CourseItem {
  courseCode: string
  courseTitle: string
  courseUnit: number
  category: 'COMPULSORY' | 'ELECTIVE'
}

export interface GroupedCourses {
  compulsory: CourseItem[]
  elective: CourseItem[]
}

export class CourseService {
  /**
   * Fetch courses for a specific department and semester
   */
  static async getCoursesByDepartmentAndSemester(
    departmentId: string,
    semesterId: string
  ): Promise<GroupedCourses> {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('department_id', departmentId)
        .eq('semester_id', semesterId)
        .order('code')

      if (error) {
        console.error('Error fetching courses:', error)
        return { compulsory: [], elective: [] }
      }

      if (!courses || courses.length === 0) {
        return { compulsory: [], elective: [] }
      }

      // Convert to CourseItem format and group
      const compulsory: CourseItem[] = []
      const elective: CourseItem[] = []

      courses.forEach((course: Course) => {
        const item: CourseItem = {
          courseCode: course.code,
          courseTitle: course.title,
          courseUnit: course.credit_unit,
          category: course.is_compulsory ? 'COMPULSORY' : 'ELECTIVE'
        }

        if (course.is_compulsory) {
          compulsory.push(item)
        } else {
          elective.push(item)
        }
      })

      return { compulsory, elective }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      return { compulsory: [], elective: [] }
    }
  }

  /**
   * Get courses for current user's profile
   * Uses class_group_id to determine department, and current_semester_id for semester
   */
  static async getCoursesForUser(userId: string): Promise<GroupedCourses> {
    try {
      console.log('Fetching courses for user:', userId)

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
        .eq('id', userId)
        .single()

      console.log('User profile:', profile)
      console.log('Profile error:', profileError)

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError)
        return { compulsory: [], elective: [] }
      }

      const classGroupData = profile.class_group as { id: string; department_id: string } | { id: string; department_id: string }[] | null
      const classGroup = Array.isArray(classGroupData) ? classGroupData[0] : classGroupData
      
      if (!classGroup?.department_id || !profile.current_semester_id) {
        console.warn('User profile missing required fields (class_group or semester).', profile)
        return { compulsory: [], elective: [] }
      }

      console.log('Fetching courses with:', {
        departmentId: classGroup.department_id,
        semesterId: profile.current_semester_id
      })

      // Fetch courses for user's department and semester
      return await this.getCoursesByDepartmentAndSemester(
        classGroup.department_id,
        profile.current_semester_id
      )
    } catch (error) {
      console.error('Failed to fetch user courses:', error)
      return { compulsory: [], elective: [] }
    }
  }

  /**
   * Get a single course by code
   */
  static async getCourseByCode(
    code: string,
    departmentId: string,
    semesterId: string
  ): Promise<CourseItem | null> {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select('*')
        .eq('code', code)
        .eq('department_id', departmentId)
        .eq('semester_id', semesterId)
        .single()

      if (error || !course) {
        return null
      }

      return {
        courseCode: course.code,
        courseTitle: course.title,
        courseUnit: course.credit_unit,
        category: course.is_compulsory ? 'COMPULSORY' : 'ELECTIVE'
      }
    } catch (error) {
      console.error('Failed to fetch course by code:', error)
      return null
    }
  }

  /**
   * Search courses by title or code within a department
   */
  static async searchCourses(
    searchTerm: string,
    departmentId: string
  ): Promise<CourseItem[]> {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('department_id', departmentId)
        .or(`code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        .order('code')
        .limit(20)

      if (error || !courses) {
        return []
      }

      return courses.map((course: Course) => ({
        courseCode: course.code,
        courseTitle: course.title,
        courseUnit: course.credit_unit,
        category: course.is_compulsory ? 'COMPULSORY' : 'ELECTIVE' as const
      }))
    } catch (error) {
      console.error('Failed to search courses:', error)
      return []
    }
  }

  /**
   * Get total credits for a list of courses
   */
  static calculateTotalCredits(courses: CourseItem[]): number {
    return courses.reduce((total, course) => total + course.courseUnit, 0)
  }

  /**
   * Get all courses for a class group (all semesters)
   */
  static async getAllCoursesForClassGroup(
    classGroupId: string
  ): Promise<Course[]> {
    try {
      // First get the department_id from class_group
      const { data: classGroup, error: cgError } = await supabase
        .from('class_groups')
        .select('department_id')
        .eq('id', classGroupId)
        .single()

      if (cgError || !classGroup) {
        console.error('Error fetching class group:', cgError)
        return []
      }

      // Then fetch all courses for that department
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('department_id', classGroup.department_id)
        .order('code')

      if (error || !courses) {
        return []
      }

      return courses
    } catch (error) {
      console.error('Failed to fetch all courses:', error)
      return []
    }
  }

  /**
   * Get course ID by course code for a user's class group
   */
  static async getCourseIdByCode(
    userId: string,
    courseCode: string
  ): Promise<string | null> {
    try {
      // Get user's class_group_id to find department
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          current_semester_id,
          class_group:class_groups!users_class_group_id_fkey(
            department_id
          )
        `)
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error('Error fetching user for course lookup:', profileError)
        return null
      }

      const classGroupData = profile.class_group as { department_id: string } | { department_id: string }[] | null
      const classGroup = Array.isArray(classGroupData) ? classGroupData[0] : classGroupData
      if (!classGroup?.department_id) {
        return null
      }

      // Find the course by code in user's department
      const { data: course, error } = await supabase
        .from('courses')
        .select('id')
        .eq('code', courseCode)
        .eq('department_id', classGroup.department_id)
        .single()

      if (error || !course) {
        console.error('Course not found:', courseCode)
        return null
      }

      return course.id
    } catch (error) {
      console.error('Failed to get course ID:', error)
      return null
    }
  }
}
