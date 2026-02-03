'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Calendar, ClipboardList } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { AssignmentViewService } from '@/lib/services'
import { useEffect, useState } from 'react'

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) {
        setUnreadCount(null)
        setIsLoading(false)
        return
      }
      
      const count = await AssignmentViewService.getUnreadCount(user.id)
      setUnreadCount(count)
      setIsLoading(false)
    }

    // Initial fetch
    fetchUnreadCount()
    
    // Refresh count periodically
    const interval = setInterval(fetchUnreadCount, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [user?.id])

  const items = [
    { id: 'home', icon: Home, label: 'Home', href: '/dashboard' },
    { id: 'timetable', icon: Calendar, label: 'Timetable', href: '/timetable' },
    { id: 'assignment', icon: ClipboardList, label: 'Assignments', href: '/assignment', badge: unreadCount ?? 0 },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="max-w-md mx-auto px-6">
        <div className="flex items-center justify-center gap-4 h-20 py-3">
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-1 py-3 px-3 rounded-lg transition-colors relative"
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'}`}
                  />
                  {!isLoading && item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
