'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X, Users, Key } from 'lucide-react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { NotificationService } from '@/lib/services/notificationService'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { user } = useAuthStore()
  const { permission, fcmToken, requestPermission, registerToken, isSupported } = usePushNotifications()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [connectedHosts, setConnectedHosts] = useState<Array<{
    id: string
    name: string
    email: string
    connection_type: string
  }>>([])
  const [userTokens, setUserTokens] = useState<Array<{
    id: string
    fcm_token: string
    device_type: string
    created_at: string
  }>>([])
  const [loadingData, setLoadingData] = useState(false)

  // Load push enabled state and connected hosts/tokens
  useEffect(() => {
    if (user && isOpen) {
      loadPreferences()
      loadConnectedData()
    }
  }, [user, isOpen])

  const loadPreferences = async () => {
    if (!user) return
    const prefs = await NotificationService.getNotificationPreferences(user.id)
    setPushEnabled(prefs.push_enabled)
  }

  const loadConnectedData = async () => {
    if (!user) return
    setLoadingData(true)
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const dataPromise = NotificationService.getConnectedHostsAndTokens(user.id)
      
      const data = await Promise.race([dataPromise, timeoutPromise]) as any
      
      setConnectedHosts(data.connectedHosts)
      setUserTokens(data.userTokens)
      console.log('✅ Loaded connected data:', data)
    } catch (error) {
      console.error('❌ Failed to load connected data:', error)
      setConnectedHosts([])
      setUserTokens([])
      toast.error('Failed to load connection data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleToggleNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (granted) {
        await updatePushEnabled(true)
        await loadConnectedData() // Refresh to show new token
        toast.success('Notifications enabled!')
      }
    } else {
      await updatePushEnabled(!pushEnabled)
      toast.success(pushEnabled ? 'Notifications disabled' : 'Notifications enabled')
    }
  }

  const handleRefreshTokens = async () => {
    if (permission === 'granted' && registerToken) {
      setLoadingData(true)
      const success = await registerToken()
      if (success) {
        await loadConnectedData()
        toast.success('Token refreshed!')
      } else {
        toast.error('Failed to refresh token')
      }
      setLoadingData(false)
    }
  }

  const updatePushEnabled = async (value: boolean) => {
    if (!user) return

    setLoading(true)
    const updated = await NotificationService.updateNotificationPreferences(user.id, {
      push_enabled: value
    })

    if (updated) {
      setPushEnabled(value)
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6" />
                <h2 className="text-xl font-bold">Notifications</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {!isSupported && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold">Notifications not supported</p>
                <p className="mt-1">Your browser doesn't support push notifications.</p>
              </div>
            )}

            {/* Main toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  {pushEnabled ? (
                    <Bell className="w-5 h-5 text-blue-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <span className="font-semibold text-gray-900">Push Notifications</span>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked by browser' : 'Click to enable'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  disabled={loading || permission === 'denied'}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    permission === 'granted' && pushEnabled
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    permission === 'granted' && pushEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            </div>

            {permission === 'denied' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                <p className="font-semibold">Notifications Blocked</p>
                <p className="mt-1">Please enable notifications in your browser settings to receive updates.</p>
              </div>
            )}

            {permission === 'granted' && pushEnabled && (
              <>
                {/* Connected Hosts */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="font-semibold text-blue-800">Connected Hosts</p>
                  </div>
                  
                  {loadingData ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-blue-600">Loading connections...</p>
                    </div>
                  ) : connectedHosts.length > 0 ? (
                    <div className="space-y-2">
                      {connectedHosts.map((host) => (
                        <div key={host.id} className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{host.name}</p>
                              <p className="text-sm text-gray-600">{host.email}</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {host.connection_type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-blue-600 mb-3">No connected hosts yet. Connect with classmates to receive their notifications!</p>
                      <button
                        onClick={loadConnectedData}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Retry Loading
                      </button>
                    </div>
                  )}
                </div>

                {/* Notification Tokens */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-600" />
                      <p className="font-semibold text-gray-800">Your Notification Tokens</p>
                    </div>
                    <button
                      onClick={handleRefreshTokens}
                      disabled={loadingData || permission !== 'granted'}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingData ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {loadingData ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600">Loading tokens...</p>
                    </div>
                  ) : userTokens.length > 0 ? (
                    <div className="space-y-2">
                      {userTokens.map((token) => (
                        <div key={token.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium capitalize">
                                  {token.device_type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(token.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 font-mono break-all">
                                {token.fcm_token.substring(0, 40)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">No notification tokens registered yet.</p>
                      
                      {/* Debug Info */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                        <p className="font-medium text-yellow-800 mb-2">Debug Info:</p>
                        <div className="space-y-1 text-yellow-700">
                          <p>• Permission: <span className="font-mono">{permission}</span></p>
                          <p>• Current FCM Token: <span className="font-mono">{fcmToken ? `${fcmToken.substring(0, 20)}...` : 'None'}</span></p>
                          <p>• User ID: <span className="font-mono">{user?.id || 'None'}</span></p>
                          <p>• Browser Support: <span className="font-mono">{isSupported ? 'Yes' : 'No'}</span></p>
                        </div>
                        {permission === 'granted' && !fcmToken && (
                          <p className="text-yellow-600 mt-2 font-medium">
                            ⚠️ Permission granted but no FCM token. Try refreshing tokens.
                          </p>
                        )}
                        
                        <button
                          onClick={async () => {
                            console.log('🔧 Testing database access...')
                            const testResult = await NotificationService.testDatabaseAccess(user?.id || '')
                            toast(testResult ? 'Database accessible' : 'Database error - check console', 
                              { icon: testResult ? '✅' : '❌' })
                          }}
                          className="mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        >
                          Test DB Access
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <p className="text-xs text-blue-600">
                    💡 Your connection type with each classmate determines what notifications you receive from them.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
