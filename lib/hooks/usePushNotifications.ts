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
  const [isSupported, setIsSupported] = useState(false)

  // Initialize Firebase Messaging
  useEffect(() => {
    const initMessaging = async () => {
      if (typeof window === 'undefined') {
        console.log('❌ Not in browser environment')
        return
      }
      
      if (!('Notification' in window)) {
        console.log('❌ Notifications not supported')
        return
      }
      
      if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Workers not supported')
        return
      }

      try {
        console.log('🔄 Initializing Firebase Messaging...')
        const msg = getMessaging(app)
        setMessaging(msg)
        setIsSupported(true)
        console.log('✅ Firebase Messaging initialized')
        
        // Check current permission
        if (Notification.permission !== 'default') {
          setPermission(Notification.permission)
        }
      } catch (error) {
        console.error('❌ Failed to initialize messaging:', error)
        setIsSupported(false)
      }
    }

    initMessaging()
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
    console.log('🔄 registerToken called')
    console.log('Messaging initialized:', !!messaging)
    console.log('User authenticated:', !!user)
    console.log('VAPID_KEY:', VAPID_KEY.substring(0, 20) + '...')
    
    if (!messaging) {
      console.error('❌ Messaging not initialized')
      toast.error('Firebase Messaging not available on this device')
      return false
    }
    
    if (!user) {
      console.error('❌ User not authenticated')
      return false
    }

    try {
      console.log('🔄 Requesting FCM token...')
      
      // Check if service worker is ready
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        console.log('✅ Service worker ready:', registration.active?.scriptURL)
      }
      
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      })

      if (currentToken) {
        console.log('✅ FCM token received:', currentToken.substring(0, 40) + '...')
        setFcmToken(currentToken)
        
        const success = await NotificationService.registerToken(user.id, currentToken, 'web')
        if (success) {
          console.log('✅ FCM token registered in database')
          toast.success('Push notifications enabled!')
          return true
        } else {
          console.error('❌ Failed to register token in database')
          toast.error('Failed to save notification token')
          return false
        }
      } else {
        console.error('❌ No registration token available')
        toast.error('Could not get notification token. Check Firebase configuration.')
        return false
      }
    } catch (error: any) {
      console.error('❌ Failed to get FCM token:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      })
      
      if (error.code === 'messaging/unsupported-browser') {
        toast.error('Push notifications not supported on this browser')
      } else if (error.code === 'messaging/permission-blocked') {
        toast.error('Notification permission blocked. Please enable in browser settings.')
      } else {
        toast.error(`Failed to setup notifications: ${error.message}`)
      }
      return false
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
    registerToken, // Expose for manual registration
    isSupported
  }
}
