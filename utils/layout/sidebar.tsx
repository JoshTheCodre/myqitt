'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Home, Clock, FileText, LogOut, FolderSearch } from 'lucide-react'
import { useAuthStore } from '@/app/auth/store/authStore'
import { useRouter, usePathname } from 'next/navigation'
import { useAssignmentStore } from '@/app/assignment/store/assignmentStore'
import { useEffect, useState } from 'react'

export function Sidebar() {
  const { logout, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { unreadCount, fetchUnreadCount } = useAssignmentStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      
      await fetchUnreadCount()
      setIsLoading(false)
    }

    // Initial fetch
    loadUnreadCount()
    
    // Refresh count periodically
    const interval = setInterval(() => fetchUnreadCount(), 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [user?.id, fetchUnreadCount])

  const handleLogout = async () => {
    try {
      await logout()
      // Redirect is handled by the logout action
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Sidebar - Desktop only */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-0">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center justify-start ml-4 mb-8">
            <Image src="/qitt-logo.svg" alt="Qitt Logo" width={80} height={80} priority style={{ width: 'auto', height: 'auto' }} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <Link href="/dashboard">
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <Home size={20} />
                <span>Home</span>
              </button>
            </Link>
            <Link href="/timetable">
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/timetable')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <Clock size={20} />
                <span>Timetable</span>
              </button>
            </Link>
            <Link href="/assignment">
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors relative ${
                isActive('/assignment')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <FileText size={20} />
                <span>Assignments</span>
                {!isLoading && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/resources">
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/resources')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <FolderSearch size={20} />
                <span>Resources</span>
              </button>
            </Link>
          </nav>


          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-64" />
    </>
  )
}
