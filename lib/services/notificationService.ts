import { supabase } from '@/lib/supabase/client';
import { NotificationPayload, NotificationRecipient, SendNotificationOptions } from '@/lib/types/notification';

/**
 * NotificationService - Handles sending notifications to users
 * Sends both push notifications and stores in notification history
 */
export class NotificationService {
  private static get supabase() {
    return supabase;
  }

  /**
   * Send notification to multiple recipients
   * @param options - Notification configuration
   */
  static async sendNotification(options: SendNotificationOptions): Promise<void> {
    const { recipients, payload, saveToHistory = true } = options;

    try {
      // Save to notification history if enabled
      if (saveToHistory) {
        await this.saveNotificationHistory(recipients, payload);
      }

      // Get device tokens for recipients
      const recipientIds = recipients.map(r => r.userId);
      const { data: deviceTokens } = await this.supabase
        .from('device_tokens')
        .select('user_id, token, device_type')
        .in('user_id', recipientIds)
        .eq('is_active', true);

      if (!deviceTokens || deviceTokens.length === 0) {
        console.log('No active device tokens found for recipients');
        return;
      }

      // Call edge function to send push notifications
      const { error } = await this.supabase.functions.invoke('send-notification', {
        body: {
          tokens: deviceTokens.map((dt: any) => dt.token),
          notification: {
            title: payload.title,
            body: payload.message,
            data: payload.data,
            url: payload.actionUrl,
          }
        }
      });

      if (error) {
        console.error('Failed to send push notification:', error);
      }
    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  }

  /**
   * Save notification to database history
   */
  private static async saveNotificationHistory(
    recipients: NotificationRecipient[],
    payload: NotificationPayload
  ): Promise<void> {
    const notifications = recipients.map(recipient => ({
      user_id: recipient.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || null,
      action_url: payload.actionUrl || null,
      is_read: false,
    }));

    const { error } = await this.supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  /**
   * Get all connectees (students connected to a host)
   * @param hostUserId - The host user ID
   * @returns Array of connectee user IDs
   */
  static async getConnectees(hostUserId: string): Promise<NotificationRecipient[]> {
    const { data, error } = await this.supabase
      .from('connections')
      .select('user_id, connection_types')
      .eq('connected_to_id', hostUserId)
      .eq('status', 'accepted');

    if (error || !data) {
      console.error('Failed to get connectees:', error);
      return [];
    }

    // Filter to only those connected for assignments
    return data
      .filter((conn: any) => conn.connection_types?.includes('assignments'))
      .map((conn: any) => ({ userId: conn.user_id }));
  }

  /**
   * Notify connectees about assignment creation
   */
  static async notifyAssignmentCreated(
    hostUserId: string,
    assignmentTitle: string,
    assignmentId: string,
    dueDate?: string
  ): Promise<void> {
    const connectees = await this.getConnectees(hostUserId);
    
    if (connectees.length === 0) return;

    await this.sendNotification({
      recipients: connectees,
      payload: {
        type: 'assignment_created',
        title: 'New Assignment',
        message: `A new assignment "${assignmentTitle}" has been created${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}`,
        data: { assignmentId, hostUserId },
        actionUrl: `/assignment`,
      },
    });
  }

  /**
   * Notify connectees about assignment update
   */
  static async notifyAssignmentUpdated(
    hostUserId: string,
    assignmentTitle: string,
    assignmentId: string,
    changes?: string
  ): Promise<void> {
    const connectees = await this.getConnectees(hostUserId);
    
    if (connectees.length === 0) return;

    await this.sendNotification({
      recipients: connectees,
      payload: {
        type: 'assignment_updated',
        title: 'Assignment Updated',
        message: `"${assignmentTitle}" has been updated${changes ? `: ${changes}` : ''}`,
        data: { assignmentId, hostUserId },
        actionUrl: `/assignment`,
      },
    });
  }

  /**
   * Notify connectees about assignment deletion
   */
  static async notifyAssignmentDeleted(
    hostUserId: string,
    assignmentTitle: string
  ): Promise<void> {
    const connectees = await this.getConnectees(hostUserId);
    
    if (connectees.length === 0) return;

    await this.sendNotification({
      recipients: connectees,
      payload: {
        type: 'assignment_deleted',
        title: 'Assignment Deleted',
        message: `"${assignmentTitle}" has been removed`,
        data: { hostUserId },
        actionUrl: `/assignment`,
      },
    });
  }

  /**
   * Notify connectees about timetable update
   */
  static async notifyTimetableUpdated(
    hostUserId: string
  ): Promise<void> {
    const connectees = await this.getConnectees(hostUserId);
    
    if (connectees.length === 0) return;

    await this.sendNotification({
      recipients: connectees,
      payload: {
        type: 'timetable_updated',
        title: 'Timetable Updated',
        message: 'Your class timetable has been updated. Check the changes!',
        data: { hostUserId },
        actionUrl: `/timetable`,
      },
    });
  }

  /**
   * Notify connectees about course outline update
   */
  static async notifyCourseOutlineUpdated(
    hostUserId: string,
    courseCode: string,
    courseTitle: string
  ): Promise<void> {
    const connectees = await this.getConnectees(hostUserId);
    
    if (connectees.length === 0) return;

    await this.sendNotification({
      recipients: connectees,
      payload: {
        type: 'course_outline_updated',
        title: 'Course Outline Updated',
        message: `${courseCode} - ${courseTitle} outline has been updated`,
        data: { hostUserId, courseCode },
        actionUrl: `/courses/detail?code=${encodeURIComponent(courseCode)}&title=${encodeURIComponent(courseTitle)}`,
      },
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: string, limit = 10) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get unread notifications:', error);
      return [];
    }

    return data;
  }

  /**
   * Get all notifications for a user
   */
  static async getAllNotifications(userId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }

    return data;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  /**
   * Register FCM token for a user
   */
  static async registerFCMToken(userId: string, token: string): Promise<void> {
    try {
      // Check if token already exists
      const { data: existing } = await this.supabase
        .from('device_tokens')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('token', token)
        .maybeSingle();

      if (existing) {
        // Update existing token to active
        await this.supabase
          .from('device_tokens')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new token
        await this.supabase
          .from('device_tokens')
          .insert({
            user_id: userId,
            token: token,
            device_type: 'web',
            is_active: true
          });
      }

      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('Error registering FCM token:', error);
      throw error;
    }
  }

  /**
   * Unregister FCM token for a user
   */
  static async unregisterFCMToken(userId: string): Promise<void> {
    try {
      // Mark all tokens for this user as inactive
      await this.supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_type', 'web');

      console.log('FCM tokens unregistered successfully');
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  }
}
