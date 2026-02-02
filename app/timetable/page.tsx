'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Clock, MapPin, Plus, Share2, Calendar, Eye } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { TimetableService, ConnectionService } from '@/lib/services'
import toast from 'react-hot-toast'
import { FreeTimeModal } from '@/components/timetable/free-time-modal'
import { TimetableImageGenerator, TimetableImageGeneratorHandle } from '@/components/timetable/timetable-image-generator'

// ============ TYPES ============
interface ClassInfo {
  time: string
  title: string
  location: string
}

interface ClassCardProps {
  time: string
  title: string
  location: string
}

interface DaySelectorProps {
  days: string[]
  selectedDay: string
  setSelectedDay: (day: string) => void
}

interface ClassScheduleProps {
  classesForDay: ClassInfo[]
  selectedDay: string
  isCourseRep: boolean
  isViewOnly: boolean
  isConnected: boolean
  viewingUserName?: string
}

// ============ HEADER COMPONENT ============
function Header({ 
  onAddClick, 
  hasTimetable, 
  isCourseRep,
  onViewFreeTime,
  onShareClick,
  showingFreeTime,
  isViewOnly,
  viewingUserName
}: { 
  onAddClick: () => void; 
  hasTimetable: boolean; 
  isCourseRep: boolean;
  onViewFreeTime: () => void;
  onShareClick: () => void;
  showingFreeTime: boolean;
  isViewOnly: boolean;
  viewingUserName?: string;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Timetable</h1>
          {isViewOnly && viewingUserName && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit">
              <Eye className="w-4 h-4" />
              <span>Viewing {viewingUserName}&apos;s timetable</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasTimetable && (
            <>
              <button
                onClick={onViewFreeTime}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
                  showingFreeTime 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Free Time</span>
              </button>
              <button
                onClick={onShareClick}
                className="p-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                title="Share Timetable"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </>
          )}
          {isCourseRep && !isViewOnly && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{hasTimetable ? 'Update' : 'Add'}</span>
            </button>
          )}
        </div>
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
function ClassCard({ time, title, location }: ClassCardProps) {
  return (
    <div 
      className="bg-white rounded-lg p-5 border-l-2 border-r border-t border-b border-gray-200 hover:shadow-md transition-all" 
      style={{ borderLeftColor: '#0A32F8' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-sm mb-2">{time}</p>
          <div className="rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1" style={{ backgroundColor: '#E8ECFF', color: '#0A32F8' }}>
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ CLASS SCHEDULE COMPONENT ============
function ClassSchedule({ classesForDay, selectedDay, isCourseRep, isViewOnly, isConnected, viewingUserName }: ClassScheduleProps) {
  const router = useRouter()
  
  return (
    <div className="mt-8">
      <div className="space-y-4">
        {classesForDay.map((cls, idx) => (
          <ClassCard
            key={idx}
            time={cls.time}
            title={cls.title}
            location={cls.location}
          />
        ))}
        {classesForDay.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-base font-medium">
              {isConnected || isCourseRep ? `No classes on ${selectedDay}` : 'No timetable available'}
            </p>
            {isViewOnly && isConnected ? (
              <p className="text-gray-500 text-sm mt-2">{viewingUserName} hasn&apos;t added a timetable yet</p>
            ) : isCourseRep ? (
              <>
                <p className="text-gray-500 text-sm mt-2">Add your class timetable to share with your classmates</p>
                <button
                  onClick={() => router.push('/timetable/add')}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Timetable</span>
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm mt-2">Connect to a classmate to view their timetable</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function TimetablePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const status = useAuthStore((s) => s.status)
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
  const [isCourseRep, setIsCourseRep] = useState(false)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [viewingUserName, setViewingUserName] = useState<string | undefined>()
  const [lastUpdated, setLastUpdated] = useState<string | undefined>()
  const [showFreeTimeModal, setShowFreeTimeModal] = useState(false)
  const timetableImageRef = useRef<TimetableImageGeneratorHandle>(null)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const classesForDay = timetable[selectedDay] || []

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (status !== 'authenticated') return
      
      if (user?.id && profile && mounted) {
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
  }, [user?.id, profile?.id, status])

  const fetchTimetable = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Check if viewing connected user's timetable
      const dataSource = await ConnectionService.getTimetableUserId(user.id)
      setIsViewOnly(dataSource.isViewOnly)
      setViewingUserName(dataSource.userName)
      setIsConnected(dataSource.isConnected)
      
      // Fetch timetable data
      const data = await TimetableService.getTimetable(dataSource.userId!)
      
      // Always show timetable data if it exists
      setTimetable(data.timetable)
      setHasTimetable(data.hasTimetable)
      setLastUpdated(data.lastUpdated)
      // Only show course rep actions if viewing own data and is course rep
      setIsCourseRep(dataSource.isViewOnly ? false : data.isCourseRep)
    } catch (error) {
      console.error('Failed to fetch timetable:', error)
      toast.error('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const handleViewFreeTime = () => {
    setShowFreeTimeModal(true)
  }

  const handleShareClick = () => {
    console.log('Share clicked, ref:', timetableImageRef.current)
    timetableImageRef.current?.generateAndShare()
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header 
            onAddClick={() => router.push('/timetable/add')} 
            hasTimetable={hasTimetable} 
            isCourseRep={isCourseRep}
            onViewFreeTime={handleViewFreeTime}
            onShareClick={handleShareClick}
            showingFreeTime={false}
            isViewOnly={isViewOnly}
            viewingUserName={viewingUserName}
          />
          
          {hasTimetable && lastUpdated && (
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <span className="text-xs text-gray-600">Last updated:</span>
              <span className="text-xs font-bold text-blue-600">
                {new Date(lastUpdated).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric'
                })}
              </span>
              <span className="text-xs font-bold text-blue-600">
                {new Date(lastUpdated).toLocaleTimeString('en-US', { 
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          
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
              isCourseRep={isCourseRep}
              isViewOnly={isViewOnly}
              isConnected={isConnected}
              viewingUserName={viewingUserName}
            />
          )}
        </div>
        
        {/* Free Time Modal */}
        <FreeTimeModal
          isOpen={showFreeTimeModal}
          onClose={() => setShowFreeTimeModal(false)}
          timetable={timetable}
          initialDay={selectedDay}
        />
        
        {/* Timetable Image Generator */}
        <TimetableImageGenerator
          ref={timetableImageRef}
          timetable={timetable}
        />
      </div>
    </AppShell>
  )
}
