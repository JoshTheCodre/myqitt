'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { requestNotificationPermission, isNotificationEnabled } from '@/lib/firebase/messaging';
import { NotificationService } from '@/lib/services/notificationService';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

export function PushNotificationPrompt() {
  const { user } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if user has already enabled or dismissed notifications
    const dismissed = localStorage.getItem('notification_prompt_dismissed');
    const enabled = isNotificationEnabled();
    
    setIsEnabled(enabled);
    setHasChecked(true);

    // Show prompt if not dismissed and not enabled
    if (!dismissed && !enabled && user?.id) {
      // Wait 3 seconds before showing prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  const handleEnableNotifications = async () => {
    if (!user?.id) {
      toast.error('Please sign in to enable notifications');
      return;
    }

    setIsLoading(true);
    try {
      // Request permission and get token
      const token = await requestNotificationPermission();

      if (token) {
        // Register token with backend
        await NotificationService.registerFCMToken(user.id, token);
        
        setIsEnabled(true);
        setShowPrompt(false);
        toast.success('Push notifications enabled! 🔔');
      } else {
        toast.error('Failed to enable notifications. Please check browser permissions.');
      }
    } catch (error: any) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };

  const handleDisableNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await NotificationService.unregisterFCMToken(user.id);
      setIsEnabled(false);
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasChecked) return null;

  // Prompt modal
  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-4 rounded-full">
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Stay Updated! 🔔
          </h3>
          <p className="text-gray-600">
            Enable push notifications to receive instant updates about:
          </p>
          <ul className="mt-3 space-y-2 text-left text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              New assignments and updates
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              Timetable changes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              Course outline updates
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              Assignment due date reminders
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Not now
          </button>
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can change this anytime in your browser settings
        </p>
      </div>
    </div>
  );
}
