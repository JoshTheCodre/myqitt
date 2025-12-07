'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Clock, MapPin, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

// ============ TYPES ============
interface ClassInfo {
  time: string
  title: string
  location: string
  isOwner?: boolean
}

interface ClassCardProps {
  time: string
  title: string
  location: string
  isOwner?: boolean
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
function Header({ onAddClick, hasTimetable }: { onAddClick: () => void; hasTimetable: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Timetable</h1>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>{hasTimetable ? 'Update' : 'Add'}</span>
      </button>
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
    <div className="bg-white rounded-lg p-5 border-l-2 border-r border-t border-b border-gray-200 hover:shadow-md transition-all" style={{ borderLeftColor: '#0A32F8' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
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
function ClassSchedule({ classesForDay, selectedDay }: ClassScheduleProps) {
  return (
    <div className="mt-8">
      <div className="space-y-4">
        {classesForDay.map((cls, index) => (
          <ClassCard
            key={index}
            time={cls.time}
            title={cls.title}
            location={cls.location}
          />
        ))}
        {classesForDay.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No classes scheduled for {selectedDay}</p>
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

      // Fetch own timetable from timetable table (JSON structure)
      const { data: timetableRecord, error: ownError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', user.id)
        .single()

      if (ownError) {
        if (ownError.code === 'PGRST116') {
          console.log('📋 No timetable found for user')
        } else {
          console.error('❌ Error fetching timetable:', ownError)
        }
      }

      console.log('📊 Timetable data:', timetableRecord)

      if (timetableRecord && timetableRecord.timetable_data) {
        // timetable_data is already in the format we need
        const jsonData = timetableRecord.timetable_data as Record<string, Array<{ time: string; course: string; venue: string }>>
        
        // Transform to component format
        const groupedData: Record<string, ClassInfo[]> = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
        }

        Object.entries(jsonData).forEach(([day, classes]) => {
          if (day in groupedData) {
            classes.forEach(classItem => {
              groupedData[day].push({
                time: classItem.time,
                title: classItem.course,
                location: classItem.venue,
                isOwner: true
              })
            })
          }
        })

        setTimetable(groupedData)
        setHasTimetable(true)
        console.log('✅ Timetable loaded from database')
      } else {
        setHasTimetable(false)
        console.log('📋 No timetable found')
      }

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
          <Header onAddClick={() => router.push('/timetable/add')} hasTimetable={hasTimetable} />
          
          <div className="mt-8">
            <DaySelector 
              days={days}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
            />
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
