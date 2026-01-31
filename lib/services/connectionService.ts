import { supabase } from '@/lib/supabase/client'

export interface Connection {
  id: string
  follower_id: string
  following_id: string
  connection_types: string[]
  created_at: string
}

export interface ConnectedUserData {
  userId: string
  userName: string
  connectionTypes: string[]
  isViewOnly: true
}

export class ConnectionService {
  /**
   * Get the user's current connection (they can only have one)
   */
  static async getCurrentConnection(userId: string): Promise<Connection | null> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('follower_id', userId)
        .single()

      if (error || !data) return null
      return data
    } catch {
      return null
    }
  }

  /**
   * Get connected user's details
   */
  static async getConnectedUser(userId: string): Promise<ConnectedUserData | null> {
    try {
      const connection = await this.getCurrentConnection(userId)
      if (!connection) return null

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', connection.following_id)
        .single()

      if (error || !user) return null

      return {
        userId: user.id,
        userName: user.name || 'Unknown',
        connectionTypes: connection.connection_types || [],
        isViewOnly: true
      }
    } catch {
      return null
    }
  }

  /**
   * Check if user has a specific connection type enabled
   */
  static async hasConnectionType(userId: string, type: string): Promise<boolean> {
    const connection = await this.getCurrentConnection(userId)
    if (!connection) return false
    return connection.connection_types?.includes(type) || false
  }

  /**
   * Disconnect from current connection
   */
  static async disconnect(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('follower_id', userId)

      return !error
    } catch {
      return false
    }
  }

  /**
   * Get timetable data source
   * - If connected with 'timetable' type: show connected user's data (view-only)
   * - If NOT connected: return null (no data to show unless user is course rep with own data)
   */
  static async getTimetableUserId(currentUserId: string): Promise<{ userId: string | null; isViewOnly: boolean; userName?: string; isConnected: boolean }> {
    const connectedUser = await this.getConnectedUser(currentUserId)
    
    if (connectedUser && connectedUser.connectionTypes.includes('timetable')) {
      return {
        userId: connectedUser.userId,
        isViewOnly: true,
        userName: connectedUser.userName,
        isConnected: true
      }
    }
    
    // Not connected - user can only see their own data if they're a course rep
    // Return their own ID but mark as not connected so the page can handle it
    return { userId: currentUserId, isViewOnly: false, isConnected: false }
  }

  /**
   * Get assignments data source
   * - If connected with 'assignments' type: show connected user's data (view-only)
   * - If NOT connected: return null (no data to show unless user is course rep with own data)
   */
  static async getAssignmentsUserId(currentUserId: string): Promise<{ userId: string | null; isViewOnly: boolean; userName?: string; isConnected: boolean }> {
    const connectedUser = await this.getConnectedUser(currentUserId)
    
    if (connectedUser && connectedUser.connectionTypes.includes('assignments')) {
      return {
        userId: connectedUser.userId,
        isViewOnly: true,
        userName: connectedUser.userName,
        isConnected: true
      }
    }
    
    // Not connected - user can only see their own data if they're a course rep
    return { userId: currentUserId, isViewOnly: false, isConnected: false }
  }

  /**
   * Get course outline data source
   * Course OUTLINE requires connection - but course LIST is available to everyone in the same level/semester
   */
  static async getCourseOutlineUserId(currentUserId: string): Promise<{ userId: string; isViewOnly: boolean; userName?: string; isConnected: boolean }> {
    const connectedUser = await this.getConnectedUser(currentUserId)
    
    if (connectedUser && connectedUser.connectionTypes.includes('course_outline')) {
      return {
        userId: connectedUser.userId,
        isViewOnly: true,
        userName: connectedUser.userName,
        isConnected: true
      }
    }
    
    return { userId: currentUserId, isViewOnly: false, isConnected: false }
  }

  /**
   * Get today's classes data source
   */
  static async getTodayClassesUserId(currentUserId: string): Promise<{ userId: string; isViewOnly: boolean; userName?: string; isConnected: boolean }> {
    const connectedUser = await this.getConnectedUser(currentUserId)
    
    if (connectedUser && connectedUser.connectionTypes.includes('today_classes')) {
      return {
        userId: connectedUser.userId,
        isViewOnly: true,
        userName: connectedUser.userName,
        isConnected: true
      }
    }
    
    return { userId: currentUserId, isViewOnly: false, isConnected: false }
  }
}
