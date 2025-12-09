'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Users, FileText, Clock, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { checkConnection, connectToUser, disconnectFromUser } from '@/lib/connections/connectionService'
import toast from 'react-hot-toast'

// ============ TYPES ============
interface Classmate {
  id: string
  name: string
  followers: number
  hasAssignments: boolean
  hasTimetable: boolean
  isConnected: boolean
}

interface HeaderProps {
  classmateCount: number
}

interface ClassmateCardProps {
  name: string
  followers: number
  hasAssignments: boolean
  hasTimetable: boolean
  isConnected: boolean
  onConnect: (id: string) => void
  classmateId: string
  isLoading?: boolean
}

interface ClassmatesListProps {
  onConnectionChange: () => void
  onCountUpdate: (count: number) => void
}


// ============ HEADER COMPONENT ============
function Header({ classmateCount }: HeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Classmates</h1>
        <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm font-semibold">{classmateCount}</div>
      </div>
      <p className="text-gray-500 mt-2 text-sm">Connect with peers in your class</p>
    </div>
  )
}

// ============ CLASSMATE CARD COMPONENT ============
function ClassmateCard({ 
  name, 
  followers,
  hasAssignments,
  hasTimetable,
  isConnected,
  onConnect,
  classmateId,
  isLoading = false
}: ClassmateCardProps) {
  return (
  <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 overflow-hidden group relative">
    <div className="p-5 flex flex-col gap-4">
      {/* Connect button - top right rectangular */}
      <button
        onClick={() => onConnect(classmateId)}
        disabled={isLoading}
        className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border disabled:opacity-50 disabled:cursor-not-allowed ${
          isConnected
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
        }`}
      >
        {isLoading ? '...' : isConnected ? '✓ Connected' : 'Connect'}
      </button>

      {/* Avatar and header */}
      <div className="flex items-center gap-3 pr-20">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg border border-blue-100 group-hover:border-blue-200 transition-colors">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate">{name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{followers} followers</span>
          </div>
        </div>
      </div>

      {/* Status items */}
      <div className="space-y-2">
        {/* Assignments */}
        <div className="flex items-center gap-2.5">
          <FileText className={`w-4 h-4 flex-shrink-0 ${
            hasAssignments ? 'text-blue-600' : 'text-gray-300'
          }`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Assignments</span>
              <span className="text-gray-500 mx-1.5">•</span>
              <span className={hasAssignments ? 'font-medium text-gray-700' : 'text-gray-400'}>
                {hasAssignments ? 'Shared' : 'None'}
              </span>
            </p>
          </div>
        </div>

        {/* Timetable */}
        <div className="flex items-center gap-2.5">
          <Clock className={`w-4 h-4 flex-shrink-0 ${
            hasTimetable ? 'text-blue-600' : 'text-gray-300'
          }`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Timetable</span>
              <span className="text-gray-500 mx-1.5">•</span>
              <span className={hasTimetable ? 'font-medium text-gray-700' : 'text-gray-400'}>
                {hasTimetable ? 'Shared' : 'None'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

// ============ CLASSMATES LIST COMPONENT ============
function ClassmatesList({ onConnectionChange, onCountUpdate }: ClassmatesListProps) {
  const { user } = useAuthStore()
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const loadClassmates = async () => {
      if (user && mounted) {
        await fetchClassmates()
      } else if (mounted) {
        setLoading(false)
      }
    }
    
    setLoading(true)
    loadClassmates()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchClassmates = async () => {
    if (!user) return

    try {
      // Fetch current user's profile
      const { data: profile } = await supabase
        .from('users')
        .select('school, department, level')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      // Fetch all users in the same school, department, and level (excluding current user)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, followers_count')
        .eq('school', profile.school)
        .eq('department', profile.department)
        .eq('level', profile.level)
        .neq('id', user.id)

      if (usersError) {
        console.error('Users fetch error:', usersError)
        setClassmates([])
        setLoading(false)
        return
      }

      if (!users || users.length === 0) {
        setClassmates([])
        setLoading(false)
        return
      }

      // Get current user's connections
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', user.id)

      const connectedIds = new Set(connections?.map(c => c.following_id) || [])

      // Get all user IDs
      const userIds = users.map(u => u.id)
      console.log('👥 Fetching data for user IDs:', userIds)

      // Batch fetch assignments for all users
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('user_id, assignments_data')
        .in('user_id', userIds)

      console.log('📊 Assignments query result:', { allAssignments, assignmentsError })

      // Batch fetch timetables for all users
      const { data: allTimetables, error: timetablesError } = await supabase
        .from('timetable')
        .select('user_id, timetable_data')
        .in('user_id', userIds)

      console.log('📅 Timetables query result:', { allTimetables, timetablesError })

      // Create maps for quick lookup
      const assignmentsMap = new Map(
        allAssignments?.map(a => {
          const hasData = Array.isArray(a.assignments_data) && a.assignments_data.length > 0
          console.log(`📋 User ${a.user_id.substring(0, 8)}...: has ${Array.isArray(a.assignments_data) ? a.assignments_data.length : 0} assignments`)
          return [a.user_id, hasData]
        }) || []
      )

      const timetablesMap = new Map(
        allTimetables?.map(t => {
          // Check if timetable_data exists and has at least one day with classes
          const hasData = t.timetable_data && 
            typeof t.timetable_data === 'object' &&
            Object.values(t.timetable_data).some((day: any) => 
              Array.isArray(day) && day.length > 0
            )
          const totalClasses = t.timetable_data ? 
            Object.values(t.timetable_data).reduce((sum: number, day: any) => 
              sum + (Array.isArray(day) ? day.length : 0), 0
            ) : 0
          console.log(`📆 User ${t.user_id.substring(0, 8)}...: has ${totalClasses} classes, hasData=${hasData}`)
          return [t.user_id, hasData]
        }) || []
      )

      console.log('🗺️ Final maps:', {
        assignmentsMap: Array.from(assignmentsMap.entries()),
        timetablesMap: Array.from(timetablesMap.entries())
      })

      // Map classmates with their data
      const classmatesWithData = users.map(classmate => ({
        id: classmate.id,
        name: classmate.name || 'Unknown',
        followers: classmate.followers_count || 0,
        hasAssignments: assignmentsMap.get(classmate.id) || false,
        hasTimetable: timetablesMap.get(classmate.id) || false,
        isConnected: connectedIds.has(classmate.id),
      }))

      setClassmates(classmatesWithData)
      onCountUpdate(classmatesWithData.length)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch classmates:', error)
      setClassmates([])
      onCountUpdate(0)
      setLoading(false)
    }
  }

  const toggleConnect = async (classmateId: string) => {
    if (!user || connectingId) return

    const classmate = classmates.find(c => c.id === classmateId)
    if (!classmate) return

    setConnectingId(classmateId)

    try {
      if (classmate.isConnected) {
        // Disconnect from user
        const result = await disconnectFromUser(user.id, classmateId)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to disconnect')
        }

        // Update local state
        setClassmates(prev =>
          prev.map(c =>
            c.id === classmateId
              ? { ...c, isConnected: false, followers: Math.max(0, c.followers - 1) }
              : c
          )
        )
        
        toast.success('Successfully disconnected')
      } else {
        // Connect to user
        const result = await connectToUser(user.id, classmateId)
        
        if (!result.success) {
          toast.error(result.error || 'Failed to connect')
          setConnectingId(null)
          return
        }

        // Update local state
        setClassmates(prev =>
          prev.map(c =>
            c.id === classmateId
              ? { ...c, isConnected: true, followers: c.followers + 1 }
              : c
          )
        )
        
        toast.success('Successfully connected!')
      }

      // Notify parent to update count
      onConnectionChange()
    } catch (error) {
      console.error('Failed to toggle connection:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update connection')
    } finally {
      setConnectingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 overflow-hidden relative">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            
            {/* Connect button skeleton */}
            <div className="absolute top-4 right-4 h-7 w-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full"></div>
            
            {/* Avatar and header */}
            <div className="flex items-center gap-3 pr-20 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-md w-28 mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-md w-20"></div>
              </div>
            </div>
            
            {/* Status items */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-32"></div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-28"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (classmates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">No classmates found in your class</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {classmates.map((classmate) => (
        <ClassmateCard
          key={classmate.id}
          classmateId={classmate.id}
          name={classmate.name}
          followers={classmate.followers}
          hasAssignments={classmate.hasAssignments}
          hasTimetable={classmate.hasTimetable}
          isConnected={classmate.isConnected}
          onConnect={toggleConnect}
          isLoading={connectingId === classmate.id}
        />
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function ClassmatesPage() {
  const [classmateCount, setClassmateCount] = useState(0)

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-7xl px-4 py-8 pb-24 lg:pb-8">
          <Header classmateCount={classmateCount} />
          <div className="mt-12">
            <ClassmatesList 
              onConnectionChange={() => {}} 
              onCountUpdate={setClassmateCount}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
