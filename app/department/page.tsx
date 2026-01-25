'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore, type UserProfileWithDetails } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { Megaphone, Plus, Send, ChevronDown, Calendar, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user_name?: string
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all'

interface DateFilterOption {
  value: DateFilter
  label: string
}

const dateFilterOptions: DateFilterOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' }
]

// Empty state for users not in a class group
function NotJoinedState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Megaphone className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Department Announcements</h2>
        <p className="text-gray-600 mb-8">
          You need to join a department first. Contact your course representative to confirm your enrollment.
        </p>
      </div>
    </div>
  )
}

export default function DepartmentPage() {
  const profile = useAuthStore((s) => s.profile)
  const status = useAuthStore((s) => s.status)
  const typedProfile = profile as UserProfileWithDetails | null
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [sending, setSending] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  
  // Check if user is course rep from user_roles
  const isCourseRep = typedProfile?.user_roles?.some(
    (ur: { role?: { name: string } }) => ur.role?.name === 'course_rep'
  ) || false
  
  // Get department and level info from class_group
  const departmentName = typedProfile?.class_group?.department?.name
  const levelNumber = typedProfile?.class_group?.level?.level_number
  const classGroupId = typedProfile?.class_group_id
  const hasJoinedClass = !!classGroupId

  useEffect(() => {
    if (status !== 'authenticated') return
    
    if (classGroupId) {
      fetchAnnouncements()
    } else {
      setLoadingAnnouncements(false)
    }
  }, [classGroupId, status])

  // Filter announcements based on date filter
  useEffect(() => {
    if (dateFilter === 'all') {
      setFilteredAnnouncements(announcements)
      return
    }

    const now = new Date()
    const filtered = announcements.filter(announcement => {
      const announcementDate = new Date(announcement.created_at)
      
      switch (dateFilter) {
        case 'today':
          return announcementDate.toDateString() === now.toDateString()
        
        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          return announcementDate.toDateString() === yesterday.toDateString()
        
        case 'week':
          const weekAgo = new Date(now)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return announcementDate >= weekAgo
        
        case 'month':
          const monthAgo = new Date(now)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return announcementDate >= monthAgo
        
        default:
          return true
      }
    })
    
    setFilteredAnnouncements(filtered)
  }, [announcements, dateFilter])

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
          created_by,
          users!announcements_created_by_fkey(name)
        `)
        .eq('class_group_id', classGroupId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching announcements:', error)
        throw error
      }
      
      const formattedData = data?.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        created_at: a.created_at,
        user_id: a.created_by,
        user_name: (a.users as any)?.name || 'Unknown'
      })) || []
      
      setAnnouncements(formattedData)
      setFilteredAnnouncements(formattedData)
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

  const handleSendAnnouncement = async () => {
    if (!newAnnouncement.trim() || !typedProfile?.id || !classGroupId) return
    
    try {
      setSending(true)
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          school_id: typedProfile.school_id,
          class_group_id: classGroupId,
          semester_id: typedProfile.current_semester_id,
          title: newAnnouncement.trim().substring(0, 100),
          content: newAnnouncement.trim(),
          created_by: typedProfile.id
        })
        .select(`
          id,
          title,
          content,
          created_at,
          created_by
        `)
        .single()

      if (error) throw error

      // Add to list with user info
      setAnnouncements(prev => [{
        ...data,
        user_id: data.created_by,
        user_name: typedProfile.name || 'Unknown'
      }, ...prev])
      setNewAnnouncement('')
      toast.success('Announcement sent!')
    } catch (error) {
      console.error('Error sending announcement:', error)
      toast.error('Failed to send announcement')
    } finally {
      setSending(false)
    }
  }

  // Show not joined state if user hasn't joined a class
  if (status === 'authenticated' && !hasJoinedClass) {
    return (
      <AppShell>
        <NotJoinedState />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {departmentName || 'Department'}
                </h1>
                <p className="text-sm text-gray-600">
                  {levelNumber ? `${levelNumber}00 Level` : ''} • Announcements
                </p>
              </div>
              {isCourseRep && (
                <Link href="/department/manage">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md">
                    Manage
                  </button>
                </Link>
              )}
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{dateFilterOptions.find(opt => opt.value === dateFilter)?.label || 'All Time'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showFilterDropdown && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {dateFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateFilter(option.value)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          dateFilter === option.value
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="space-y-4">
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
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map(announcement => (
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
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">No Announcements</h3>
                    <p className="text-sm text-gray-600">
                      No announcements found for the selected time period.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No Announcements Yet</h3>
                <p className="text-sm text-gray-600">
                  {isCourseRep 
                    ? 'Create your first announcement for your classmates.'
                    : 'Your course rep hasn\'t posted any announcements yet.'}
                </p>
              </div>
            )}
          </div>

          {/* WhatsApp-like Input - Only for Course Reps */}
          {isCourseRep && (
            <div className="fixed bottom-20 left-0 right-0 lg:bottom-8 px-4 z-10">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 flex gap-2 w-full max-w-2xl mx-auto">
                <input
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendAnnouncement()
                    }
                  }}
                  placeholder="Type an announcement..."
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={sending}
                />
                <button
                  onClick={handleSendAnnouncement}
                  disabled={!newAnnouncement.trim() || sending}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
