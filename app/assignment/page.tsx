'use client'

import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppShell } from '@/components/layout/app-shell'
import { Calendar, ChevronRight, Plus, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { AssignmentService, type GroupedAssignment, type AssignmentDate, type AssignmentStats } from '@/lib/services'

// ============ TYPES ============
interface AssignmentCardProps {
  courseCode: string
  assignmentCount: number
  submittedCount: number
  dates: AssignmentDate[]
  onDateClick: (dateLabel: string) => void
}

interface AssignmentsListProps {
  router: AppRouterInstance
  onIsCourseRepChange: (isCourseRep: boolean) => void
}

// ============ STATS CARD COMPONENT ============
function StatsCard({ stats }: { stats: AssignmentStats }) {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-around gap-2">
        {/* Total */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>

        {/* Divider */}
        <div className="w-px h-14 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

        {/* Submitted */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">Done</p>
          <p className="text-xl font-bold text-green-700">{stats.submitted}</p>
        </div>

        {/* Divider */}
        <div className="w-px h-14 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

        {/* Overdue */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Late</p>
          <p className="text-xl font-bold text-red-700">{stats.overdue}</p>
        </div>
      </div>
    </div>
  )
}

// ============ HEADER COMPONENT ============
function Header({ onAddClick, isCourseRep }: { onAddClick: () => void; isCourseRep: boolean }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Assignments</h1>
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
  onDateClick
}: AssignmentCardProps) {
  const completionPercentage = assignmentCount > 0 ? Math.round((submittedCount / assignmentCount) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-6">
      {/* Top gradient bar */}
      <div className="rounded-full mb-4 h-2 bg-gradient-to-r from-blue-200 to-blue-100" />
      
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
              {item.submitted && <span className="ml-1">✓</span>}
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ ASSIGNMENTS LIST COMPONENT ============
function AssignmentsList({ router, onIsCourseRepChange }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<GroupedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isCourseRep, setIsCourseRep] = useState(false)
  const { user, profile, initialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) return
    
    if (user && profile) {
      loadAssignments()
    } else {
      setAssignments([])
      setLoading(false)
    }
  }, [user?.id, profile?.id, initialized])

  const loadAssignments = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await AssignmentService.getAssignments(user.id)
      
      setAssignments(data.assignments)
      setIsCourseRep(data.isCourseRep)
      onIsCourseRepChange(data.isCourseRep)
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setAssignments([])
    } finally {
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
          <p className="text-gray-500 text-sm mt-2">Your course rep hasn&apos;t added any assignments yet</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.courseCode}
          courseCode={assignment.courseCode}
          assignmentCount={assignment.assignmentCount}
          submittedCount={assignment.submittedCount}
          dates={assignment.dates}
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
  const [stats, setStats] = useState<AssignmentStats>({ total: 0, submitted: 0, pending: 0, overdue: 0 })
  const [isCourseRep, setIsCourseRep] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (user && mounted) {
        await fetchStats()
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchStats = async () => {
    if (!user) return

    try {
      const statsData = await AssignmentService.getAssignmentStats(user.id)
      setStats(statsData)
      
      const data = await AssignmentService.getAssignments(user.id)
      setIsCourseRep(data.isCourseRep)
    } catch (error) {
      console.error('Failed to fetch assignment stats:', error)
      setStats({ total: 0, submitted: 0, pending: 0, overdue: 0 })
    }
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header onAddClick={() => router.push('/assignment/add')} isCourseRep={isCourseRep} />
          
          <div className="mt-6">
            <StatsCard stats={stats} />
          </div>
          
          <div className="mt-4">
            <AssignmentsList router={router} onIsCourseRepChange={setIsCourseRep} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
