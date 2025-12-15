'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { Send, Loader2, CheckCircle, XCircle, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserWithToken {
  user_id: string
  device_type: string
  created_at: string
  profile?: {
    name: string
    email: string
  }
}

export default function TestNotificationsPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<UserWithToken[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [title, setTitle] = useState('Test Notification')
  const [message, setMessage] = useState('This is a test notification from Qitt')

  useEffect(() => {
    if (user) {
      fetchUsersWithTokens()
    }
  }, [user])

  const fetchUsersWithTokens = async () => {
    try {
      setLoading(true)
      
      // Get all notification tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('notification_tokens')
        .select('user_id, device_type, created_at')
        .order('created_at', { ascending: false })

      if (tokensError) throw tokensError

      // Get unique user IDs
      const uniqueUserIds = [...new Set(tokens?.map(t => t.user_id) || [])]

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', uniqueUserIds)

      if (profilesError) throw profilesError

      // Merge tokens with profiles
      const usersWithTokens = tokens?.map(token => ({
        ...token,
        profile: profiles?.find(p => p.id === token.user_id)
      })) || []

      setUsers(usersWithTokens)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users with FCM tokens')
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async (userId: string) => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter both title and message')
      return
    }

    try {
      setSending(userId)

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: title.trim(),
          body: message.trim(),
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification')
      }

      toast.success(`Notification sent successfully! (${result.successCount} devices)`)
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toast.error(error.message || 'Failed to send notification')
    } finally {
      setSending(null)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading users with FCM tokens...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="w-full lg:w-3/4 mx-auto px-4 py-8 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Test Notifications</h1>
            </div>
            <p className="text-gray-600">Send test notifications to users with FCM tokens</p>
          </div>

          {/* Notification Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Content</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Users with FCM Tokens ({users.length})
            </h2>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users with FCM tokens</h3>
                <p className="text-gray-600">No users have registered for push notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((userToken, index) => (
                  <div
                    key={`${userToken.user_id}-${index}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {userToken.profile?.name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {userToken.profile?.email || userToken.user_id}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          Device: {userToken.device_type || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Added: {new Date(userToken.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => sendTestNotification(userToken.user_id)}
                      disabled={sending === userToken.user_id || !title.trim() || !message.trim()}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2 flex-shrink-0"
                    >
                      {sending === userToken.user_id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Test
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Testing Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Make sure the user's device has the app installed and notifications enabled</li>
                  <li>• Test notifications are sent immediately to all devices registered for the user</li>
                  <li>• Check the browser console for detailed logs and error messages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
