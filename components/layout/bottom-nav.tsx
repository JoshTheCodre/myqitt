'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Calendar, ClipboardList, GraduationCap } from 'lucide-react'

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const items = [
    { id: 'home', icon: Home, label: 'Home', href: '/dashboard' },
    { id: 'timetable', icon: Calendar, label: 'Timetable', href: '/timetable' },
    { id: 'assignment', icon: ClipboardList, label: 'Assignments', href: '/assignment' },
    { id: 'resources', icon: GraduationCap, label: 'Resources', href: '/resources' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-lg transition-colors flex-1"
              >
                <Icon
                  className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-gray-500'
                    }`}
                />
                <span
                  className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'
                    }`}
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
