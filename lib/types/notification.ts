export type NotificationType = 
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_deleted'
  | 'assignment_due_soon'
  | 'timetable_updated'
  | 'course_outline_updated'
  | 'class_reminder'
  | 'announcement'
  | 'general';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface NotificationRecipient {
  userId: string;
  deviceToken?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface SendNotificationOptions {
  recipients: NotificationRecipient[];
  payload: NotificationPayload;
  saveToHistory?: boolean;
}
