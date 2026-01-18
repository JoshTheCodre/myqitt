import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { TimetableService } from './timetableService'

// New schema-aligned interfaces
export interface Assignment {
  id: string
  class_group_id: string
  semester_id: string
  course_id: string
  title: string
  description: string
  due_at?: string
  attachment_urls?: string[]
  created_by: string
  created_at?: string
  updated_at?: string
  // Joined data
  course?: {
    id: string
    code: string
    title: string
  }
}

export interface AssignmentDate {
  id: string
  date: string
  label: string
  title: string
  description: string
  submissionType?: string
}

export interface GroupedAssignment {
  courseCode: string
  courseTitle?: string
  assignmentCount: number
  dates: AssignmentDate[]
}

export interface CreateAssignmentData {
  course_id: string
  title: string
  description: string
  due_at?: string
  attachment_urls?: string[]
}

export class AssignmentService {
  // Get all assignments for user's class group
  static async getAssignments(userId: string): Promise<{
    assignments: GroupedAssignment[],
    isCourseRep: boolean
  }> {
    try {
      // Get user's class group info
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        return { assignments: [], isCourseRep: false }
      }

      // Fetch assignments for user's class group
      let query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_at,
          attachment_urls,
          created_at,
          course:courses!assignments_course_id_fkey(
            id,
            code,
            title
          )
        `)
        .eq('class_group_id', userInfo.class_group_id)
        .order('due_at', { ascending: true })

      // Filter by semester if user has one set
      if (userInfo.semester_id) {
        query = query.eq('semester_id', userInfo.semester_id)
      }

      const { data: assignmentsData, error } = await query

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching assignments:', error)
      }

      if (!assignmentsData || assignmentsData.length === 0) {
        return { assignments: [], isCourseRep: userInfo.isCourseRep }
      }

      // Group assignments by course code
      const groupedAssignments = assignmentsData.reduce((acc, item) => {
        const courseCode = (item.course as any)?.code || 'Unknown'
        const courseTitle = (item.course as any)?.title || ''
        
        const existing = acc.find((a: GroupedAssignment) => a.courseCode === courseCode)
        
        const dueDate = item.due_at ? new Date(item.due_at) : null
        const dateLabel = dueDate 
          ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'No due date'
        
        const assignmentDate: AssignmentDate = {
          id: item.id,
          date: item.due_at || '',
          label: dateLabel,
          title: item.title,
          description: item.description || '',
          submissionType: 'PDF Report'
        }

        if (existing) {
          existing.dates.push(assignmentDate)
          existing.assignmentCount++
        } else {
          acc.push({
            courseCode,
            courseTitle,
            assignmentCount: 1,
            dates: [assignmentDate]
          })
        }

        return acc
      }, [] as GroupedAssignment[])

      return {
        assignments: groupedAssignments,
        isCourseRep: userInfo.isCourseRep
      }
    } catch (error: any) {
      toast.error('Failed to load assignments')
      throw error
    }
  }

  // Get raw list of assignments (not grouped)
  static async getAssignmentsList(userId: string): Promise<Assignment[]> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        return []
      }

      let query = supabase
        .from('assignments')
        .select(`
          *,
          course:courses!assignments_course_id_fkey(
            id,
            code,
            title
          )
        `)
        .eq('class_group_id', userInfo.class_group_id)
        .order('due_at', { ascending: true })

      if (userInfo.semester_id) {
        query = query.eq('semester_id', userInfo.semester_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching assignments list:', error)
      return []
    }
  }

  // Create new assignment (course rep only)
  static async createAssignment(userId: string, data: CreateAssignmentData): Promise<void> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can create assignments')
      }

      if (!userInfo.semester_id) {
        throw new Error('Please set your current semester before creating assignments')
      }

      const { error } = await supabase
        .from('assignments')
        .insert({
          class_group_id: userInfo.class_group_id,
          semester_id: userInfo.semester_id,
          course_id: data.course_id,
          title: data.title,
          description: data.description,
          due_at: data.due_at,
          attachment_urls: data.attachment_urls || [],
          created_by: userId
        })

      if (error) throw error
      toast.success('Assignment created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment')
      throw error
    }
  }

  // Update assignment (course rep only)
  static async updateAssignment(
    userId: string, 
    assignmentId: string, 
    data: Partial<CreateAssignmentData>
  ): Promise<void> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can update assignments')
      }

      const updates: Record<string, any> = {
        updated_at: new Date().toISOString()
      }
      
      if (data.course_id) updates.course_id = data.course_id
      if (data.title) updates.title = data.title
      if (data.description !== undefined) updates.description = data.description
      if (data.due_at !== undefined) updates.due_at = data.due_at
      if (data.attachment_urls) updates.attachment_urls = data.attachment_urls

      const { error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', assignmentId)
        .eq('class_group_id', userInfo.class_group_id) // Ensure user can only update their class's assignments

      if (error) throw error
      toast.success('Assignment updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update assignment')
      throw error
    }
  }

  // Delete assignment (course rep only)
  static async deleteAssignment(userId: string, assignmentId: string): Promise<void> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) {
        throw new Error('Could not get user info')
      }

      if (!userInfo.isCourseRep) {
        throw new Error('Only course reps can delete assignments')
      }

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('class_group_id', userInfo.class_group_id) // Ensure user can only delete their class's assignments

      if (error) throw error
      toast.success('Assignment deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment')
      throw error
    }
  }

  // Get upcoming assignments count
  static async getUpcomingCount(userId: string): Promise<number> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) return 0

      const now = new Date().toISOString()

      let query = supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .eq('class_group_id', userInfo.class_group_id)
        .gte('due_at', now)

      if (userInfo.semester_id) {
        query = query.eq('semester_id', userInfo.semester_id)
      }

      const { count, error } = await query

      if (error) return 0
      return count || 0
    } catch {
      return 0
    }
  }

  // Get next assignment due
  static async getNextAssignment(userId: string): Promise<{
    title: string
    courseCode: string
    dueDate: string
    daysLeft: number
  } | null> {
    try {
      const userInfo = await TimetableService.getUserClassGroupInfo(userId)
      if (!userInfo) return null

      const now = new Date().toISOString()

      let query = supabase
        .from('assignments')
        .select(`
          title,
          due_at,
          course:courses!assignments_course_id_fkey(code)
        `)
        .eq('class_group_id', userInfo.class_group_id)
        .gte('due_at', now)
        .order('due_at', { ascending: true })
        .limit(1)

      if (userInfo.semester_id) {
        query = query.eq('semester_id', userInfo.semester_id)
      }

      const { data, error } = await query.single()

      if (error || !data) return null

      const dueDate = new Date(data.due_at)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return {
        title: data.title,
        courseCode: (data.course as any)?.code || 'Unknown',
        dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        daysLeft: Math.max(0, diffDays)
      }
    } catch {
      return null
    }
  }
}
