'use client'

import { useEffect, useState } from 'react'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'
import { app } from '@/lib/firebase/config'
import { NotificationService } from '@/lib/services/notificationService'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

// FCM Vapor Key - Get this from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || 'YOUR_VAPID_KEY_HERE'

export function usePushNotifications() {
  const { user } = useAuthStore()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [messaging, setMessaging] = useState<Messaging | null>(null)

  // Initialize Firebase Messaging
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const msg = getMessaging(app)
        setMessaging(msg)
      } catch (error) {
        console.error('Failed to initialize messaging:', error)
      }
    }
  }, [])

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        console.log('✅ Notification permission granted')
        await registerToken()
        return true
      } else {
        console.log('❌ Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  // Register FCM token
  const registerToken = async () => {
    if (!messaging || !user) return

    try {
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      })

      if (currentToken) {
        setFcmToken(currentToken)
        await NotificationService.registerToken(user.id, currentToken, 'web')
        console.log('✅ FCM token registered:', currentToken.substring(0, 20) + '...')
      } else {
        console.log('No registration token available')
      }
    } catch (error) {
      console.error('Failed to get FCM token:', error)
    }
  }

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Received foreground message:', payload)

      const { notification, data } = payload

      if (notification) {
        // Show simple toast notification without JSX
        toast.success(
          `${notification.title}\n${notification.body}`,
          { 
            duration: 5000,
            icon: '📢'
          }
        )

        // Create notification record
        if (user) {
          NotificationService.createNotificationRecord(user.id, {
            type: (data?.type as any) || 'timetable_updated',
            title: notification.title || 'New Update',
            body: notification.body || '',
            data: data as Record<string, any>
          })
        }
      }
    })

    return () => unsubscribe()
  }, [messaging, user])

  // Auto-request permission on mount if user is logged in
  useEffect(() => {
    if (user && permission === 'default') {
      // Don't auto-request, let user trigger it
      setPermission(Notification.permission)
    }
  }, [user, permission])

  return {
    permission,
    fcmToken,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  }
}
