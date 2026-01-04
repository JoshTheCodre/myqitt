'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeadsetIcon, ArrowRight, Clock, Plus, AlertCircle, MapPin, Megaphone, ChevronRight, Users, FileText } from 'lucide-react'
import { useAuthStore, UserProfile } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
import { ClassMenu } from '@/components/class-menu'
import { UpdateTodaysClassModal } from '@/components/update-todays-class-modal'
import { ConnectionModal } from '@/components/connection-modal'
import { TodaysClassService, type MergedClass, ClassmateService, type Classmate } from '@/lib/services'
import { ConnectionService } from '@/lib/services/connectionService'

// ============ HELPER FUNCTIONS ============
const getInitials = (name?: string) => {
  if (!name) return 'QZ'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

const formatDepartmentDisplay = (dept?: string) => {
  if (!dept) return 'N/A'
  
  // Convert snake_case to Title Case and remove underscores
  const formatted = dept
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  // Limit to first 2 words, add ellipsis if longer
  const words = formatted.split(' ')
  if (words.length > 2) {
    return words.slice(0, 2).join(' ') + '...'
  }
  return formatted
}

// Get class status based on current time
const getClassStatus = (startTime: string, endTime: string): 'upcoming' | 'ongoing' | 'completed' => {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  // Parse time - handle both "09:00" and "9:00AM" formats
  const parseTime = (time: string): number => {
    // Remove any whitespace
    time = time.trim()
    
    // If it has AM/PM, convert to 24-hour
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
      const cleanTime = time.toLowerCase().replace(/\s+/g, '')
      const match = cleanTime.match(/(\d+):(\d+)(am|pm)/)
      if (match) {
        let hour = parseInt(match[1])
        const minute = parseInt(match[2])
        const meridiem = match[3]
        
        if (meridiem === 'pm' && hour !== 12) hour += 12
        if (meridiem === 'am' && hour === 12) hour = 0
        
        return hour * 60 + minute
      }
    }
    
    // Already in 24-hour format (HH:MM)
    const [hour, minute] = time.split(':').map(Number)
    return hour * 60 + minute
  }
  
  const classStartMinutes = parseTime(startTime)
  const classEndMinutes = parseTime(endTime)
  
  if (currentMinutes < classStartMinutes) return 'upcoming'
  if (currentMinutes >= classStartMinutes && currentMinutes < classEndMinutes) return 'ongoing'
  return 'completed'
}

