'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Clock, MapPin, Plus, Unplug, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

// ============ TYPES ============
interface ClassInfo {
  time: string
  title: string
  location: string
  isOwner?: boolean
  ownerName?: string  // ✅ NEW: Name of the connected classmate
}

interface ClassCardProps {
  time: string
  title: string
  location: string
  isOwner?: boolean
  ownerName?: string  // ✅ NEW
}

interface DaySelectorProps {
  days: string[]
  selectedDay: string
  setSelectedDay: (day: string) => void
}

interface ClassScheduleProps {
  classesForDay: ClassInfo[]
  selectedDay: string
}

// ============ HEADER COMPONENT ============
function Header({ onAddClick, hasTimetable, connectedUsers }: { onAddClick: () => void; hasTimetable: boolean; connectedUsers?: string[] }) {
  const [showInfoPopup, setShowInfoPopup] = useState(false)
  const router = useRouter()
  const hasConnectedUsers = connectedUsers && connectedUsers.length > 0

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Timetable</h1>
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
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">You're viewing a combined timetable with {connectedUsers[0]}'s classes.</p>
                      <p className="text-sm text-gray-600 leading-relaxed">To add or update your own timetable, disconnect from {connectedUsers[0]} first.</p>
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
            <span>{hasTimetable ? 'Update' : 'Add'}</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ============ DAY SELECTOR COMPONENT ============
function DaySelector({ days, selectedDay, setSelectedDay }: DaySelectorProps) {
  const dayAbbreviations: Record<string, string> = {
    'Monday': 'MON',
    'Tuesday': 'TUES',
    'Wednesday': 'WED',
    'Thursday': 'THURS',
    'Friday': 'FRI'
  }

  return (
    <div className="flex gap-2 w-full">
      {days.map((day) => (
        <button
          key={day}
          onClick={() => setSelectedDay(day)}
          className={`px-3 py-2 rounded-full font-semibold text-xs md:text-sm whitespace-nowrap transition-all flex-1 min-w-0 ${
            selectedDay === day
              ? 'text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: selectedDay === day ? '#0A32F8' : undefined
          }}
        >
          <span className="md:hidden">{dayAbbreviations[day]}</span>
          <span className="hidden md:inline">{day}</span>
        </button>
      ))}
    </div>
  )
}

// ============ CLASS CARD COMPONENT ============
function ClassCard({ time, title, location, isOwner, ownerName }: ClassCardProps) {
  return (
    <div className="bg-white rounded-lg p-5 border-l-2 border-r border-t border-b border-gray-200 hover:shadow-md transition-all" style={{ borderLeftColor: isOwner ? '#0A32F8' : '#10b981' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-sm mb-2">{time}</p>
          <div className="rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1" style={{ backgroundColor: isOwner ? '#E8ECFF' : '#d1fae5', color: isOwner ? '#0A32F8' : '#047857' }}>
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ CLASS SCHEDULE COMPONENT ============
function ClassSchedule({ classesForDay, selectedDay }: ClassScheduleProps) {
  const router = useRouter()
  
  return (
    <div className="mt-8">
      <div className="space-y-4">
        {classesForDay.map((cls, index) => (
          <ClassCard
            key={index}
            time={cls.time}
            title={cls.title}
            location={cls.location}
            isOwner={cls.isOwner}
            ownerName={cls.ownerName}
          />
        ))}
        {classesForDay.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-base font-medium">No classes on {selectedDay}</p>
            <p className="text-gray-500 text-sm mt-2">Add your schedule or connect with a classmate to see theirs</p>
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
        )}
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function TimetablePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [timetable, setTimetable] = useState<Record<string, ClassInfo[]>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: []
  })
  const [loading, setLoading] = useState(true)
  const [hasTimetable, setHasTimetable] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const classesForDay = timetable[selectedDay] || []

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (user && mounted) {
        await fetchTimetable()
      } else if (mounted) {
        setLoading(false)
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchTimetable = async () => {
    if (!user) {
      console.log('❌ No user found, skipping timetable fetch')
      return
    }

    try {
      console.log('🔍 Fetching timetable for user:', user.id)

      // Initialize grouped data
      const groupedData: Record<string, ClassInfo[]> = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      }

      // ✅ 1. Fetch own timetable
      const { data: timetableRecord, error: ownError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', user.id)
        .single()

      if (ownError && ownError.code !== 'PGRST116') {
        console.error('❌ Error fetching timetable:', ownError)
      }

      // Add own timetable
      if (timetableRecord && timetableRecord.timetable_data) {
        const jsonData = timetableRecord.timetable_data as Record<string, Array<{ time: string; course?: string; course_code?: string; course_title?: string; venue: string }>>
        
        Object.entries(jsonData).forEach(([day, classes]) => {
          if (day in groupedData) {
            classes.forEach(classItem => {
              // Display only course code
              const courseDisplay = classItem.course_code || classItem.course || 'TBD'
              
              groupedData[day].push({
                time: classItem.time,
                title: courseDisplay,
                location: classItem.venue,
                isOwner: true
              })
            })
          }
        })
        setHasTimetable(true)
      }

      // ✅ 2. Fetch connected classmates' timetables
      const { data: connections } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', user.id)

      if (connections && connections.length > 0) {
        const connectedUserIds = connections.map(c => c.following_id)
        console.log('👥 Fetching timetables for connected users:', connectedUserIds)

        // Fetch connected users' names and timetables
        const { data: connectedUsersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', connectedUserIds)

        const { data: connectedTimetables } = await supabase
          .from('timetable')
          .select('user_id, timetable_data')
          .in('user_id', connectedUserIds)

        // Create a map of user IDs to names
        const userNamesMap = new Map(
          connectedUsersData?.map(u => [u.id, u.name]) || []
        )

        // Store connected users' names for header display
        setConnectedUsers(connectedUsersData?.map(u => u.name) || [])

        // Add connected users' timetables
        let hasAnyTimetableData = false
        connectedTimetables?.forEach(tt => {
          if (tt.timetable_data) {
            const jsonData = tt.timetable_data as Record<string, Array<{ time: string; course?: string; course_code?: string; course_title?: string; venue: string }>>
            const ownerName = userNamesMap.get(tt.user_id) || 'Classmate'

            Object.entries(jsonData).forEach(([day, classes]) => {
              if (day in groupedData && classes.length > 0) {
                hasAnyTimetableData = true
                classes.forEach(classItem => {
                  // Display only course code
                  const courseDisplay = classItem.course_code || classItem.course || 'TBD'
                  
                  groupedData[day].push({
                    time: classItem.time,
                    title: courseDisplay,
                    location: classItem.venue,
                    isOwner: false,
                    ownerName
                  })
                })
              }
            })
          }
        })

        // Check if connected users had no timetables
        const usersWithNoTimetable = connectedUserIds.filter(userId => {
          const hasData = connectedTimetables?.some(tt => 
            tt.user_id === userId && tt.timetable_data
          )
          return !hasData
        })

        if (usersWithNoTimetable.length > 0 && !hasAnyTimetableData && !hasTimetable) {
          const userNames = usersWithNoTimetable
            .map(id => userNamesMap.get(id) || 'Classmate')
            .join(', ')
          toast(`${userNames} ${usersWithNoTimetable.length === 1 ? 'has' : 'have'} not added a timetable yet`, {
            icon: 'ℹ️',
          })
        }

        console.log('✅ Added timetables from', connectedTimetables?.length || 0, 'connected users')
      }

      setTimetable(groupedData)
      setHasTimetable(true)
      console.log('✅ Timetable loaded from database')

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch timetable:', error)
      toast.error('Failed to load timetable')
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header onAddClick={() => router.push('/timetable/add')} hasTimetable={hasTimetable} connectedUsers={connectedUsers} />
          
          <div className="mt-8">
            <DaySelector 
              days={days}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
            />
          </div>

          {loading ? (
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ClassSchedule 
              classesForDay={classesForDay}
              selectedDay={selectedDay}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}
