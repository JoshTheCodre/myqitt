import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export type ConnectionType = 'timetable' | 'assignments' | 'both'

export interface ConnectionDetails {
  id: string
  follower_id: string
  following_id: string
  connection_type: ConnectionType
  created_at: string
}

export interface ExistingConnections {
  timetable?: string
  assignments?: string
}

export class ConnectionService {
  // Check existing connections for a user
  static async getExistingConnections(userId: string): Promise<ExistingConnections> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('following_id, connection_type')
        .eq('follower_id', userId)

      if (error) throw error

      const connections: ExistingConnections = {}
      
      data?.forEach(conn => {
        if (conn.connection_type === 'timetable' || conn.connection_type === 'both') {
          connections.timetable = conn.following_id
        }
        if (conn.connection_type === 'assignments' || conn.connection_type === 'both') {
          connections.assignments = conn.following_id
        }
      })

      return connections
    } catch (error) {
      console.error('Error getting existing connections:', error)
      return {}
    }
  }

  // Check if user can connect with a specific type
  static async canConnect(
    userId: string, 
    targetUserId: string, 
    type: ConnectionType
  ): Promise<{ canConnect: boolean; reason?: string }> {
    try {
      const existing = await this.getExistingConnections(userId)

      // Check if already connected to this specific user
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('connection_type')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single()

      if (existingConnection) {
        return { canConnect: false, reason: 'Already connected to this user' }
      }

      // Check connection limits
      if (type === 'timetable' || type === 'both') {
        if (existing.timetable) {
          return { canConnect: false, reason: 'Already connected to a timetable' }
        }
      }

      if (type === 'assignments' || type === 'both') {
        if (existing.assignments) {
          return { canConnect: false, reason: 'Already connected to an assignment list' }
        }
      }

      return { canConnect: true }
    } catch (error) {
      console.error('Error checking connection availability:', error)
      return { canConnect: false, reason: 'Failed to check connection status' }
    }
  }

  // Connect to user with specific type
  static async connectToUser(
    userId: string, 
    targetUserId: string, 
    type: ConnectionType
  ): Promise<void> {
    try {
      // Validate connection
      const validation = await this.canConnect(userId, targetUserId, type)
      if (!validation.canConnect) {
        toast.error(validation.reason || 'Cannot connect')
        throw new Error(validation.reason)
      }

      // Create connection
      const { error } = await supabase
        .from('connections')
        .insert({
          follower_id: userId,
          following_id: targetUserId,
          connection_type: type
        })

      if (error) throw error

      // Success message based on type
      const messages = {
        timetable: 'Connected to timetable! 📅',
        assignments: 'Connected to assignments! 📝',
        both: 'Connected to both timetable & assignments! 🎉'
      }

      toast.success(messages[type])
    } catch (error: any) {
      console.error('Error connecting to user:', error)
      toast.error(error.message || 'Failed to connect')
      throw error
    }
  }

  // Update connection type (useful for switching from one type to another with same user)
  static async updateConnectionType(
    userId: string,
    targetUserId: string,
    newType: ConnectionType
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ connection_type: newType })
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)

      if (error) throw error
      toast.success('Connection updated!')
    } catch (error: any) {
      console.error('Error updating connection:', error)
      toast.error(error.message || 'Failed to update connection')
      throw error
    }
  }

  // Disconnect from user
  static async disconnectUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)

      if (error) throw error
      toast.success('Disconnected successfully!')
    } catch (error: any) {
      console.error('Error disconnecting:', error)
      toast.error(error.message || 'Failed to disconnect')
      throw error
    }
  }

  // Get all connections with details
  static async getConnections(userId: string): Promise<ConnectionDetails[]> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('follower_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting connections:', error)
      return []
    }
  }

  // Check what content a user has available
  static async getUserContent(userId: string): Promise<{
    hasTimetable: boolean
    hasAssignments: boolean
    timetableUpdated?: string
    assignmentsUpdated?: string
  }> {
    try {
      const [timetableData, assignmentsData] = await Promise.all([
        supabase.from('timetable').select('updated_at').eq('user_id', userId).single(),
        supabase.from('assignments').select('updated_at').eq('user_id', userId).single()
      ])

      return {
        hasTimetable: !!timetableData.data,
        hasAssignments: !!assignmentsData.data,
        timetableUpdated: timetableData.data?.updated_at,
        assignmentsUpdated: assignmentsData.data?.updated_at
      }
    } catch (error) {
      console.error('Error checking user content:', error)
      return { hasTimetable: false, hasAssignments: false }
    }
  }
}
