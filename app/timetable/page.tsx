'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Clock, MapPin, Plus } from 'lucide-react'

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
}

// ============ HEADER COMPONENT ============
function Header({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Timetable</h1>
        </div>
        <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm">
          <Clock className="w-4 h-4" />
          <p>View your class schedule and timings</p>
        </div>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Add Class</span>
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
    <div className="bg-white rounded-lg p-5 border-r border-t border-b border-gray-200 hover:shadow-md transition-all" style={{ borderLeft: '2px solid #0A32F8' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
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

// ============ TIMETABLE DATA ============
const timetableData: Record<string, ClassInfo[]> = {
  Monday: [
    { time: '8:00 AM - 9:00 AM', title: 'Data Structures', location: 'Room 101' },
    { time: '10:00 AM - 11:30 AM', title: 'Calculus II', location: 'Room 205' },
    { time: '2:00 PM - 3:30 PM', title: 'Database Systems', location: 'Room 301' },
  ],
  Tuesday: [
    { time: '8:00 AM - 9:00 AM', title: 'Statistics', location: 'Room 102' },
    { time: '10:00 AM - 11:30 AM', title: 'English Composition', location: 'Room 215' },
    { time: '1:00 PM - 2:30 PM', title: 'Physics Lab', location: 'Lab 05' },
  ],
  Wednesday: [
    { time: '9:00 AM - 10:30 AM', title: 'Web Development', location: 'Room 303' },
    { time: '11:00 AM - 12:30 PM', title: 'Mechanics', location: 'Room 105' },
  ],
  Thursday: [
    { time: '8:00 AM - 9:00 AM', title: 'Programming', location: 'Lab 02' },
    { time: '10:00 AM - 11:30 AM', title: 'Calculus II', location: 'Room 205' },
    { time: '2:00 PM - 3:00 PM', title: 'Course Registration', location: 'Portal' },
  ],
  Friday: [
    { time: '9:00 AM - 10:00 AM', title: 'Seminar', location: 'Auditorium' },
    { time: '11:00 AM - 12:00 PM', title: 'Project Review', location: 'Room 401' },
  ],
}

// ============ MAIN COMPONENT ============
export default function TimetablePage() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState('Monday')
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const classesForDay = timetableData[selectedDay] || []

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header onAddClick={() => router.push('/timetable/add')} />
          
          <div className="mt-8">
            <DaySelector 
              days={days}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
            />
          </div>

          <ClassSchedule 
            classesForDay={classesForDay}
            selectedDay={selectedDay}
          />
        </div>
      </div>
    </AppShell>
  )
}
