'use client'

import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppShell } from '@/components/layout/app-shell'
import { Calendar, ChevronRight, Plus, Info, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

// ============ TYPES ============
interface AssignmentDate {
  date: string
  label: string
  title: string
  description: string
  submissionType: string
  lecturer: string
  id: string
  ownerName?: string  // ✅ NEW: Name of connected classmate
}

interface Assignment {
  id: string
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
  isOwner?: boolean  // ✅ NEW: Whether this is user's own assignment
  ownerName?: string  // ✅ NEW: Name if from connected classmate
}

interface AssignmentCardProps {
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
  onDateClick: (dateLabel: string) => void
  isOwner?: boolean  // ✅ NEW
  ownerName?: string  // ✅ NEW
}

interface AssignmentsListProps {
  router: AppRouterInstance
  onConnectedUsersChange: (users: string[]) => void
}

// ============ STATS CARD COMPONENT ============
function StatsCard({ total, hasConnectedUsers }: { total: number; hasConnectedUsers?: boolean }) {
  return (
    <div className={`bg-gradient-to-br ${hasConnectedUsers ? 'from-emerald-50 to-teal-50 border-emerald-200' : 'from-blue-50 to-indigo-50 border-blue-200'} border rounded-xl p-3 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${hasConnectedUsers ? 'from-emerald-500 to-teal-500' : 'from-blue-600 to-blue-500'} flex items-center justify-center flex-shrink-0`}>
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold ${hasConnectedUsers ? 'text-emerald-600' : 'text-blue-600'} uppercase tracking-wide`}>Total</p>
          <p className={`text-2xl font-bold ${hasConnectedUsers ? 'text-emerald-900' : 'text-blue-900'}`}>{total}</p>
        </div>
      </div>
    </div>
  )
}

// ============ HEADER COMPONENT ============
function Header({ onAddClick, connectedUsers }: { onAddClick: () => void; connectedUsers?: string[] }) {
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const router = useRouter()
  const hasConnectedUsers = connectedUsers && connectedUsers.length > 0

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Assignments</h1>
          {hasConnectedUsers && (
            <div className="absolute -top-2 -right-20 ">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-gray-500 rounded-full shadow-lg">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-xs font-bold text-white">{connectedUsers[0]}</span>
              </div>
            </div>
          )}
        </div>
        {hasConnectedUsers ? (
          <div className="relative">
            <button
              onClick={() => setShowInfoPopup(true)}
              className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 rounded-xl font-bold text-sm transition-all flex-shrink-0"
            >
              <Info className="w-5 h-5" />
            </button>
            {showInfoPopup && (
              <>
                <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowInfoPopup(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => setShowInfoPopup(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">Connected to {connectedUsers[0]}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">To add or update your own assignments, you need to disconnect from {connectedUsers[0]} first.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => router.push('/classmates')}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
                    >
                      Go to Classmates
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-3">Need help? Contact support</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
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
  dates,
  onDateClick,
  isOwner = true,  // ✅ NEW
  ownerName  // ✅ NEW
}: AssignmentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-6">
      {/* Top gradient bar */}
      <div className="rounded-full mb-4 h-2" style={{ background: isOwner ? 'linear-gradient(to right, #E8ECFF, #C8DBFF)' : 'linear-gradient(to right, #d1fae5, #a7f3d0)' }} />
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{courseCode}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{assignmentCount} assignment{assignmentCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Dates</p>
        <div className="flex flex-wrap gap-2">
          {dates.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onDateClick(item.label)}
              className="px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-colors"
              style={{ 
                backgroundColor: isOwner ? '#E8ECFF' : '#d1fae5',
                color: isOwner ? '#0A32F8' : '#047857',
                border: isOwner ? '1px solid #C8DBFF' : '1px solid #a7f3d0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isOwner ? '#C8DBFF' : '#a7f3d0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isOwner ? '#E8ECFF' : '#d1fae5'
              }}
            >
              <Calendar className="w-3 h-3" />
              <span>{item.label}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ ASSIGNMENTS LIST COMPONENT ============
function AssignmentsList({ router, onConnectedUsersChange }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (user && mounted) {
        await fetchAssignments()
      } else if (mounted) {
        setAssignments([])
        setLoading(false)
      }
    }
    
    setLoading(true)
    loadData()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchAssignments = async () => {
    if (!user) {
      console.log('❌ No user found, skipping assignments fetch')
      return
    }

    try {
      console.log('🔍 Fetching assignments for user:', user.id)

      let allItems: Array<{
        id: string
        course_code: string
        title: string
        description: string
        due_date: string
        created_at: string
        ownerName?: string
        isOwner?: boolean
      }> = []

      // ✅ 1. Fetch user's own assignments
      const { data: assignmentRecord, error: assignmentError } = await supabase
        .from('assignments')
        .select('assignments_data')
        .eq('user_id', user.id)
        .single()

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        console.error('❌ Error fetching assignments:', assignmentError)
      }

      if (assignmentRecord && assignmentRecord.assignments_data) {
        const ownAssignments = (assignmentRecord.assignments_data as any[]).map(a => ({
          ...a,
          isOwner: true
        }))
        allItems.push(...ownAssignments)
      }

      // ✅ 2. Fetch connected classmates' assignments
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', user.id)

      if (connections && connections.length > 0) {
        const connectedUserIds = connections.map(c => c.following_id)
        console.log('👥 Fetching assignments for connected users:', connectedUserIds)

        // Fetch connected users' names
        const { data: connectedUsersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', connectedUserIds)

        const userNamesMap = new Map(
          connectedUsersData?.map(u => [u.id, u.name]) || []
        )

        // Store connected users' names for header display
        onConnectedUsersChange(connectedUsersData?.map(u => u.name) || [])

        // Fetch connected users' assignments
        const { data: connectedAssignments } = await supabase
          .from('assignments')
          .select('user_id, assignments_data')
          .in('user_id', connectedUserIds)

        connectedAssignments?.forEach(record => {
          if (record.assignments_data && Array.isArray(record.assignments_data)) {
            const ownerName = userNamesMap.get(record.user_id) || 'Classmate'
            const assignments = record.assignments_data.map((a: any) => ({
              ...a,
              isOwner: false,
              ownerName
            }))
            allItems.push(...assignments)
          }
        })

        console.log('✅ Added assignments from', connectedAssignments?.length || 0, 'connected users')
      }

      if (allItems && allItems.length > 0) {
        const groupedAssignments = allItems.reduce((acc, item) => {
          const existing = acc.find(a => a.courseCode === item.course_code && a.ownerName === item.ownerName)
          const dueDate = new Date(item.due_date)
          const dateLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          
          const assignmentDate: AssignmentDate = {
            id: item.id,
            date: item.due_date,
            label: dateLabel,
            title: item.title,
            description: item.description || '',
            submissionType: 'PDF Report',
            lecturer: 'TBA'
          }

          if (existing) {
            existing.dates.push(assignmentDate)
            existing.assignmentCount++
          } else {
            acc.push({
              id: item.id,
              courseCode: item.course_code,
              assignmentCount: 1,
              dates: [assignmentDate],
              isOwner: item.isOwner !== false,
              ownerName: item.ownerName
            })
          }

          return acc
        }, [] as Assignment[])

        setAssignments(groupedAssignments)
        console.log('✅ Assignments loaded from database:', allItems.length, 'assignments')
      } else {
        console.log('📋 No assignments found')
        setAssignments([])
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      toast.error('Failed to load assignments')
      setAssignments([])
      setLoading(false)
    }
  }

  const handleDateClick = (assignmentData: AssignmentDate & { courseCode: string }) => {
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
        <p className="text-gray-500 text-sm mt-2">Create your first assignment or connect with a classmate to see theirs</p>
        <button
          onClick={() => router.push('/classmates')}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Connect with Classmates</span>
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          courseCode={assignment.courseCode}
          assignmentCount={assignment.assignmentCount}
          dates={assignment.dates}
          isOwner={assignment.isOwner}
          ownerName={assignment.ownerName}
          onDateClick={(dateLabel) => {
            const dateData = assignment.dates.find(d => d.label === dateLabel)
            if (dateData) {
              handleDateClick({ ...dateData, courseCode: assignment.courseCode })
            }
          }}
        />
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function AssignmentPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (user && mounted) {
        await fetchTotalAssignments()
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchTotalAssignments = async () => {
    if (!user) return

    try {
      const { data: assignmentRecord } = await supabase
        .from('assignments')
        .select('assignments_data')
        .eq('user_id', user.id)
        .single()

      if (assignmentRecord && assignmentRecord.assignments_data) {
        const assignments = assignmentRecord.assignments_data as any[]
        setTotalAssignments(assignments.length)
      } else {
        setTotalAssignments(0)
      }
    } catch (error) {
      console.error('Failed to fetch assignment count:', error)
      setTotalAssignments(0)
    }
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header onAddClick={() => router.push('/assignment/add')} connectedUsers={connectedUsers} />
          
          <div className="mt-6">
            <StatsCard total={totalAssignments} hasConnectedUsers={connectedUsers.length > 0} />
          </div>
          
          <div className="mt-4">
            <AssignmentsList router={router} onConnectedUsersChange={setConnectedUsers} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
