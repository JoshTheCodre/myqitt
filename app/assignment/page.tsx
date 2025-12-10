'use client'

import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppShell } from '@/components/layout/app-shell'
import { Calendar, ChevronRight, Plus, Unplug, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { AssignmentService } from '@/lib/services'
import type { Assignment as ServiceAssignment } from '@/lib/services/assignmentService'

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
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-3 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0`}>
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold text-gray-700 uppercase tracking-wide`}>Total</p>
          <p className={`text-2xl font-bold text-gray-900`}>{total}</p>
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
        </div>
        {hasConnectedUsers ? (
          <div className="relative">
            <button
              onClick={() => setShowInfoPopup(true)}
              className="relative flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 rounded-xl font-bold text-sm transition-all flex-shrink-0"
            >
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75 animate-ping"></span>
              <Unplug className="w-5 h-5 relative" />
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
                      <Unplug className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">Connected to {connectedUsers[0]}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">You&apos;re viewing combined assignments with {connectedUsers[0]}&apos;s work.</p>
                      <p className="text-sm text-gray-600 leading-relaxed">To add or update your own assignments, disconnect from {connectedUsers[0]} first.</p>
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
      <div className="rounded-full mb-4 h-2 bg-gradient-to-r from-gray-300 to-gray-200" />
      
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
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [usersWithoutData, setUsersWithoutData] = useState<string[]>([])
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      loadAssignments()
    } else {
      setAssignments([])
      setLoading(false)
    }
  }, [user?.id])

  const loadAssignments = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await AssignmentService.getAssignments(user.id)
      
      setAssignments(data.assignments)
      setUsersWithoutData(data.usersWithoutData)
      onConnectedUsersChange(data.connectedUserNames)
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (assignmentData: AssignmentDate & { courseCode: string; isOwner?: boolean }) => {
    const params = new URLSearchParams({
      id: assignmentData.id,
      courseCode: assignmentData.courseCode,
      title: assignmentData.title,
      description: assignmentData.description,
      dueDate: assignmentData.label,
      isOwner: (assignmentData.isOwner ?? true).toString()
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

  if (assignments.length === 0 && usersWithoutData.length === 0) {
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

  if (assignments.length === 0 && usersWithoutData.length > 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-12 text-center">
        <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-blue-800 text-base font-medium">
          {usersWithoutData.join(', ')} {usersWithoutData.length === 1 ? 'Has' : 'Have'} Not Added Any Assignment Yet
        </p>
        <p className="text-blue-600 text-sm mt-2">They haven't created their assignments yet. Check back later!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {usersWithoutData.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <svg className="w-10 h-10 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 text-base font-medium">
            {usersWithoutData.join(', ')} {usersWithoutData.length === 1 ? 'has' : 'have'} not added any assignments yet
          </p>
          <p className="text-blue-600 text-sm mt-2">They haven't created their assignments yet. Check back later!</p>
        </div>
      )}
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
                handleDateClick({ ...dateData, courseCode: assignment.courseCode, isOwner: assignment.isOwner })
              }
            }}
          />
        ))}
      </div>
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
      const data = await AssignmentService.getAssignments(user.id)
      const totalCount = data.assignments.reduce((sum, assignment) => sum + assignment.assignmentCount, 0)
      setTotalAssignments(totalCount)
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
