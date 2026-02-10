'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppShell } from '@/utils/layout/app-shell'
import { Calendar, ChevronRight, Plus, BadgeCheck, CircleCheck, Clock, Eye } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/app/auth/store/authStore'
import { useAssignmentStore, type GroupedAssignment, type AssignmentDate, type AssignmentStats } from '@/app/assignment/store/assignmentStore'

// ============ TYPES ============
interface AssignmentCardProps {
  courseCode: string
  assignmentCount: number
  submittedCount: number
  dates: AssignmentDate[]
  onDateClick: (dateLabel: string) => void
  isNew?: boolean
}

interface AssignmentsListProps {
  router: AppRouterInstance
  onIsCourseRepChange: (isCourseRep: boolean) => void
  onUnreadCountChange?: (count: number) => void
}

// ============ STATS CARD COMPONENT ============
function StatsCard({ stats }: { stats: AssignmentStats }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="grid grid-cols-3 divide-x divide-gray-200 -mx-2">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-800" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center">
            <CircleCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Done</p>
            <p className="text-2xl font-bold text-green-700">{stats.submitted}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Late</p>
            <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ HEADER COMPONENT ============
function Header({ onAddClick, isCourseRep, unreadCount }: { 
  onAddClick: () => void; 
  isCourseRep: boolean;
  unreadCount?: number;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Assignments</h1>
          {unreadCount !== undefined && unreadCount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-sm font-bold text-blue-600">{unreadCount}</span>
              <span className="text-sm text-gray-700">new assignment{unreadCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {isCourseRep && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ============ ASSIGNMENT CARD COMPONENT ============
function AssignmentCard({
  courseCode,
  assignmentCount,
  submittedCount,
  dates,
  onDateClick,
  isNew = false
}: AssignmentCardProps) {
  const completionPercentage = assignmentCount > 0 ? Math.round((submittedCount / assignmentCount) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all p-6 relative">
      {isNew && (
        <div className="absolute top-3 right-3">
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
            NEW
          </span>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{courseCode}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{assignmentCount} assignment{assignmentCount > 1 ? 's' : ''}</p>
          
          {/* Mini stats */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700">{submittedCount}/{assignmentCount}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{completionPercentage}% completed</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Dates</p>
        <div className="flex flex-wrap gap-2">
          {dates.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onDateClick(item.label)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-colors ${
                item.submitted 
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{item.label}</span>
              {item.submitted && <BadgeCheck className="w-3 h-3 text-green-700" />}
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ ASSIGNMENTS LIST COMPONENT ============
function AssignmentsList({ router, onIsCourseRepChange, onUnreadCountChange }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<GroupedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isCourseRep, setIsCourseRep] = useState(false)
  const [unviewedIds, setUnviewedIds] = useState<Set<string>>(new Set())
  const { user, profile } = useAuthStore()
  const status = useAuthStore((s) => s.status)
  const { fetchAssignments, fetchUnviewedIds, markAsViewed, fetchUnreadCount } = useAssignmentStore()

  useEffect(() => {
    if (status !== 'authenticated') return
    
    if (user && profile) {
      loadAssignments()
    } else {
      setAssignments([])
      setLoading(false)
    }
  }, [user?.id, profile?.id, status])

  const loadAssignments = async () => {
    const loggedInUserId = user?.id
    
    if (!loggedInUserId) return

    setLoading(true)
    try {
      await fetchAssignments()
      const data = useAssignmentStore.getState().assignments
      
      // Get unviewed assignment IDs
      await fetchUnviewedIds()
      const unviewed = useAssignmentStore.getState().unviewedIds
      setUnviewedIds(new Set(unviewed))
      
      // Check if user is course rep
      const assignmentState = useAssignmentStore.getState()
      const courseRepStatus = assignmentState.isCourseRep
      setIsCourseRep(courseRepStatus)
      onIsCourseRepChange(courseRepStatus)
      
      // Everyone sees assignments
      setAssignments(data)
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = async (assignmentData: AssignmentDate & { courseCode: string }) => {
    // Mark as viewed
    if (user?.id) {
      const wasUnviewed = unviewedIds.has(assignmentData.id)
      await markAsViewed(assignmentData.id)
      // Remove from unviewed set
      setUnviewedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(assignmentData.id)
        return newSet
      })
      // Update parent unread count
      if (wasUnviewed && onUnreadCountChange) {
        await fetchUnreadCount()
        const newCount = useAssignmentStore.getState().unreadCount
        onUnreadCountChange(newCount)
      }
    }
    
    const params = new URLSearchParams({
      id: assignmentData.id,
      courseCode: assignmentData.courseCode,
      title: assignmentData.title,
      description: assignmentData.description,
      dueDate: assignmentData.label
    })
    router.push(`/assignment/detail?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-base font-medium">No assignments yet</p>
        {isCourseRep ? (
          <>
            <p className="text-gray-500 text-sm mt-2">Add assignments for your classmates to see</p>
            <button
              onClick={() => router.push('/assignment/add')}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Assignment</span>
            </button>
          </>
        ) : (
          <p className="text-gray-500 text-sm mt-2">The course rep hasn&apos;t added any assignments yet</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assignments.map((assignment) => {
        // Check if any of the assignment's dates are unviewed
        const hasUnviewed = assignment.dates.some(date => unviewedIds.has(date.id))
        
        return (
          <AssignmentCard
            key={assignment.courseCode}
            courseCode={assignment.courseCode}
            assignmentCount={assignment.assignmentCount}
            submittedCount={assignment.submittedCount}
            dates={assignment.dates}
            isNew={hasUnviewed}
            onDateClick={(dateLabel) => {
              const dateData = assignment.dates.find(d => d.label === dateLabel)
              if (dateData) {
                handleDateClick({ ...dateData, courseCode: assignment.courseCode })
              }
            }}
          />
        )
      })}
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function AssignmentPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AssignmentStats>({ total: 0, submitted: 0, pending: 0, overdue: 0 })
  const [isCourseRep, setIsCourseRep] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const { fetchStats, fetchUnreadCount: fetchAssignmentUnreadCount } = useAssignmentStore()

  const fetchStatsData = useCallback(async (currentUserId: string) => {
    try {
      await fetchStats()
      const statsData = useAssignmentStore.getState().stats
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch assignment stats:', error)
      setStats({ total: 0, submitted: 0, pending: 0, overdue: 0 })
    }
  }, [fetchStats])

  // Load data on mount and when pathname changes (e.g., coming back from detail page)
  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (user && mounted) {
        // Stats are always personal to current user
        await fetchStatsData(user.id)
        
        // Fetch unread count
        await fetchAssignmentUnreadCount()
        setUnreadCount(useAssignmentStore.getState().unreadCount)
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
  }, [user?.id, pathname, refreshKey, fetchStatsData, fetchAssignmentUnreadCount])

  // Force refresh when page gains focus (user returns from another page)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 overflow-y-auto h-full relative overflow-x-hidden">
          
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-6">
            <Header 
              onAddClick={() => router.push('/assignment/add')} 
              isCourseRep={isCourseRep}
              unreadCount={unreadCount}
            />
            
            <div className="mt-6">
              <StatsCard stats={stats} />
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="px-4 py-6 pb-24 lg:pb-8">
            <AssignmentsList 
              router={router} 
              onIsCourseRepChange={setIsCourseRep}
              onUnreadCountChange={setUnreadCount}
            />
          </div>
          
        </div>
      </div>
    </AppShell>
  )
}
