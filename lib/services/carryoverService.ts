import { supabase } from '@/lib/supabase/client'

export interface CarryoverCourse {
  id: string
  user_id: string
  course_code: string
  course_title: string
  credit_unit: number
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CarryoverCourseItem {
  id: string
  courseCode: string
  courseTitle: string
  courseUnit: number
  category: 'CARRYOVER'
  completed: boolean
  completedAt: string | null
}

export interface CreateCarryoverData {
  course_code: string
  course_title: string
  credit_unit: number
}

export class CarryoverService {
  /**
   * Get all carryover courses for a user
   */
  static async getCarryoverCourses(userId: string): Promise<CarryoverCourseItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_carryover_courses')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('course_code')

      if (error) {
        console.error('Error fetching carryover courses:', error)
        return []
      }

      return (data || []).map((course: CarryoverCourse) => ({
        id: course.id,
        courseCode: course.course_code,
        courseTitle: course.course_title,
        courseUnit: course.credit_unit,
        category: 'CARRYOVER' as const,
        completed: course.completed,
        completedAt: course.completed_at
      }))
    } catch (error) {
      console.error('Failed to fetch carryover courses:', error)
      return []
    }
  }

  /**
   * Add a new carryover course
   */
  static async addCarryoverCourse(
    userId: string, 
    data: CreateCarryoverData
  ): Promise<CarryoverCourseItem | null> {
    try {
      const { data: course, error } = await supabase
        .from('user_carryover_courses')
        .insert({
          user_id: userId,
          course_code: data.course_code.toUpperCase().trim(),
          course_title: data.course_title.trim(),
          credit_unit: data.credit_unit,
          completed: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding carryover course:', error)
        throw error
      }

      return {
        id: course.id,
        courseCode: course.course_code,
        courseTitle: course.course_title,
        courseUnit: course.credit_unit,
        category: 'CARRYOVER',
        completed: course.completed,
        completedAt: course.completed_at
      }
    } catch (error) {
      console.error('Failed to add carryover course:', error)
      throw error
    }
  }

  /**
   * Mark a carryover course as completed
   */
  static async markAsCompleted(courseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_carryover_courses')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', courseId)

      if (error) {
        console.error('Error marking carryover as completed:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to mark carryover as completed:', error)
      return false
    }
  }

  /**
   * Delete a carryover course
   */
  static async deleteCarryoverCourse(courseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_carryover_courses')
        .delete()
        .eq('id', courseId)

      if (error) {
        console.error('Error deleting carryover course:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to delete carryover course:', error)
      return false
    }
  }

  /**
   * Get a single carryover course by code for a user
   */
  static async getCarryoverByCode(
    userId: string, 
    courseCode: string
  ): Promise<CarryoverCourseItem | null> {
    try {
      const { data, error } = await supabase
        .from('user_carryover_courses')
        .select('*')
        .eq('user_id', userId)
        .eq('course_code', courseCode.toUpperCase())
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        courseCode: data.course_code,
        courseTitle: data.course_title,
        courseUnit: data.credit_unit,
        category: 'CARRYOVER',
        completed: data.completed,
        completedAt: data.completed_at
      }
    } catch (error) {
      console.error('Failed to get carryover by code:', error)
      return null
    }
  }

  /**
   * Check if a course is a carryover
   */
  static async isCarryoverCourse(userId: string, courseCode: string): Promise<boolean> {
    const course = await this.getCarryoverByCode(userId, courseCode)
    return course !== null
  }
}
