'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

// ✅ FIXED: AppShell no longer initializes auth - that's AuthProvider's job
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // ✅ FIXED: Only redirect after loading is complete
    if (!loading && !user) {
      console.log('🔒 AppShell: No user, redirecting to home')
      router.push('/')
    }
  }, [user, loading, router])

  // ✅ FIXED: Show nothing while loading or if no user
  if (loading || !user) {
    return null
  }

  // ✅ Only render shell when user is authenticated
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
