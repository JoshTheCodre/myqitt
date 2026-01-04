'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { Megaphone, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDepartmentName } from '@/lib/hooks/useDepartments'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user_name?: string
}

export default function DepartmentPage() {
  const { profile } = useAuthStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)

  useEffect(() => {
    if (profile?.department && profile?.school && profile?.level) {
      fetchAnnouncements()
    }
  }, [profile?.department, profile?.school, profile?.level])

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true)
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          user_id,
          users!inner(name)
        `)
        .eq('school', profile?.school)
        .eq('department', profile?.department)
        .eq('level', profile?.level)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      setAnnouncements(data?.map(a => ({
        ...a,
        user_name: (a.users as any)?.name || 'Unknown'
      })) || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.department ? formatDepartmentName(profile.department) : 'Department'}
              </h1>
              <p className="text-sm text-gray-600">
                {profile?.level ? `${profile.level}00 Level` : ''} • Announcements
              </p>
            </div>
            <Link href="/admin/manage">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md">
                Manage
              </button>
            </Link>
          </div>

          {/* Announcements */}
          <div className="space-y-4">
            {/* Add Announcement Button - Only for Course Reps */}
            {profile?.is_course_rep && (
              <Link href="/department/announcement/new">
                <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md">
                  <Plus className="w-5 h-5" />
                  New Announcement
                </button>
              </Link>
            )}

            {loadingAnnouncements ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>{announcement.user_name}</span>
                          <span>•</span>
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No Announcements Yet</h3>
                <p className="text-sm text-gray-600">
                  {profile?.is_course_rep 
                    ? 'Create your first announcement for your classmates.'
                    : 'Your course rep hasn\'t posted any announcements yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
