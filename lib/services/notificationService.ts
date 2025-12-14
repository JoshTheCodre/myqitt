import { supabase } from '@/lib/supabase/client'

export type NotificationType = 'timetable_updated' | 'assignment_added' | 'assignment_updated'

export interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
}

export interface UserNotificationToken {
  id: string
  user_id: string
  fcm_token: string
  device_type: 'web' | 'mobile'
  created_at: string
  updated_at: string
}

export class NotificationService {
  /**
   * Register user's FCM token for push notifications
   */
  static async registerToken(userId: string, fcmToken: string, deviceType: 'web' | 'mobile' = 'web'): Promise<boolean> {
    try {
      console.log('🔄 Registering FCM token...', { 
        userId: userId.substring(0, 8) + '...', 
        tokenPreview: fcmToken.substring(0, 20) + '...',
        deviceType 
      })

      // Check if token already exists
      const { data: existing, error: checkError } = await supabase
        .from('notification_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('fcm_token', fcmToken)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing token:', checkError)
        throw checkError
      }

      if (existing) {
        console.log('📝 Updating existing token...')
        // Update existing token
        const { error } = await supabase
          .from('notification_tokens')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (error) throw error
        console.log('✅ Existing FCM token updated')
      } else {
        console.log('➕ Inserting new token...')
        // Insert new token
        const { data, error } = await supabase
          .from('notification_tokens')
          .insert({
            user_id: userId,
            fcm_token: fcmToken,
            device_type: deviceType
          })
          .select()

        if (error) {
          console.error('❌ Insert error:', error)
          throw error
        }
        console.log('✅ New FCM token inserted:', data)
      }

      console.log('✅ FCM token registered successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to register FCM token:', error)
      return false
    }
  }

  /**
   * Unregister user's FCM token
   */
  static async unregisterToken(userId: string, fcmToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('fcm_token', fcmToken)

      if (error) throw error
      console.log('✅ FCM token unregistered successfully')
      return true
    } catch (error) {
      console.error('Failed to unregister FCM token:', error)
      return false
    }
  }

  /**
   * Send notification to users who follow this host
   * This will be called by the host when they update their content
   */
  static async notifyConnectedUsers(
    hostUserId: string,
    contentType: 'timetable' | 'assignments' | 'both',
    notification: NotificationPayload
  ): Promise<void> {
    try {
      // Get all users who follow this host (followers)
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('follower_id')
        .eq('following_id', hostUserId)

      if (connectionsError) throw connectionsError

      if (!connections || connections.length === 0) {
        console.log('No followers to notify')
        return
      }

      // Since we don't have connection_type in schema yet, notify all followers
      // In the future, we can add connection_type filtering here
      const userIds = connections.map(conn => conn.follower_id)

      // Get FCM tokens for these users
      const { data: tokens, error: tokensError } = await supabase
        .from('notification_tokens')
        .select('fcm_token')
        .in('user_id', userIds)

      if (tokensError) throw tokensError

      if (!tokens || tokens.length === 0) {
        console.log('No FCM tokens found for connected users')
        return
      }

      const fcmTokens = tokens.map(t => t.fcm_token)

      // Call edge function to send notifications via FCM
      const { data: result, error: sendError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          tokens: fcmTokens,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {}
        }
      })

      if (sendError) {
        console.error('Edge function error:', sendError)
        throw sendError
      }

      // Create notification records for each user
      const notificationRecords = userIds.map(userId => ({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        read: false
      }))

      const { error: recordsError } = await supabase
        .from('notifications')
        .insert(notificationRecords)

      if (recordsError) {
        console.error('Failed to create notification records:', recordsError)
        // Don't throw here, FCM notification was sent successfully
      }

      console.log(`✅ Sent notifications to ${fcmTokens.length} device(s) and ${userIds.length} user(s)`)
      if (result) {
        console.log('FCM Result:', result)
      }
    } catch (error) {
      console.error('Failed to notify connected users:', error)
      throw error
    }
  }

  /**
   * Get user's notification preferences
   */
  static async getNotificationPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data || {
        timetable_updates: true,
        assignment_updates: true,
        push_enabled: true
      }
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return {
        timetable_updates: true,
        assignment_updates: true,
        push_enabled: true
      }
    }
  }

  /**
   * Update user's notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: {
      timetable_updates?: boolean
      assignment_updates?: boolean
      push_enabled?: boolean
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  /**
   * Create notification record in database for notification history
   */
  static async createNotificationRecord(
    userId: string,
    notification: NotificationPayload
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          read: false
        })
    } catch (error) {
      console.error('Failed to create notification record:', error)
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }

  /**
   * Get user's notification history
   */
  static async getNotificationHistory(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get notification history:', error)
      return []
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  /**
   * Get connected hosts and user's notification tokens
   */
  static async getConnectedHostsAndTokens(userId: string): Promise<{
    connectedHosts: Array<{
      id: string
      name: string
      email: string
      connection_type: string
    }>
    userTokens: Array<{
      id: string
      fcm_token: string
      device_type: string
      created_at: string
    }>
  }> {
    try {
      console.log('🔍 Loading connected hosts and tokens for user:', userId.substring(0, 8) + '...')

      // Get users this person is following (simpler query without joins)
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)

      if (connectionsError) {
        console.error('❌ Connections query error:', connectionsError)
        throw connectionsError
      }

      console.log('📊 Found connections:', connections?.length || 0)

      // Get user's notification tokens  
      const { data: tokens, error: tokensError } = await supabase
        .from('notification_tokens')
        .select('id, fcm_token, device_type, created_at')
        .eq('user_id', userId)

      if (tokensError) {
        console.error('❌ Tokens query error:', tokensError)
        throw tokensError
      }

      console.log('🔑 Found tokens:', tokens?.length || 0)

      // Get profile info for connected users separately (to avoid complex joins)
      let connectedHosts: Array<{
        id: string
        name: string
        email: string
        connection_type: string
      }> = []

      if (connections && connections.length > 0) {
        const followingIds = connections.map(c => c.following_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', followingIds)

        if (profilesError) {
          console.error('❌ Profiles query error:', profilesError)
          // Don't throw, just use empty profiles
        }

        connectedHosts = connections.map(conn => {
          const profile = profiles?.find(p => p.id === conn.following_id)
          return {
            id: conn.following_id,
            name: profile?.name || 'Unknown',
            email: profile?.email || '',
            connection_type: 'both' // Default since current schema doesn't have this field
          }
        })
      }

      const userTokens = (tokens || []).map(token => ({
        id: token.id,
        fcm_token: token.fcm_token,
        device_type: token.device_type,
        created_at: token.created_at
      }))

      console.log('✅ Successfully loaded data:', { 
        connectedHosts: connectedHosts.length, 
        userTokens: userTokens.length 
      })

      return {
        connectedHosts,
        userTokens
      }
    } catch (error) {
      console.error('Failed to get connected hosts and tokens:', error)
      return {
        connectedHosts: [],
        userTokens: []
      }
    }
  }

  /**
   * Test database access for debugging
   */
  static async testDatabaseAccess(userId: string): Promise<boolean> {
    try {
      console.log('🧪 Testing notification_tokens table access...')
      
      // Try to query the table
      const { data, error, count } = await supabase
        .from('notification_tokens')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      console.log('📊 Query result:', { data, error, count })
      
      if (error) {
        console.error('❌ Database query error:', error)
        return false
      }
      
      console.log('✅ Database access successful')
      return true
    } catch (error) {
      console.error('❌ Database test failed:', error)
      return false
    }
  }
}
