"use client"

import { useState, useEffect } from "react"
import { X, Calendar } from "lucide-react"

interface ClassInfo {
  time: string
  title: string
  location: string
}

interface FreeTimeModalProps {
  isOpen: boolean
  onClose: () => void
  timetable: Record<string, ClassInfo[]>
  initialDay?: string
}

export function FreeTimeModal({ isOpen, onClose, timetable, initialDay = 'Monday' }: FreeTimeModalProps) {
  const [selectedDay, setSelectedDay] = useState(initialDay)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  useEffect(() => {
    if (isOpen && initialDay) {
      setSelectedDay(initialDay)
    }
  }, [isOpen, initialDay])

  if (!isOpen) return null

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0
    
    // Clean up the time string
    const cleanTime = timeStr.trim().toLowerCase()
    
    // Handle formats like "9am", "10pm", "10:30am", "9:00 AM", etc.
    const match = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
    if (!match) {
      console.log('Could not parse time:', timeStr)
      return 0
    }
    
    let hours = parseInt(match[1], 10)
    const minutes = match[2] ? parseInt(match[2], 10) : 0
    const period = match[3]?.toLowerCase()
    
    if (period === 'pm' && hours !== 12) hours += 12
    if (period === 'am' && hours === 12) hours = 0
    
    return hours * 60 + minutes
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    
    return mins > 0 ? `${displayHours}:${mins.toString().padStart(2, '0')} ${period}` : `${displayHours} ${period}`
  }

  const getFreeTimeSlots = (day: string) => {
    const classesForDay = timetable?.[day] || []
    
    console.log('Day:', day, 'Classes:', classesForDay)
    
    if (!classesForDay || classesForDay.length === 0) {
      return [{ time: 'All Day', description: 'Free all day' }]
    }

    const freeSlots: { time: string; description: string }[] = []
    
    // Parse class times to get start and end times
    const classPeriods = classesForDay
      .map(cls => {
        // Handle both "8:00 AM-9:00 AM" and "8:00 AM - 9:00 AM" formats
        const parts = cls.time.split('-').map(t => t.trim())
        const start = parseTime(parts[0])
        const end = parts[1] ? parseTime(parts[1]) : start + 60 // Default 1 hour if no end time
        
        console.log('Class:', cls.title, 'Time string:', cls.time, 'Parsed start:', start, 'end:', end)
        
        return { start, end, title: cls.title }
      })
      .filter(p => p.start > 0) // Filter out unparseable times
      .sort((a, b) => a.start - b.start)

    if (classPeriods.length === 0) {
      return [{ time: 'All Day', description: 'Free all day' }]
    }

    const dayStart = 8 * 60 // 8:00 AM in minutes
    const dayEnd = 18 * 60 // 6:00 PM in minutes

    // Check for free time before first class
    if (classPeriods[0].start > dayStart) {
      freeSlots.push({
        time: 'Morning',
        description: `Free until ${formatTime(classPeriods[0].start)}`
      })
    }

    // Check for free time between classes
    for (let i = 0; i < classPeriods.length - 1; i++) {
      const currentClassEnd = classPeriods[i].end
      const nextClassStart = classPeriods[i + 1].start
      
      // If there's a gap of at least 30 minutes
      if (nextClassStart - currentClassEnd >= 30) {
        const startTime = formatTime(currentClassEnd)
        const endTime = formatTime(nextClassStart)
        const period = currentClassEnd < 12 * 60 ? 'Morning' : 'Afternoon'
        freeSlots.push({
          time: period,
          description: `${startTime} - ${endTime} free`
        })
      }
    }

    // Check for free time after last class
    const lastClassEnd = classPeriods[classPeriods.length - 1].end
    if (lastClassEnd < dayEnd) {
      freeSlots.push({
        time: 'Afternoon',
        description: `${formatTime(lastClassEnd)} - end of day`
      })
    }

    return freeSlots.length > 0 
      ? freeSlots 
      : [{ time: 'Busy Day!', description: 'Classes throughout the day' }]
  }

  const freeSlots = getFreeTimeSlots(selectedDay)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl border border-gray-200">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Free Time</h2>
              <p className="text-sm text-gray-500">Your available slots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Day Selector */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedDay === day
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Free Time Slots */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {freeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-green-50 border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-bold text-green-900">{slot.time}</p>
                      <p className="text-sm text-green-700">{slot.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  )
}
