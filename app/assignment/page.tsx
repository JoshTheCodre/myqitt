'use client'

import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppShell } from '@/components/layout/app-shell'
import { Calendar, ChevronRight, Plus } from 'lucide-react'
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
}

interface Assignment {
  id: string
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
}

interface AssignmentCardProps {
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
  onDateClick: (dateLabel: string) => void
}

interface AssignmentsListProps {
  router: AppRouterInstance
}

// ============ STATS CARD COMPONENT ============
function StatsCard({ total }: { total: number }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-blue-900">{total}</p>
        </div>
      </div>
    </div>
  )
}

// ============ HEADER COMPONENT ============
function Header({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Assignments</h1>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Add</span>
      </button>
    </div>
  )
}

// ============ ASSIGNMENT CARD COMPONENT ============
function AssignmentCard({ 
  courseCode, 
  assignmentCount, 
  dates,
  onDateClick 
}: AssignmentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-6">
      {/* Top gradient bar */}
      <div className="rounded-full mb-4 h-2" style={{ background: 'linear-gradient(to right, #E8ECFF, #C8DBFF)' }} />
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{courseCode}</h3>
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
                backgroundColor: '#E8ECFF',
                color: '#0A32F8',
                border: '1px solid #C8DBFF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C8DBFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E8ECFF'
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
function AssignmentsList({ router }: AssignmentsListProps) {
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

      // Fetch user's assignments (JSON structure)
      const { data: assignmentRecord, error: assignmentError } = await supabase
        .from('assignments')
        .select('assignments_data')
        .eq('user_id', user.id)
        .single()

      if (assignmentError) {
        if (assignmentError.code === 'PGRST116') {
          console.log('📋 No assignments found for user')
        } else {
          console.error('❌ Error fetching assignments:', assignmentError)
        }
      }

      console.log('📊 Assignment data:', assignmentRecord)

      let allItems: Array<{
        id: string
        course_code: string
        title: string
        description: string
        due_date: string
        created_at: string
      }> = []

      if (assignmentRecord && assignmentRecord.assignments_data) {
        allItems = assignmentRecord.assignments_data as any
      }

      if (allItems && allItems.length > 0) {
        const groupedAssignments = allItems.reduce((acc, item) => {
          const existing = acc.find(a => a.courseCode === item.course_code)
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
              dates: [assignmentDate]
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
        <p className="text-gray-500 text-sm mt-2">Assignments you create will appear here</p>
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
          <Header onAddClick={() => router.push('/assignment/add')} />
          
          <div className="mt-6">
            <StatsCard total={totalAssignments} />
          </div>
          
          <div className="mt-4">
            <AssignmentsList router={router} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
