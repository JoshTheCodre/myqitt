'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Clock, MapPin, BookOpen, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCourseStore } from '@/lib/store/courseStore'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'

interface ClassEntry {
  id: string
  startTime: string
  endTime: string
  title: string
  location: string
}

interface DayClasses {
  [key: string]: ClassEntry[]
}

export default function AddTimetablePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { userCourses, fetchUserCourses, loading } = useCourseStore()
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [isUpdateMode, setIsUpdateMode] = useState(false)
  const [existingIds, setExistingIds] = useState<Record<string, string[]>>({})
  const [dayClasses, setDayClasses] = useState<DayClasses>({
    Monday: [{ id: '1', startTime: '', endTime: '', title: '', location: '' }],
    Tuesday: [{ id: '2', startTime: '', endTime: '', title: '', location: '' }],
    Wednesday: [{ id: '3', startTime: '', endTime: '', title: '', location: '' }],
    Thursday: [{ id: '4', startTime: '', endTime: '', title: '', location: '' }],
    Friday: [{ id: '5', startTime: '', endTime: '', title: '', location: '' }],
  })
  const [venues, setVenues] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const savedVenues = localStorage.getItem('timetable_venues')
      return savedVenues ? JSON.parse(savedVenues) : []
    }
    return []
  })
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false)
  const [newVenue, setNewVenue] = useState('')

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  
  // Get all courses for dropdown
  const allCourses = userCourses 
    ? [...(userCourses.compulsory || []), ...(userCourses.elective || [])]
    : []
  
  // Debug logging
  useEffect(() => {
    console.log('User:', user)
    console.log('User Courses:', userCourses)
    console.log('All Courses:', allCourses)
    console.log('Loading:', loading)
    
    if (!loading && allCourses.length === 0 && user) {
      toast('Complete your profile to see courses', {
        icon: 'ℹ️',
        duration: 4000
      })
    }
  }, [user, userCourses, allCourses, loading])
  
  // Check if there are any changes
  const hasChanges = Object.values(dayClasses).some(classes => 
    classes.some(c => c.startTime || c.endTime || c.title || c.location)
  )

  // Fetch user courses
  useEffect(() => {
    if (user?.id) {
      fetchUserCourses(user.id)
    }
  }, [user?.id, fetchUserCourses])

  // Fetch existing timetable
  useEffect(() => {
    if (user?.id) {
      fetchExistingTimetable()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchExistingTimetable = async () => {
    if (!user) return

    try {
      const { data: timetableRecord, error } = await supabase
        .from('timetable')
        .select('timetable_data')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching timetable:', error)
        }
        return
      }

      if (timetableRecord && timetableRecord.timetable_data) {
        setIsUpdateMode(true)
        const jsonData = timetableRecord.timetable_data as Record<string, Array<{ time: string; course: string; venue: string }>>
        
        const groupedClasses: DayClasses = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
        }

        // Parse the JSON data back to form format
        Object.entries(jsonData).forEach(([day, classes]) => {
          if (day in groupedClasses) {
            classes.forEach((classItem, index) => {
              // Parse time string like "8am-10am" back to "08:00" - "10:00"
              const [startStr, endStr] = classItem.time.split('-')
              
              const parseTimeToInput = (timeStr: string) => {
                const match = timeStr.match(/(\d+)(am|pm)/)
                if (!match) return '00:00'
                let hour = parseInt(match[1])
                const period = match[2]
                
                if (period === 'pm' && hour !== 12) hour += 12
                if (period === 'am' && hour === 12) hour = 0
                
                return `${hour.toString().padStart(2, '0')}:00`
              }

              groupedClasses[day].push({
                id: `${day}-${index}`,
                startTime: parseTimeToInput(startStr),
                endTime: parseTimeToInput(endStr),
                title: classItem.course,
                location: classItem.venue
              })
            })
          }
        })

        // Add empty entry for days with no classes
        Object.keys(groupedClasses).forEach((day, index) => {
          if (groupedClasses[day].length === 0) {
            groupedClasses[day] = [{ id: `${day}-0`, startTime: '', endTime: '', title: '', location: '' }]
          }
        })

        setDayClasses(groupedClasses)
        console.log('✅ Loaded existing timetable for update')
      }
    } catch (error) {
      console.error('Failed to fetch existing timetable:', error)
    }
  }

  const addClassEntry = () => {
    setDayClasses(prev => ({
      ...prev,
      [selectedDay]: [
        ...prev[selectedDay],
        { id: Date.now().toString(), startTime: '', endTime: '', title: '', location: '' }
      ]
    }))
  }

  const removeClassEntry = (id: string) => {
    if (dayClasses[selectedDay].length > 1) {
      setDayClasses(prev => ({
        ...prev,
        [selectedDay]: prev[selectedDay].filter(c => c.id !== id)
      }))
    }
  }

  const updateClassEntry = (id: string, field: keyof ClassEntry, value: string) => {
    setDayClasses(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  const addVenue = () => {
    if (!newVenue.trim()) {
      toast.error('Please enter a venue name')
      return
    }
    if (venues.includes(newVenue.trim())) {
      toast.error('Venue already exists')
      return
    }
    const updatedVenues = [...venues, newVenue.trim()]
    setVenues(updatedVenues)
    localStorage.setItem('timetable_venues', JSON.stringify(updatedVenues))
    setNewVenue('')
    toast.success('Venue added successfully')
  }

  const removeVenue = (venue: string) => {
    const updatedVenues = venues.filter(v => v !== venue)
    setVenues(updatedVenues)
    localStorage.setItem('timetable_venues', JSON.stringify(updatedVenues))
    toast.success('Venue removed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please log in to save timetable')
      return
    }

    // Get all classes from all days
    const allClasses = Object.entries(dayClasses).flatMap(([day, classes]) => 
      classes.map(c => ({ ...c, day }))
    )
    
    // Validate only filled entries
    const filledClasses = allClasses.filter(c => 
      c.startTime || c.endTime || c.title || c.location
    )
    
    if (filledClasses.length === 0) {
      toast.error('Please add at least one class')
      return
    }

    const invalidClasses = filledClasses.filter(c => 
      !c.startTime || !c.endTime || !c.title || !c.location
    )
    
    if (invalidClasses.length > 0) {
      toast.error('Please fill in all fields for each class or remove empty entries')
      return
    }

    try {
      // Format time helper
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const period = hour >= 12 ? 'pm' : 'am'
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${displayHour}${period}`
      }

      // Build timetable data in JSON format
      const timetableData: Record<string, Array<{ time: string; course: string; venue: string }>> = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: []
      }

      filledClasses.forEach(c => {
        if (c.day in timetableData) {
          timetableData[c.day].push({
            time: `${formatTime(c.startTime)}-${formatTime(c.endTime)}`,
            course: c.title,
            venue: c.location
          })
        }
      })

      // Check if user already has a timetable
      const { data: existing } = await supabase
        .from('timetable')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let error

      if (existing) {
        // Update existing timetable
        const result = await supabase
          .from('timetable')
          .update({ timetable_data: timetableData })
          .eq('user_id', user.id)
        error = result.error
      } else {
        // Insert new timetable
        const result = await supabase
          .from('timetable')
          .insert({
            user_id: user.id,
            timetable_data: timetableData
          })
        error = result.error
      }

      if (error) {
        console.error('Error saving timetable:', error)
        toast.error('Failed to save timetable')
        return
      }

      toast.success(`${filledClasses.length} class(es) ${existing ? 'updated' : 'added'} successfully!`)
      router.push('/timetable')
    } catch (error) {
      console.error('Error saving timetable:', error)
      toast.error('Failed to save timetable')
    }
  }

  const getTotalClasses = () => {
    return Object.values(dayClasses).reduce((total, classes) => {
      return total + classes.filter(c => c.startTime && c.endTime && c.title && c.location).length
    }, 0)
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full max-w-3xl px-4 py-6 pb-24 lg:pb-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{isUpdateMode ? 'Update' : 'Add'} Classes</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsVenueModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-md text-[11px] font-bold hover:bg-green-100 transition-colors border border-green-200 flex-shrink-0 whitespace-nowrap"
            >
              <MapPin className="w-3 h-3" />
              <span>Venues</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Day Selection */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="grid grid-cols-5 gap-1.5">
                {days.map((day) => {
                  const classCount = dayClasses[day].filter(c => 
                    c.startTime && c.endTime && c.title && c.location
                  ).length
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`relative py-2.5 px-1 rounded-md font-bold text-sm transition-all ${
                        selectedDay === day
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {day.substring(0, 3)}
                      {classCount > 0 && (
                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          selectedDay === day 
                            ? 'bg-white text-blue-600' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          {classCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Classes List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-gray-900">{selectedDay}</h3>
                <button
                  type="button"
                  onClick={addClassEntry}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {dayClasses[selectedDay].map((classEntry, index) => (
                <div key={classEntry.id} className="bg-white rounded-lg p-3 border border-gray-200 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      {dayClasses[selectedDay].length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeClassEntry(classEntry.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 p-1 rounded-md flex-shrink-0"
                          title="Delete entry"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Time Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          Start
                        </label>
                        <input
                          type="time"
                          value={classEntry.startTime}
                          onChange={(e) => updateClassEntry(classEntry.id, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          End
                        </label>
                        <input
                          type="time"
                          value={classEntry.endTime}
                          onChange={(e) => updateClassEntry(classEntry.id, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Course and Location Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          <BookOpen className="w-3 h-3 inline mr-0.5" />
                          Course
                        </label>
                        <select
                          value={classEntry.title}
                          onChange={(e) => updateClassEntry(classEntry.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                          <option value="">{loading ? 'Loading courses...' : allCourses.length === 0 ? 'No courses found' : 'Select course'}</option>
                          {allCourses.map((course) => (
                            <option key={course.id} value={course.title}>
                              {course.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          <MapPin className="w-3 h-3 inline mr-0.5" />
                          Venue
                        </label>
                        <select
                          value={classEntry.location}
                          onChange={(e) => updateClassEntry(classEntry.id, 'location', e.target.value)}
                          className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                          <option value="">Select venue</option>
                          {venues.map((venue) => (
                            <option key={venue} value={venue}>{venue}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-2 sticky bottom-0 bg-gray-50 p-3 -mx-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-2 px-3 bg-white text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 ${
                  hasChanges
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                Save {getTotalClasses() > 0 ? `${getTotalClasses()}` : ''}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Venue Management Modal */}
      {isVenueModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Manage Venues</h2>
              <button
                onClick={() => setIsVenueModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Venue Input */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Add New Venue
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVenue())}
                  placeholder="e.g., Room 101, Lab 05"
                  className="flex-1 px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addVenue}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Venues List */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Saved Venues ({venues.length})
              </label>
              {venues.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No venues added yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {venues.map((venue) => (
                    <div
                      key={venue}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-bold text-gray-900">{venue}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVenue(venue)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsVenueModalOpen(false)}
              className="w-full mt-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
