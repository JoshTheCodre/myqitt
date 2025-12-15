import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface AssignmentDate {
  date: string
  label: string
  title: string
  description: string
  submissionType: string
  lecturer: string
  id: string
  ownerName?: string
}

export interface Assignment {
  id: string
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
  isOwner?: boolean
  ownerName?: string
}

export interface CreateAssignmentData {
  title: string
  description: string
  courseCode: string
  lecturer: string
  dueDate: string
  submissionType: string
  userId: string
}

export class AssignmentService {
  // Get all assignments for a user (including connected users)
  static async getAssignments(userId: string): Promise<{
    assignments: Assignment[],
    usersWithoutData: string[],
    connectedUserNames: string[]
  }> {
    try {
      const allItems: Array<{
        id: string
        course_code: string
        title: string
        description: string
        due_date: string
        created_at: string
        ownerName?: string
        isOwner?: boolean
      }> = []

      const usersWithoutData: string[] = []
      const connectedUserNames: string[] = []

      // 2. First, check for connected classmates
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)

      const hasConnections = connections && connections.length > 0

      // 1. Only fetch user's own assignments if NOT connected to anyone
      if (!hasConnections) {
        const { data: assignmentRecord, error: assignmentError } = await supabase
          .from('assignments')
          .select('assignments_data')
          .eq('user_id', userId)
          .single()

        if (assignmentError && assignmentError.code !== 'PGRST116') {
          console.error('Error fetching assignments:', assignmentError)
        }

        if (assignmentRecord && assignmentRecord.assignments_data) {
          const ownAssignments = (assignmentRecord.assignments_data as any[]).map(a => ({
            ...a,
            isOwner: true
          }))
          allItems.push(...ownAssignments)
        }
      }

      // Fetch connected classmates' assignments if they exist
      if (hasConnections) {
        const connectedUserIds = connections.map(c => c.following_id)

        // Fetch connected users' names
        const { data: connectedUsersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', connectedUserIds)

        const userNamesMap = new Map(
          connectedUsersData?.map(u => [u.id, u.name]) || []
        )

        // Store connected users' names for header display
        connectedUserNames.push(...(connectedUsersData?.map(u => u.name) || []))

        // Fetch connected users' assignments
        const { data: connectedAssignments } = await supabase
          .from('assignments')
          .select('user_id, assignments_data')
          .in('user_id', connectedUserIds)

        connectedAssignments?.forEach(record => {
          if (record.assignments_data && Array.isArray(record.assignments_data) && record.assignments_data.length > 0) {
            const ownerName = userNamesMap.get(record.user_id) || 'Classmate'
            const assignments = record.assignments_data.map((a: any) => ({
              ...a,
              isOwner: false,
              ownerName
            }))
            allItems.push(...assignments)
          }
        })

        // Check if connected users had no assignments
        const usersWithNoAssignments = connectedUserIds.filter(userId => {
          const hasData = connectedAssignments?.some(record => 
            record.user_id === userId && 
            Array.isArray(record.assignments_data) && 
            record.assignments_data.length > 0
          )
          return !hasData
        })

        if (usersWithNoAssignments.length > 0) {
          const userNames = usersWithNoAssignments.map(id => userNamesMap.get(id) || 'Classmate')
          usersWithoutData.push(...userNames)
        }
      }

      if (allItems && allItems.length > 0) {
        const groupedAssignments = allItems.reduce((acc, item) => {
          const existing = acc.find(a => a.courseCode === item.course_code && a.ownerName === item.ownerName)
          const dueDate = new Date(item.due_date)
          const dateLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          const assignmentDate: AssignmentDate = {
            id: item.id,
            date: item.due_date,
            label: dateLabel,
            title: item.title,
            description: item.description || '',
            submissionType: 'PDF Report',
            lecturer: 'TBA'
          }

          if (existing) {
            existing.dates.push(assignmentDate)
            existing.assignmentCount++
          } else {
            acc.push({
              id: item.id,
              courseCode: item.course_code,
              assignmentCount: 1,
              dates: [assignmentDate],
              isOwner: item.isOwner !== false,
              ownerName: item.ownerName
            })
          }

          return acc
        }, [] as Assignment[])

        return {
          assignments: groupedAssignments,
          usersWithoutData,
          connectedUserNames
        }
      }

      return {
        assignments: [],
        usersWithoutData,
        connectedUserNames
      }
    } catch (error: any) {
      toast.error('Failed to load assignments')
      throw error
    }
  }

  // Create new assignment
  static async createAssignment(data: CreateAssignmentData): Promise<void> {
    try {
      const newAssignment = {
        id: crypto.randomUUID(),
        course_code: data.courseCode,
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        created_at: new Date().toISOString()
      }

      // Check if user already has assignments
      const { data: existing, error: fetchError } = await supabase
        .from('assignments')
        .select('assignments_data')
        .eq('user_id', data.userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (existing?.assignments_data) {
        // Add to existing assignments array
        const currentAssignments = existing.assignments_data as any[]
        const updatedAssignments = [...currentAssignments, newAssignment]
        
        const { error } = await supabase
          .from('assignments')
          .update({ assignments_data: updatedAssignments })
          .eq('user_id', data.userId)
        
        if (error) throw error
      } else {
        // Create new assignments record
        const { error } = await supabase
          .from('assignments')
          .insert({
            user_id: data.userId,
            assignments_data: [newAssignment]
          })
        
        if (error) throw error
      }

      toast.success('Assignment created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment')
      throw error
    }
  }

  // Delete assignment
  static async deleteAssignment(assignmentId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('user_id', userId) // Ensure user can only delete their own assignments

      if (error) throw error
      toast.success('Assignment deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment')
      throw error
    }
  }

  // Update assignment
  static async updateAssignment(
    assignmentId: string, 
    userId: string, 
    updates: Partial<CreateAssignmentData>
  ): Promise<void> {
    try {
      const updateData: any = {}
      if (updates.title) updateData.title = updates.title
      if (updates.description) updateData.description = updates.description
      if (updates.courseCode) updateData.course_code = updates.courseCode
      if (updates.lecturer) updateData.lecturer = updates.lecturer
      if (updates.dueDate) updateData.due_date = updates.dueDate
      if (updates.submissionType) updateData.submission_type = updates.submissionType

      const { error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('Assignment updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update assignment')
      throw error
    }
  }

  // Get assignment by ID
  static async getAssignment(assignmentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      toast.error('Failed to load assignment')
      throw error
    }
  }
}