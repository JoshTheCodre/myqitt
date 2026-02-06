import { supabase } from '@/lib/supabase/client'

export class AssignmentViewService {
  /**
   * Mark an assignment as viewed by the current user
   */
  static async markAsViewed(userId: string, assignmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assignment_views')
        .upsert(
          { user_id: userId, assignment_id: assignmentId, viewed_at: new Date().toISOString() },
          { onConflict: 'user_id,assignment_id' }
        )

      return !error
    } catch (error) {
      console.error('Error marking assignment as viewed:', error)
      return false
    }
  }

  /**
   * Get count of unread assignments for a user
   * Assignments are "unread" if they were created after the user last viewed them (or never viewed)
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // First check if user has access to assignments
      // They need to be either a course rep OR connected to someone for assignments
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          class_group_id, 
          current_semester_id,
          user_roles(role:roles(name))
        `)
        .eq('id', userId)
        .single()

      if (userError || !userData?.class_group_id) return 0

      // Check if user is course rep
      const userRoles = userData.user_roles as any[] | null
      const isCourseRep = userRoles?.some(
        (ur) => ur?.role?.name === 'course_rep'
      ) || false

      // Check if user is connected for assignments
      const { data: connection } = await supabase
        .from('connections')
        .select('connection_types')
        .eq('follower_id', userId)
        .single()

      const isConnectedForAssignments = connection?.connection_types?.includes('assignments') || false

      // If not course rep and not connected for assignments, return 0
      if (!isCourseRep && !isConnectedForAssignments) {
        return 0
      }

      // Get all assignments for the user's class group and semester
      let query = supabase
        .from('assignments')
        .select('id, created_at')
        .eq('class_group_id', userData.class_group_id)

      // Filter by semester if user has one set
      if (userData.current_semester_id) {
        query = query.eq('semester_id', userData.current_semester_id)
      }

      const { data: assignments, error: assignmentsError } = await query.order('created_at', { ascending: false })

      if (assignmentsError || !assignments) return 0

      // Get all viewed assignments for this user
      const { data: views, error: viewsError } = await supabase
        .from('assignment_views')
        .select('assignment_id, viewed_at')
        .eq('user_id', userId)

      if (viewsError) return 0

      const viewedMap = new Map(
        (views || []).map(v => [v.assignment_id, new Date(v.viewed_at)])
      )

      // Count assignments that are unviewed
      let unreadCount = 0
      for (const assignment of assignments) {
        const viewedAt = viewedMap.get(assignment.id)
        if (!viewedAt) {
          unreadCount++
        }
      }

      return unreadCount
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Check if a specific assignment has been viewed
   */
  static async hasViewed(userId: string, assignmentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('assignment_views')
        .select('id')
        .eq('user_id', userId)
        .eq('assignment_id', assignmentId)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }

  /**
   * Get all unviewed assignment IDs for a user
   */
  static async getUnviewedAssignmentIds(userId: string): Promise<string[]> {
    try {
      // First get user's class group and semester
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('class_group_id, current_semester_id')
        .eq('id', userId)
        .single()

      if (userError || !userData?.class_group_id) return []

      // Get all assignments for the user's class group and semester
      let query = supabase
        .from('assignments')
        .select('id, created_at')
        .eq('class_group_id', userData.class_group_id)

      // Filter by semester if user has one set
      if (userData.current_semester_id) {
        query = query.eq('semester_id', userData.current_semester_id)
      }

      const { data: assignments, error: assignmentsError } = await query

      if (assignmentsError || !assignments) return []

      // Get viewed assignments
      const { data: views, error: viewsError } = await supabase
        .from('assignment_views')
        .select('assignment_id, viewed_at')
        .eq('user_id', userId)

      if (viewsError) return assignments.map(a => a.id)

      const viewedSet = new Set((views || []).map(v => v.assignment_id))

      // Return IDs of unviewed assignments
      return assignments
        .filter(assignment => !viewedSet.has(assignment.id))
        .map(a => a.id)
    } catch (error) {
      console.error('Error getting unviewed assignments:', error)
      return []
    }
  }
}
