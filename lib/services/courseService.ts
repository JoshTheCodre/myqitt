import { supabase } from '@/lib/supabase/client'
import type { Course, CourseFilters, GroupedCourses } from '@/lib/types/course'

export class CourseService {
  /**
   * Fetch courses with optional filters
   */
  static async getCourses(filters?: CourseFilters): Promise<Course[]> {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('code', { ascending: true })

      // Apply filters
      if (filters?.school) {
        query = query.eq('school', filters.school)
      }
      if (filters?.department) {
        query = query.eq('department', filters.department)
      }
      if (filters?.level) {
        query = query.eq('level', filters.level)
      }
      if (filters?.semester) {
        query = query.eq('semester', filters.semester)
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching courses:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      return []
    }
  }

  /**
   * Get courses grouped by compulsory/elective
   */
  static async getGroupedCourses(filters?: CourseFilters): Promise<GroupedCourses> {
    const courses = await this.getCourses(filters)

    return {
      compulsory: courses.filter(course => 
        course.tags?.includes('compulsory')
      ),
      elective: courses.filter(course => 
        course.tags?.includes('elective')
      )
    }
  }

  /**
   * Get courses by level and semester
   */
  static async getCoursesByLevelAndSemester(
    level: number,
    semester: 'first' | 'second',
    filters?: Omit<CourseFilters, 'level' | 'semester'>
  ): Promise<GroupedCourses> {
    return this.getGroupedCourses({
      ...filters,
      level,
      semester
    })
  }

  /**
   * Get a single course by ID
   */
  static async getCourseById(id: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching course:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch course:', error)
      return null
    }
  }

  /**
   * Get a single course by code
   */
  static async getCourseByCode(code: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('code', code)
        .single()

      if (error) {
        console.error('Error fetching course:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch course:', error)
      return null
    }
  }

  /**
   * Search courses by title or code
   */
  static async searchCourses(
    searchTerm: string,
    filters?: CourseFilters
  ): Promise<Course[]> {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .or(`code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
        .order('code', { ascending: true })

      // Apply additional filters
      if (filters?.school) {
        query = query.eq('school', filters.school)
      }
      if (filters?.department) {
        query = query.eq('department', filters.department)
      }
      if (filters?.level) {
        query = query.eq('level', filters.level)
      }
      if (filters?.semester) {
        query = query.eq('semester', filters.semester)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching courses:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to search courses:', error)
      return []
    }
  }

  /**
   * Get total credits for a list of courses
   */
  static calculateTotalCredits(courses: Course[]): number {
    return courses.reduce((total, course) => total + course.credits, 0)
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
      if (!profile || !profile.level || !profile.semester) {
        console.warn('User profile missing required fields (level, semester)', profile)
        return { compulsory: [], elective: [] }
      }

      console.log('Fetching courses with filters:', {
        school: profile.school,
        department: profile.department,
        level: profile.level,
        semester: profile.semester
      })

      // Fetch courses matching user's profile
      const courses = await this.getGroupedCourses({
        school: profile.school,
        department: profile.department,
        level: profile.level,
        semester: profile.semester
      })

      console.log('Courses fetched:', courses)
      return courses
    } catch (error) {
      console.error('Failed to fetch user courses:', error)
      return { compulsory: [], elective: [] }
    }
  }
}
