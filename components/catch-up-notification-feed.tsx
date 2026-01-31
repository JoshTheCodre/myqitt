'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { NotificationService } from '@/lib/services/notificationService';
import { NotificationRecord } from '@/lib/types/notification';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Clock, AlertCircle, FileText, Bell, Megaphone } from 'lucide-react';

export function CatchUpNotificationFeed() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;
      setLoading(true);
      const data = await NotificationService.getAllNotifications(user.id, 20);
      setNotifications(data);
      setLoading(false);
    };
    loadNotifications();
  }, [user?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotification = payload.new as NotificationRecord;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const updated = payload.new as NotificationRecord;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleNotificationClick = async (notification: NotificationRecord) => {
    if (!notification.is_read) {
      await NotificationService.markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_created':
        return (
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-3 h-3 text-blue-600" />
          </div>
        );
      case 'assignment_updated':
        return (
          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-amber-600" />
          </div>
        );
      case 'assignment_deleted':
        return (
          <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-red-600" />
          </div>
        );
      case 'assignment_due_soon':
        return (
          <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-orange-600" />
          </div>
        );
      case 'class_reminder':
        return (
          <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Bell className="w-3 h-3 text-purple-600" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-3 h-3 text-gray-600" />
          </div>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <section>
        <div className="rounded-xl p-5 border border-gray-200 bg-white">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (notifications.length === 0) {
    return (
      <section>
        <div className="rounded-xl p-5 border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              You&apos;re All Caught Up! 🎉
            </h3>
            <p className="text-xs text-gray-500">
              No new notifications at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const displayedNotifications = notifications.slice(0, 3);

  return (
    <>
      <section>
        <div className="rounded-xl p-4 border border-gray-200 bg-white relative">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Catch Up</h2>
          <div className="space-y-2">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-2.5 p-2 -mx-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold group-hover:text-emerald-600 transition-colors truncate leading-tight ${
                      !notification.is_read ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">
                    {notification.message}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                  {formatTime(notification.created_at)}
                </span>
              </div>
            ))}
          </div>
          {notifications.length > 3 && (
            <button
              onClick={() => setShowAllItems(true)}
              className="absolute left-1/2 transform -translate-x-1/2 -bottom-2.5 flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 border border-blue-300 rounded-lg bg-white hover:bg-blue-50 transition-colors"
            >
              More
              <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                {notifications.length - 3}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Modal/Bottom Sheet */}
      {showAllItems && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 lg:bg-black/30"
            onClick={() => setShowAllItems(false)}
          ></div>

          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 lg:top-1/2 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:left-auto lg:right-auto lg:w-96 bg-white lg:rounded-xl shadow-xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                All Notifications
              </h3>
              <button
                onClick={() => setShowAllItems(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      handleNotificationClick(notification);
                      setShowAllItems(false);
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read
                        ? 'bg-blue-50'
                        : 'border border-gray-200'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          !notification.is_read
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
