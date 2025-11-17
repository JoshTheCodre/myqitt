'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, initAuth } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initAuth()
    setMounted(true)
  }, [initAuth])

  useEffect(() => {
    if (mounted && !user) {
      router.push('/')
    }
  }, [user, mounted, router])

  if (!mounted || !user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop only) */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-1">
        {/* Content */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
    </div>
  )
}
