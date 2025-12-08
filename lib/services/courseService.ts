import { supabase } from '@/lib/supabase/client'
import type { CourseFilters, GroupedCourses, CourseCurriculum, CourseItem } from '@/lib/types/course'

export class CourseService {
  /**
   * Fetch course curriculum for a department
   */
  static async getCourseCurriculum(department: string, school?: string): Promise<CourseCurriculum | null> {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('department', department)

      if (school) {
        query = query.eq('school', school)
      }

      const { data, error } = await query.single()

      if (error) {
        console.error('Error fetching course curriculum:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch course curriculum:', error)
      return null
    }
  }

  /**
   * Fetch courses with optional filters
   */
  static async getCourses(filters?: CourseFilters): Promise<CourseItem[]> {
    try {
      if (!filters?.department) {
        console.warn('Department filter is required for new course structure')
        return []
      }

      const level = filters.level || 1
      const semester = filters.semester === 'second' ? 2 : 1

      const grouped = await this.getCoursesByLevelAndSemester(
        filters.department,
        level,
        semester,
        filters.school
      )

      return [...grouped.compulsory, ...grouped.elective]
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      return []
    }
  }

  /**
   * Get courses for a specific level and semester from curriculum
   */
  static async getCoursesByLevelAndSemester(
    department: string,
    level: number,
    semester: number,
    school?: string
  ): Promise<GroupedCourses> {
    try {
      const curriculum = await this.getCourseCurriculum(department, school)
      
      if (!curriculum || !curriculum.course_data) {
        return { compulsory: [], elective: [] }
      }

      const levelKey = (level * 100).toString()
      const semesterKey = semester.toString()

      const courses = curriculum.course_data[levelKey]?.[semesterKey] || []

      return {
        compulsory: courses.filter(course => course.category === 'COMPULSORY'),
        elective: courses.filter(course => course.category === 'ELECTIVE')
      }
    } catch (error) {
      console.error('Failed to fetch courses by level and semester:', error)
      return { compulsory: [], elective: [] }
    }
  }

  /**
   * Get courses grouped by compulsory/elective
   */
  static async getGroupedCourses(filters?: CourseFilters): Promise<GroupedCourses> {
    try {
      if (!filters?.department) {
        console.warn('Department filter is required for new course structure')
        return { compulsory: [], elective: [] }
      }

      const level = filters.level || 1
      const semester = filters.semester === 'second' ? 2 : 1

      return await this.getCoursesByLevelAndSemester(
        filters.department,
        level,
        semester,
        filters.school
      )
    } catch (error) {
      console.error('Failed to fetch grouped courses:', error)
      return { compulsory: [], elective: [] }
    }
  }

  /**
   * Get a single course by code
   */
  static async getCourseByCode(
    code: string,
    department: string,
    school?: string
  ): Promise<CourseItem | null> {
    try {
      const curriculum = await this.getCourseCurriculum(department, school)
      
      if (!curriculum || !curriculum.course_data) {
        return null
      }

      // Search through all levels and semesters
      for (const levelKey in curriculum.course_data) {
        for (const semesterKey in curriculum.course_data[levelKey]) {
          const courses = curriculum.course_data[levelKey][semesterKey]
          const course = courses.find(c => c.courseCode === code)
          if (course) {
            return course
          }
        }
      }

      return null
    } catch (error) {
      console.error('Failed to fetch course by code:', error)
      return null
    }
  }

  /**
   * Search courses by title or code
   */
  static async searchCourses(
    searchTerm: string,
    filters?: CourseFilters
  ): Promise<CourseItem[]> {
    try {
      if (!filters?.department) {
        console.warn('Department filter is required for new course structure')
        return []
      }

      const curriculum = await this.getCourseCurriculum(filters.department, filters.school)
      
      if (!curriculum || !curriculum.course_data) {
        return []
      }

      const results: CourseItem[] = []
      const searchLower = searchTerm.toLowerCase()

      // Search through all levels and semesters
      for (const levelKey in curriculum.course_data) {
        for (const semesterKey in curriculum.course_data[levelKey]) {
          const courses = curriculum.course_data[levelKey][semesterKey]
          
          const matches = courses.filter(course =>
            course.courseCode.toLowerCase().includes(searchLower) ||
            course.courseTitle.toLowerCase().includes(searchLower)
          )

          results.push(...matches)
        }
      }

      return results
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
   * Get courses for current user's profile
   */
  static async getCoursesForUser(
    userId: string
  ): Promise<GroupedCourses> {
    try {
      console.log('Fetching courses for user:', userId)
      
      // Get user profile to determine school, department, level, semester
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('school, department, level, semester')
        .eq('id', userId)
        .single()

      console.log('User profile:', profile)
      console.log('Profile error:', profileError)

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return { compulsory: [], elective: [] }
      }

      // Check if profile has required fields
      if (!profile || !profile.department || !profile.level || !profile.semester) {
        console.warn('User profile missing required fields (department, level, semester).', profile)
        return { compulsory: [], elective: [] }
      }

      const semester = profile.semester === 'second' ? 2 : 1

      console.log('Fetching courses with filters:', {
        department: profile.department,
        level: profile.level,
        semester
      })

      // Fetch courses matching user's profile
      const courses = await this.getCoursesByLevelAndSemester(
        profile.department,
        profile.level,
        semester,
        profile.school
      )

      console.log('Courses fetched:', courses)
      return courses
    } catch (error) {
      console.error('Failed to fetch user courses:', error)
      return { compulsory: [], elective: [] }
    }
  }
}
