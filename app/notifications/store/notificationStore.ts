import { create } from 'zustand'
import { api } from '@/utils/api-client'

// Re-export types from the types file
export type { NotificationType, NotificationPayload, NotificationRecipient, NotificationRecord, SendNotificationOptions } from '@/app/notifications/types/notification'

// ============ STATE ============
interface NotificationState {
  notifications: any[]
  unreadNotifications: any[]
  unreadCount: number
  loading: boolean

  // Actions
  fetchNotifications: (limit?: number) => Promise<void>
  fetchUnreadNotifications: (limit?: number) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  registerFCMToken: (token: string) => Promise<void>
  unregisterFCMToken: () => Promise<void>
  reset: () => void
}

const initialState = {
  notifications: [],
  unreadNotifications: [],
  unreadCount: 0,
  loading: false,
}

export const useNotificationStore = create<NotificationState>((set) => ({
  ...initialState,

  fetchNotifications: async (limit = 50) => {
    set({ loading: true })
    try {
      const notifications = await api.get<any[]>(`/api/notifications?limit=${limit}`)
      set({ notifications, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchUnreadNotifications: async (limit = 10) => {
    try {
      const unreadNotifications = await api.get<any[]>(`/api/notifications?action=unread&limit=${limit}`)
      set({ unreadNotifications })
    } catch {}
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await api.get<number>('/api/notifications?action=unread-count')
      set({ unreadCount })
    } catch {}
  },

  markAsRead: async (notificationId: string) => {
    try {
      await api.post('/api/notifications', { action: 'mark-read', notificationId })
      set(state => ({
        notifications: state.notifications.map(n => n.id === notificationId ? { ...n, is_read: true } : n),
        unreadNotifications: state.unreadNotifications.filter(n => n.id !== notificationId),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await api.post('/api/notifications', { action: 'mark-all-read' })
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadNotifications: [],
        unreadCount: 0
      }))
    } catch {}
  },

  registerFCMToken: async (token: string) => {
    try {
      await api.post('/api/notifications', { action: 'register-fcm', token })
    } catch (error) {
      console.error('Error registering FCM token:', error)
      throw error
    }
  },

  unregisterFCMToken: async () => {
    try {
      await api.post('/api/notifications', { action: 'unregister-fcm' })
    } catch (error) {
      console.error('Error unregistering FCM token:', error)
      throw error
    }
  },

  reset: () => set(initialState),
}))
