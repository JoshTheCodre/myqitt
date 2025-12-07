'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HeadsetIcon, BookIcon, Users, ArrowRight, Clock, Plus } from 'lucide-react'
import { useAuthStore, UserProfile } from '@/lib/store/authStore'
import { AppShell } from '@/components/layout/app-shell'
import { CatchUpModal } from '@/components/catch-up-modal'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ============ HELPER FUNCTIONS ============
const getInitials = (name?: string) => {
  if (!name) return 'QZ'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

// ============ HEADER COMPONENT ============
function Header({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="flex items-start justify-between ">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Hello, {profile?.name || 'Guest'}</h1>
        <p className="text-xs font-semibold text-gray-700 mt-1 md:mt-2">{(profile?.department || 'CSC').toUpperCase()} <span className="text-green-500">•</span> {profile?.level ? `${profile.level}00 Level` : 'N/A'}</p>
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
function CatchUpSection({ onItemClick }: { onItemClick: (item: string) => void }) {
  const items = [
    'School Calendar',
    'Year 1 Clearance Checklist',
    'Do your Course Reg Here',
  ]

  return (
    <section>
      <div className="relative rounded-2xl p-4 md:p-8 border border-purple-100 overflow-hidden">
        <Image src="/catchup-bg.png" alt="" fill className="object-cover opacity-20" loading="eager" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw" />
        <div className="relative z-10">
          <ul className="space-y-3 md:space-y-5">
            {items.map((item, index) => (
              <li 
                key={index} 
                className="flex items-center gap-3 md:gap-4 cursor-pointer group"
                onClick={() => onItemClick(item)}
              >
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
                </div>
                <div className='flex items-center group-hover:text-blue-600 transition-colors'>
                  <span className="text-md md:text-lg flex items-center gap-3">{item} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ============ ACTION CARDS COMPONENT ============
function ActionCards() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6">
      <Link href="/courses">
        <div className="relative rounded-xl md:rounded-2xl p-3 md:p-8 text-white cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-36 md:h-auto">
          <Image src="/courses-card-bg.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(to bottom right, rgba(10, 50, 248, 0.85), rgba(8, 40, 201, 0.85))' }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="bg-[#001A0D36] rounded-full p-1.5 md:p-2 w-fit">
              <BookIcon className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold">Courses</h3>
              <p className="text-white/90 mt-0.5 md:mt-2 text-xs md:text-base">View All Courses</p>
            </div>
          </div>
        </div>
      </Link>

      <Link href="/classmates">
        <div className="relative rounded-xl md:rounded-2xl p-4 md:p-8 text-white cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-36 md:h-auto">
          <Image src="/classmates-card-bg.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(to bottom right, rgba(70, 210, 143, 0.85), rgba(58, 185, 121, 0.85))' }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="bg-[#001A0D36] rounded-full p-1.5 md:p-2 w-fit">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold">Classmates</h3>
              <p className="text-white/90 mt-0.5 md:mt-2 text-xs md:text-base">Connect With Peers</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ============ TODAY'S CLASSES COMPONENT ============
function TodaysClasses({ userId }: { userId?: string }) {
  const [classes, setClasses] = useState<Array<{
    id: string
    code: string
    program: string
    time: string
    status: string
    borderColor: string
    badgeBg: string
    badgeText: string
    dot: string
    connectedTo?: string
  }>>([])
  const [loading, setLoading] = useState(true)

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
      // Get current day
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const today = days[new Date().getDay()]

      // Check if today is a weekend (no classes)
      if (today === 'Sunday' || today === 'Saturday') {
        console.log(`📋 No classes scheduled for ${today} (Weekend)`)
        setClasses([])
        setLoading(false)
        return
      }

      // Fetch user's timetable (JSON structure)
      const { data: timetableRecord, error: ownError } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', userId)
        .single()

      // Only log error if it's not a "no rows found" error
      if (ownError && ownError.code !== 'PGRST116') {
        console.error('Error fetching today\'s classes:', ownError)
      }

      let todaysClasses: Array<{ time: string; course: string; venue: string }> = []

      if (timetableRecord && timetableRecord.timetable_data) {
        const jsonData = timetableRecord.timetable_data as Record<string, Array<{ time: string; course: string; venue: string }>>
        todaysClasses = jsonData[today] || []
      }

      if (todaysClasses && todaysClasses.length > 0) {
        const currentTime = new Date()
        const currentHour = currentTime.getHours()
        const currentMinute = currentTime.getMinutes()

        const formattedClasses = todaysClasses.map((item, index) => {
          // Parse time string like "8am-10am"
          const [startTimeStr, endTimeStr] = item.time.split('-')
          
          const parseTime = (timeStr: string) => {
            const match = timeStr.match(/(\d+)(am|pm)/)
            if (!match) return { hour: 0, minute: 0 }
            let hour = parseInt(match[1])
            const period = match[2]
            
            if (period === 'pm' && hour !== 12) {
              hour += 12
            } else if (period === 'am' && hour === 12) {
              hour = 0
            }
            
            return { hour, minute: 0 }
          }

          const startTime = parseTime(startTimeStr)
          const endTime = parseTime(endTimeStr)

          // Determine status
          let status = 'Upcoming'
          let borderColor = 'border-l-blue-500'
          let badgeBg = 'bg-blue-50'
          let badgeText = 'text-blue-600'
          let dot = 'bg-blue-600'

          const currentTotalMinutes = currentHour * 60 + currentMinute
          const startTotalMinutes = startTime.hour * 60 + startTime.minute
          const endTotalMinutes = endTime.hour * 60 + endTime.minute

          if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes) {
            status = 'Ongoing'
            borderColor = 'border-l-amber-400'
            badgeBg = 'bg-amber-50'
            badgeText = 'text-amber-400'
            dot = 'bg-amber-400'
          } else if (currentTotalMinutes >= endTotalMinutes) {
            status = 'Completed'
            borderColor = 'border-l-gray-400'
            badgeBg = 'bg-gray-50'
            badgeText = 'text-gray-600'
            dot = 'bg-gray-600'
          }

          return {
            id: `${today}-${index}`,
            code: item.course,
            program: item.venue || 'TBA',
            time: item.time,
            status,
            borderColor,
            badgeBg,
            badgeText,
            dot
          }
        })

        setClasses(formattedClasses)
        console.log(`✅ Loaded ${formattedClasses.length} classes for ${today}`)
      } else {
        console.log(`📋 No classes scheduled for ${today}`)
        setClasses([])
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch today\'s classes:', error)
      setLoading(false)
    }
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

  return (
    <section>
      <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Today&apos;s Classes</h2>
      <div className="space-y-2 md:space-y-4">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <div
              key={cls.id}
              className={`border-l-4 ${cls.borderColor} bg-white rounded-lg md:rounded-xl p-5 md:p-6 border-r border-t border-b border-gray-200`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg  md:text-xl font-bold">{cls.code}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">{cls.program}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold mb-1 md:mb-3 text-sm">{cls.time}</p>
                  <div className={`${cls.badgeBg} ${cls.badgeText} rounded-full px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium inline-flex items-center gap-1.5 md:gap-2`}>
                    <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${cls.dot || cls.badgeText}`}></span>
                    <span className="hidden sm:inline">{cls.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-6 md:p-8 text-center border-2 border-dashed border-gray-300">
            <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No classes today</h3>
            <p className="text-xs text-gray-600 mb-4">
              {new Date().getDay() === 0 || new Date().getDay() === 6 
                ? "It's the weekend! Enjoy your day off."
                : "You haven't added any classes for today"}
            </p>
            {(new Date().getDay() !== 0 && new Date().getDay() !== 6) && (
              <div className="flex justify-center">
                <Link href="/timetable">
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold text-xs hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    Add Timetable
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ============ MAIN PAGE COMPONENT ============
export default function Page() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const { profile, user } = useAuthStore()

  const handleItemClick = (item: string) => {
    setSelectedItem(item)
    setModalOpen(true)
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-3 md:px-4 py-4 md:py-8 pb-24 lg:pb-8">
          <Header profile={profile} />
          <div className="mt-5 md:mt-12">
            <CatchUpSection onItemClick={handleItemClick} />
          </div>
          <div className="mt-5 md:mt-8">
            <ActionCards />
          </div>
          <div className="mt-5 md:mt-12">
            <TodaysClasses userId={user?.id} />
          </div>
        </div>
      </div>
      <CatchUpModal
        isOpen={modalOpen}
        item={selectedItem}
        onClose={() => {
          setModalOpen(false)
          setSelectedItem(null)
        }}
      />
    </AppShell>
  )
}
