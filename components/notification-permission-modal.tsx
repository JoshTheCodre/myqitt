'use client'

import { useState } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { requestNotificationPermission } from '@/lib/firebase/messaging'

interface NotificationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function NotificationPermissionModal({ isOpen, onClose, userId }: NotificationPermissionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRequestPermission = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setError('Notifications are not supported in this browser')
        setLoading(false)
        return
      }

      // Get FCM token using Firebase
      const fcmToken = await requestNotificationPermission()

      if (fcmToken) {
        // Save the FCM token to database
        const { error: dbError } = await supabase.from('device_tokens').insert({
          user_id: userId,
          token: fcmToken,
          device_type: 'web',
          device_name: getDeviceName(),
          is_active: true,
          last_used_at: new Date().toISOString()
        })

        if (dbError) {
          console.error('Database error:', dbError)
          setError('Failed to save notification token')
          setLoading(false)
          return
        }

        // Success - close the modal
        setLoading(false)
        onClose()
      } else {
        setError('Failed to get notification token. Please check if Firebase is configured.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Notification permission error:', err)
      setError('Failed to enable notifications. Please try again.')
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Stay Updated! 🔔
          </h2>
          <p className="text-gray-600 text-sm">
            Enable notifications to get instant updates about assignments, timetable changes, and class announcements.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRequestPermission}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          You can change this anytime in your profile settings
        </p>
      </div>
    </div>
  )
}

// Helper function to get device name
function getDeviceName(): string {
  const ua = navigator.userAgent
  if (ua.includes('iPhone')) return 'iPhone'
  if (ua.includes('iPad')) return 'iPad'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'Mac'
  if (ua.includes('Linux')) return 'Linux'
  return 'Unknown Device'
}
