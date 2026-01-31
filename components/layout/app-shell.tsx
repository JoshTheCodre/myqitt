'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { TopNav } from './top-nav'

// ✅ FIXED: AppShell no longer initializes auth - that's AuthProvider's job
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  // ✅ REMOVED: AppShell should not handle auth redirects - that's AuthGuard's job
  // The AuthGuard component already handles authentication-based routing

  // ✅ FIXED: Show layout skeleton while loading (prevents blank screen)
  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* Sidebar skeleton (desktop only) */}
        <div className="hidden lg:flex lg:w-64 border-r border-gray-100 bg-white"></div>
        
        {/* Main content skeleton */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 w-full p-8">
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded w-48 animate-pulse"></div>
              <div className="h-24 bg-gray-50 rounded-xl animate-pulse"></div>
              <div className="h-24 bg-gray-50 rounded-xl animate-pulse"></div>
            </div>
          </main>
          
          {/* Bottom nav skeleton (mobile only) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16"></div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }

  // ✅ Only render shell when user is authenticated
  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar (desktop only) */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content */}
        <main className="flex-1 w-full overflow-hidden">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
    </div>
  )
}
