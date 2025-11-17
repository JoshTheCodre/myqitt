'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Home, Clock, FileText, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter, usePathname } from 'next/navigation'

export function Sidebar() {
  const { logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    router.push('/')
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
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/assignment')
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <FileText size={20} />
                <span>Assignment</span>
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
