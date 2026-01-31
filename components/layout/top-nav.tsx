'use client';

import { useAuthStore } from '@/lib/store/authStore';
import NotificationBell from '@/components/notification-bell';
import { User } from 'lucide-react';
import Link from 'next/link';

export function TopNav() {
  const { user, profile } = useAuthStore();

  if (!user) return null;

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - can be used for page title or breadcrumbs */}
        <div className="flex-1">
          {/* Empty for now, can add page-specific content */}
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <NotificationBell userId={user.id} />

          {/* User Profile Link */}
          <Link href="/profile">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">
                {profile?.name || 'Profile'}
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