// ============ HEADER COMPONENT ============
function Header({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="flex items-start justify-between ">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Hello, {profile?.name || 'Guest'}</h1>
        <p className="text-xs font-semibold text-gray-700 mt-1 md:mt-2">{formatDepartmentDisplay(profile?.department)} <span className="text-green-500">•</span> {profile?.level ? `${profile.level}00 Level` : 'N/A'}</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
          onClick={() => {
            const message = encodeURIComponent('Hi, the issue I&apos;m facing: ')
            window.open(`https://wa.me/2349034954069?text=${message}`, '_blank')
          }}
        >
          <HeadsetIcon className="w-6 h-6 text-blue-600" />
        </button>
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
            <span className="text-white font-bold text-lg">{getInitials(profile?.name)}</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

// ============ CATCH UP SECTION ============
// Dummy data for catch-up items with different types
interface CatchUpDisplayItem {
  id: string
  type: 'deadline' | 'reminder' | 'update' | 'announcement'
  title: string
  subtitle?: string
  time?: string
}

const dummyCatchUpItems: CatchUpDisplayItem[] = [
  { id: '1', type: 'deadline', title: 'CSC 401 Assignment Due', subtitle: 'Data Structures', time: 'Tomorrow' },
  { id: '2', type: 'reminder', title: 'Group Meeting', subtitle: 'Project Discussion', time: '2:00 PM' },
  { id: '3', type: 'update', title: 'Lecture Venue Changed', subtitle: 'CSC 305 moved to Hall B', time: '1h ago' },
  { id: '4', type: 'announcement', title: 'New Course Material', subtitle: 'Check department page', time: '3h ago' },
]

function CatchUpSection() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const getItemIcon = (type: CatchUpDisplayItem['type']) => {
    switch (type) {
      case 'deadline':
        return (
          <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-red-400" />
          </div>
        )
      case 'reminder':
        return (
          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-amber-400" />
          </div>
        )
      case 'update':
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ArrowRight className="w-3 h-3 text-emerald-400" />
          </div>
        )
      case 'announcement':
        return (
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-3 h-3 text-blue-400" />
          </div>
        )
    }
  }

  if (loading) {
    return (
      <section>
        <div className="rounded-xl p-4 border border-gray-200 bg-white animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (dummyCatchUpItems.length === 0) {
    return (
      <section>
        <div className="rounded-xl p-5 border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">You&apos;re All Caught Up! 🎉</h3>
            <p className="text-xs text-gray-500">No new items at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="rounded-xl p-4 border border-gray-200 bg-white">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Catch Up</h2>
        <div className="space-y-2">
          {dummyCatchUpItems.map((item) => (
            <div 
              key={item.id} 
              className="flex items-start gap-2.5 p-2 -mx-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              {getItemIcon(item.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate leading-tight">
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">
                  {item.subtitle}
                </p>
              </div>
              {item.time && (
                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{item.time}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ CLASSMATES SECTION ============
function ClassmatesSection({ userId, profile }: { userId?: string, profile: UserProfile | null }) {
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (userId && profile?.school && profile?.department && profile?.level) {
      fetchClassmates()
    } else {
      setLoading(false)
    }
  }, [userId, profile?.school, profile?.department, profile?.level])

  const fetchClassmates = async () => {
    if (!userId || !profile?.school || !profile?.department || !profile?.level) return

    try {
      setLoading(true)
      const data = await ClassmateService.getClassmates(
        userId,
        profile.school,
        profile.department,
        profile.level
      )
      setClassmates(data)
    } catch (error) {
      console.error('Error fetching classmates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (classmate: Classmate) => {
    if (!userId) return
    
    if (classmate.isConnected) {
      setConnectingId(classmate.id)
      try {
        await ConnectionService.disconnectUser(userId, classmate.id)
        setClassmates(prev => prev.map(c => 
          c.id === classmate.id ? { ...c, isConnected: false } : c
        ))
      } catch (error) {
        console.error('Error disconnecting:', error)
      } finally {
        setConnectingId(null)
      }
    } else {
      setSelectedClassmate(classmate)
      setShowModal(true)
    }
  }

  const handleConnectionComplete = async (type: 'timetable' | 'assignments' | 'both') => {
    if (!userId || !selectedClassmate) return
    
    setConnectingId(selectedClassmate.id)
    try {
      await ConnectionService.connectToUser(userId, selectedClassmate.id, type)
      setClassmates(prev => prev.map(c => 
        c.id === selectedClassmate.id ? { ...c, isConnected: true } : c
      ))
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setConnectingId(null)
      setShowModal(false)
      setSelectedClassmate(null)
    }
  }

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Classmates</h2>
          <Link href="/classmates" className="text-sm text-blue-600 font-medium hover:text-blue-700">
            See All
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-32 bg-white rounded-xl p-3 border border-gray-200 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-1"></div>
              <div className="h-6 bg-gray-100 rounded-full w-16 mx-auto mt-2"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (classmates.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Classmates</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">No classmates found yet</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Classmates</h2>
          <Link href="/classmates" className="text-sm text-blue-600 font-medium hover:text-blue-700">
            See All
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
          {classmates.slice(0, 6).map(classmate => (
            <div key={classmate.id} className="flex-shrink-0 w-32 bg-white rounded-xl p-3 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto text-white font-bold text-lg">
                {classmate.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Name */}
              <p className="text-xs font-medium text-gray-900 text-center mt-2 truncate">
                {classmate.name.split(' ')[0]}
              </p>
              
              {/* Connection indicators */}
              {classmate.isConnected && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  {classmate.hasTimetable && (
                    <span className="text-emerald-600">
                      <Clock className="w-3 h-3" />
                    </span>
                  )}
                  {classmate.hasAssignments && (
                    <span className="text-blue-600">
                      <FileText className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}
              
              {/* Connect Button */}
              <button
                onClick={() => handleConnect(classmate)}
                disabled={connectingId === classmate.id}
                className={`w-full mt-2 px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                  connectingId === classmate.id
                    ? 'bg-gray-100 text-gray-400'
                    : classmate.isConnected
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {connectingId === classmate.id 
                  ? '...' 
                  : classmate.isConnected 
                  ? 'Connected' 
                  : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Connection Modal */}
      {selectedClassmate && userId && (
        <ConnectionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedClassmate(null)
          }}
          classmate={{
            id: selectedClassmate.id,
            name: selectedClassmate.name,
            bio: selectedClassmate.bio,
            hasTimetable: selectedClassmate.hasTimetable,
            hasAssignments: selectedClassmate.hasAssignments
          }}
          currentUserId={userId}
          onConnect={handleConnectionComplete}
        />
      )}
    </>
  )
}

// ============ TODAY'S CLASSES COMPONENT ============
function TodaysClasses({ userId }: { userId?: string }) {
  const [classes, setClasses] = useState<MergedClass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<MergedClass | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (userId && mounted) {
        await fetchTodaysClasses()
      } else if (mounted) {
        setClasses([])
        setLoading(false)
      }
    }
    
    setLoading(true)
    loadData()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchTodaysClasses = async () => {
    if (!userId) return

    try {
      setLoading(true)
      
      // Check if user is connected to someone
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)

      setIsConnected(!!(connections && connections.length > 0))

      const todaysClasses = await TodaysClassService.getTodaysClasses(userId)
      // Sort by start time (earliest first) - handle both 24h and 12h formats
      const sortedClasses = todaysClasses.sort((a, b) => {
        const timeToMinutes = (time: string) => {
          // Handle both "09:00" and "9:00AM" formats
          const cleanTime = time.replace(/\s/g, '').toUpperCase()
          const isPM = cleanTime.includes('PM')
          const isAM = cleanTime.includes('AM')
          
          const timeOnly = cleanTime.replace(/AM|PM/g, '')
          const [hoursStr, minutesStr] = timeOnly.split(':')
          let hours = parseInt(hoursStr, 10)
          const minutes = parseInt(minutesStr || '0', 10)
          
          // Convert to 24-hour format if AM/PM is present
          if (isPM && hours !== 12) {
            hours += 12
          } else if (isAM && hours === 12) {
            hours = 0
          }
          
          return hours * 60 + minutes
        }
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
      })
      console.log('Loaded today\'s classes:', sortedClasses.length, 'classes')
      setClasses(sortedClasses)
    } catch (error) {
      console.error('Failed to fetch today\'s classes:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClass = (cls: MergedClass) => {
    // Don't allow updates if viewing connected user's classes
    if (isConnected) return
    
    setSelectedClass(cls)
    setShowUpdateModal(true)
  }

  const handleCloseModal = () => {
    setShowUpdateModal(false)
    setSelectedClass(null)
  }

  const handleClassUpdated = () => {
    fetchTodaysClasses()
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Today&apos;s Classes</h2>
        <div className="space-y-2 md:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg md:rounded-xl p-5 md:p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    
    // If already formatted with am/pm, just format it properly
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
      const cleanTime = time.toLowerCase().replace(/\s+/g, '')
      const match = cleanTime.match(/(\d+):(\d+)(am|pm)/)
      if (match) {
        return `${match[1]}:${match[2]}${match[3].toUpperCase()}`
      }
      return time
    }
    
    // Otherwise convert from 24-hour format
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes}${ampm}`
  }

  return (
    <>
      <section>
        <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Today&apos;s Classes</h2>
        <div className="space-y-4">
          {classes.length > 0 ? (
            classes.map((cls) => {
              const classStatus = getClassStatus(cls.start_time, cls.end_time)
              
              return (
              <div
                key={cls.id}
                className={`bg-white rounded-lg border-l-4 border-r border-t border-b ${cls.has_update ? 'border-blue-300' : 'border-gray-200'} hover:shadow-md transition-all relative overflow-hidden`}
                style={{ borderLeftColor: cls.is_cancelled ? '#ef4444' : (classStatus === 'completed' ? '#9ca3af' : classStatus === 'ongoing' ? '#10b981' : classStatus === 'upcoming' ? '#fbbf24' : cls.has_update ? '#3b82f6' : '#0A32F8') }}
              >
                {/* Subtle Cancellation Pattern */}
                {cls.is_cancelled && (
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 10px, transparent 10px, transparent 20px)'
                  }} />
                )}
                
                {/* Main Content with proper padding */}
                <div className="p-5 pt-12">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-bold ${cls.is_cancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>{cls.course_code}</h3>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      {/* Time */}
                      <p className={`font-semibold text-sm mb-2 ${cls.time_changed ? 'text-amber-700' : 'text-gray-900'}`}>
                        {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                      </p>
                      {cls.time_changed && cls.original_start_time && (
                        <p className="text-xs text-gray-400 line-through mb-2">
                          {formatTime(cls.original_start_time)} - {formatTime(cls.original_end_time || '')}
                        </p>
                      )}
                      
                      {/* Location Badge */}
                      <div className={`rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1 ${cls.location_changed ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        <MapPin className="w-3 h-3" />
                        <span>{cls.location}</span>
                      </div>
                      {cls.location_changed && cls.original_location && (
                        <p className="text-xs text-gray-400 line-through mt-1">({cls.original_location})</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Full Notes */}
                  {cls.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className={`text-xs ${cls.is_cancelled ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'} px-2 py-1.5 rounded inline-block`}>
                        {cls.is_cancelled ? '🚫 Reason: ' : '💡 '}{cls.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Status and Update Badges - Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-1 z-10 max-w-[calc(100%-80px)]">
                  {/* Cancelled Badge - Highest Priority */}
                  {cls.is_cancelled && (
                    <div className="bg-red-500 border border-red-300 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Cancelled
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {!cls.is_cancelled && (
                    <div className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                      classStatus === 'ongoing' ? 'bg-green-500 border-green-300 animate-pulse' : 
                      classStatus === 'completed' ? 'bg-gray-400 border-gray-300' : 
                      'bg-yellow-400 border-yellow-200'
                    }`}>
                      {classStatus === 'ongoing' ? 'Ongoing' : 
                       classStatus === 'completed' ? 'Completed' : 
                       'Upcoming'}
                    </div>
                  )}
                  
                  {/* Update Badge - Only show if not cancelled */}
                  {cls.has_update && !cls.is_cancelled && (
                    <div className="bg-blue-500 border border-blue-300 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Updated
                    </div>
                  )}
                  
                  {/* Change indicators - Only show if not cancelled */}
                  {cls.time_changed && !cls.is_cancelled && (
                    <div className="bg-amber-500 border border-amber-300 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">Time</div>
                  )}
                  {cls.location_changed && !cls.is_cancelled && (
                    <div className="bg-purple-500 border border-purple-300 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">Venue</div>
                  )}
                </div>
                
                {/* Menu Button - Top Right - Only show if not connected */}
                {!isConnected && (
                  <div className="absolute top-3 right-3 z-20">
                    <ClassMenu 
                      onUpdate={() => handleUpdateClass(cls)}
                      hasUpdate={cls.has_update}
                    />
                  </div>
                )}
              </div>
            )
            })
          ) : (
          <div className="bg-white rounded-xl p-6 md:p-8 text-center border-2 border-dashed border-gray-300">
            <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No classes today</h3>
            <p className="text-xs text-gray-600 mb-2">
              {new Date().getDay() === 0 || new Date().getDay() === 6 
                ? "It's the weekend! Enjoy your day off."
                : "No classes scheduled for today"}
            </p>
            {(new Date().getDay() !== 0 && new Date().getDay() !== 6) && (
              <div className="flex justify-center gap-2">
                <Link href="/timetable">
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold text-xs hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    Add Timetable
                  </button>
                </Link>
                <Link href="/classmates">
                  <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold text-xs hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Connect
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      </section>

      {/* Update Modal */}
      {selectedClass && userId && (
        <UpdateTodaysClassModal
          isOpen={showUpdateModal}
          onClose={handleCloseModal}
          userId={userId}
          originalClass={{
            id: selectedClass.timetable_id || selectedClass.id,
            course_code: selectedClass.course_code,
            start_time: selectedClass.start_time,
            end_time: selectedClass.end_time,
            location: selectedClass.location,
            day: selectedClass.day
          }}
          existingUpdate={selectedClass.has_update ? {
            id: selectedClass.todays_class_id,
            timetable_id: selectedClass.timetable_id,
            course_code: selectedClass.course_code,
            start_time: selectedClass.start_time,
            end_time: selectedClass.end_time,
            location: selectedClass.location,
            is_cancelled: selectedClass.is_cancelled || false,
            notes: selectedClass.notes || '',
            date: new Date().toISOString().split('T')[0]
          } : null}
          onUpdate={handleClassUpdated}
        />
      )}
    </>
  )
}

// ============ MAIN PAGE COMPONENT ============
export default function Page() {
  const { profile, user } = useAuthStore()

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-3 md:px-4 py-4 md:py-8 pb-24 lg:pb-8">
          <Header profile={profile} />
          <div className="mt-5 md:mt-12">
            <CatchUpSection />
          </div>
          
          {/* Classmates Section */}
          <div className="mt-5 md:mt-8">
            <ClassmatesSection userId={user?.id} profile={profile} />
          </div>
          
          {/* Department Button - WhatsApp Style */}
          <div className="mt-5 md:mt-8">
            <Link href="/department">
              <div className="bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer group">
                <div className="flex items-center p-4">
                  {/* Avatar/Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Department</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Announcements & Updates</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-5 md:mt-8">
            <TodaysClasses userId={user?.id} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
