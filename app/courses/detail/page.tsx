'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, BookOpen, Calendar, FileText, Clock, ExternalLink, Edit3, Plus, MapPin, GraduationCap, Sparkles, X } from 'lucide-react'
import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface TimetableEntry {
  day: string
  start_time: string
  end_time: string
  venue: string
}

function CourseDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  
  const courseCode = searchParams.get('code') || ''
  const courseTitle = searchParams.get('title') || ''
  const courseUnit = searchParams.get('unit') || '0'
  const [outline, setOutline] = useState('')
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [assignmentCount, setAssignmentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showOutlineModal, setShowOutlineModal] = useState(false)
  const [editingOutline, setEditingOutline] = useState('')
  const [savingOutline, setSavingOutline] = useState(false)

  useEffect(() => {
    if (courseCode && user?.id) {
      loadCourseDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseCode, user?.id])

  const loadCourseDetails = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // Fetch course outline
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('description')
        .eq('code', courseCode)
        .single()
      
      if (courseError) {
        console.error('Error fetching course:', courseError)
      } else if (courseData?.description) {
        setOutline(courseData.description)
      }

      // Fetch timetable entries for this course
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetable')
        .select('day, start_time, end_time, venue')
        .eq('user_id', user.id)
        .eq('course_code', courseCode)
        .order('day')
      
      if (timetableError) {
        console.error('Error fetching timetable:', timetableError)
      } else if (timetableData) {
        setTimetableEntries(timetableData)
      }

      // Count assignments for this course
      const { count, error: assignmentError } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('course_code', courseCode)
      
      if (assignmentError) {
        console.error('Error counting assignments:', assignmentError)
      } else {
        setAssignmentCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading course details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      return `${displayHour}:${minutes} ${period}`
    } catch {
      return time
    }
  }

  const handleSaveOutline = async () => {
    if (!courseCode) return
    
    setSavingOutline(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({ description: editingOutline })
        .eq('code', courseCode)
      
      if (error) throw error
      
      setOutline(editingOutline)
      setShowOutlineModal(false)
      toast.success('Course outline saved!')
    } catch (error) {
      console.error('Error saving outline:', error)
      toast.error('Failed to save outline')
    } finally {
      setSavingOutline(false)
    }
  }

  const openOutlineModal = () => {
    setEditingOutline(outline)
    setShowOutlineModal(true)
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const sortedEntries = [...timetableEntries].sort((a, b) => 
    dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase())
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">Back to Courses</span>
            </button>

            {/* Hero Card */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-xl border-2 border-white/30">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{courseCode}</h1>
                      <p className="text-blue-100 text-lg font-medium">{courseTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold border border-white/30 shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      <span>{courseUnit} Units</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Classes This Week */}
            <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-lg hover:shadow-xl transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Classes</p>
                  <p className="text-3xl font-black text-gray-900">{timetableEntries.length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">sessions per week</p>
            </div>

            {/* Assignments */}
            <button
              onClick={() => router.push(`/assignment?course=${courseCode}`)}
              className="bg-white rounded-2xl border border-orange-100 p-5 shadow-lg hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Assignments</p>
                  <p className="text-3xl font-black text-gray-900">{assignmentCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600 font-bold">
                <span>View all</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Course Outline */}
          <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                Course Outline
              </h2>
              <button
                onClick={openOutlineModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                {outline ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{outline ? 'Edit' : 'Add'}</span>
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            ) : outline ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{outline}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-2">No course outline yet</p>
                <p className="text-gray-400 text-xs">Click &quot;Add&quot; to create one</p>
              </div>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-lg">
            <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              Weekly Schedule
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            ) : sortedEntries.length > 0 ? (
              <div className="space-y-3">
                {sortedEntries.map((entry, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 hover:shadow-md transition-all group"
                  >
                    <div className="flex-shrink-0 w-24">
                      <div className="bg-white rounded-lg px-3 py-2 border border-purple-200 shadow-sm">
                        <p className="text-sm font-black text-purple-700 capitalize text-center">{entry.day}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span>{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{entry.venue || 'No venue set'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">No classes scheduled</p>
                <p className="text-gray-400 text-xs">Add this course to your timetable</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outline Edit Modal */}
      {showOutlineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                {outline ? 'Edit' : 'Add'} Course Outline
              </h2>
              <button
                onClick={() => setShowOutlineModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Course Outline
              </label>
              <textarea
                value={editingOutline}
                onChange={(e) => setEditingOutline(e.target.value)}
                placeholder="Enter the course outline, topics covered, learning objectives, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[300px] resize-y"
                disabled={savingOutline}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowOutlineModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                disabled={savingOutline}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutline}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                disabled={savingOutline}
              >
                {savingOutline ? 'Saving...' : 'Save Outline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default function CourseDetailPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppShell>
    }>
      <CourseDetailContent />
    </Suspense>
  )
}
