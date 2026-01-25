'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Calendar, FileText, Clock, ExternalLink, Edit3, Plus, MapPin, Award, X, CheckCircle2, Trash2, PartyPopper, Eye } from 'lucide-react'
import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import { useCourseStore } from '@/lib/store/courseStore'
import { ConnectionService } from '@/lib/services'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

interface TimetableEntry {
  day: string
  start_time: string
  end_time: string
  venue: string
}

function CourseDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isCourseRep } = useAuthStore()
  const { markCarryoverComplete, removeCarryoverCourse } = useCourseStore()
  
  const courseCode = searchParams.get('code') || ''
  const courseTitle = searchParams.get('title') || ''
  const courseUnit = searchParams.get('unit') || '0'
  const isCarryover = searchParams.get('carryover') === 'true'
  const carryoverId = searchParams.get('id') || ''
  
  const [outline, setOutline] = useState('')
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [assignmentCount, setAssignmentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showOutlineModal, setShowOutlineModal] = useState(false)
  const [editingOutline, setEditingOutline] = useState('')
  const [savingOutline, setSavingOutline] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConnectedForOutline, setIsConnectedForOutline] = useState(false)
  const [isViewOnlyOutline, setIsViewOnlyOutline] = useState(false)
  const [outlineUserName, setOutlineUserName] = useState<string | undefined>()

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
      
      // Check connection status for course outline
      const outlineSource = await ConnectionService.getCourseOutlineUserId(user.id)
      setIsConnectedForOutline(outlineSource.isConnected)
      setIsViewOnlyOutline(outlineSource.isViewOnly)
      setOutlineUserName(outlineSource.userName)
      
      const userIsCourseRep = isCourseRep()
      
      // Only fetch course outline if connected or is course rep
      if (outlineSource.isConnected || userIsCourseRep) {
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
      }

      // Fetch timetable entries - check connection for timetable
      const timetableSource = await ConnectionService.getTimetableUserId(user.id)
      if (timetableSource.isConnected || userIsCourseRep) {
        const { data: timetableData, error: timetableError } = await supabase
          .from('timetable')
          .select('day, start_time, end_time, venue')
          .eq('user_id', timetableSource.userId)
          .eq('course_code', courseCode)
          .order('day')
        
        if (timetableError) {
          console.error('Error fetching timetable:', timetableError)
        } else if (timetableData) {
          setTimetableEntries(timetableData)
        }
      }

      // Count assignments - check connection for assignments
      const assignmentSource = await ConnectionService.getAssignmentsUserId(user.id)
      if (assignmentSource.isConnected || userIsCourseRep) {
        const { count, error: assignmentError } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', assignmentSource.userId)
          .eq('course_code', courseCode)
        
        if (assignmentError) {
          console.error('Error counting assignments:', assignmentError)
        } else {
          setAssignmentCount(count || 0)
        }
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

  const triggerCelebration = () => {
    // Launch confetti from multiple points
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#ffffff']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }

  const handleMarkComplete = async () => {
    if (!carryoverId) return
    
    setCompleting(true)
    try {
      const success = await markCarryoverComplete(carryoverId)
      if (success) {
        triggerCelebration()
        setShowCompletionModal(true)
      } else {
        toast.error('Failed to mark as completed')
      }
    } catch (error) {
      console.error('Error marking complete:', error)
      toast.error('Failed to mark as completed')
    } finally {
      setCompleting(false)
    }
  }

  const handleDeleteCarryover = async () => {
    if (!carryoverId) return
    
    setDeleting(true)
    try {
      const success = await removeCarryoverCourse(carryoverId)
      if (success) {
        toast.success('Carryover course removed')
        router.push('/courses')
      } else {
        toast.error('Failed to remove carryover course')
      }
    } catch (error) {
      console.error('Error deleting carryover:', error)
      toast.error('Failed to remove carryover course')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const sortedEntries = [...timetableEntries].sort((a, b) => 
    dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase())
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">Back to Courses</span>
            </button>

            {/* Hero Card */}
            <div className={`relative ${isCarryover ? 'bg-gradient-to-br from-orange-800 via-orange-900 to-orange-800' : 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800'} rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl overflow-hidden border ${isCarryover ? 'border-orange-700' : 'border-gray-700'}`}>
              {/* Decorative elements */}
              <div className={`absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 ${isCarryover ? 'bg-orange-500/10' : 'bg-blue-500/10'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/4`}></div>
              <div className={`absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 ${isCarryover ? 'bg-orange-400/10' : 'bg-blue-400/10'} rounded-full blur-2xl translate-y-1/2 -translate-x-1/4`}></div>
              
              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {isCarryover && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white mb-2">
                      CARRYOVER
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 tracking-tight truncate">{courseCode}</h1>
                  <p className={`${isCarryover ? 'text-orange-100' : 'text-blue-100'} text-sm sm:text-base lg:text-lg font-medium line-clamp-2`}>{courseTitle}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-white/20 shadow-lg w-fit flex-shrink-0">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{courseUnit} Units</span>
                </div>
              </div>
            </div>
          </div>

          {/* Carryover Actions */}
          {isCarryover && carryoverId && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
              <h3 className="font-bold text-gray-900 mb-3">Carryover Course Actions</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {completing ? 'Processing...' : 'Mark as Completed'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Classes This Week */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm border border-blue-100 group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest">Sessions</p>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900">{timetableEntries.length}</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">per week</p>
            </div>

            {/* Assignments */}
            <button
              onClick={() => router.push(`/assignment?course=${courseCode}`)}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm border border-blue-100 group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest">Assignments</p>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900">{assignmentCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-600 font-bold">
                <span>View all</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Course Outline */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">Course Outline</h2>
                {isViewOnlyOutline && outlineUserName && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600">
                    <Eye className="w-3 h-3" />
                    <span>From {outlineUserName}</span>
                  </div>
                )}
              </div>
              {(isCourseRep() && !isViewOnlyOutline) && (
                <button
                  onClick={openOutlineModal}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all"
                >
                  {outline ? <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  <span>{outline ? 'Edit' : 'Add'}</span>
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            ) : !isConnectedForOutline && !isCourseRep() ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium mb-2">Course outline not available</p>
                <p className="text-gray-400 text-xs">Connect to a classmate to view their course outline</p>
              </div>
            ) : outline ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{outline}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm font-medium mb-2">No course outline yet</p>
                {isCourseRep() && !isViewOnlyOutline ? (
                  <p className="text-gray-400 text-xs">Click &quot;Add&quot; to create one</p>
                ) : (
                  <p className="text-gray-400 text-xs">The course rep hasn&apos;t added one yet</p>
                )}
              </div>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-4 sm:mb-6">Weekly Schedule</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            ) : sortedEntries.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {sortedEntries.map((entry, idx) => (
                  <div 
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg sm:rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-shrink-0 w-full sm:w-20">
                      <div className="bg-white rounded-lg px-3 py-1.5 sm:py-2 border border-gray-200 shadow-sm group-hover:border-blue-300 transition-colors inline-block sm:block">
                        <p className="text-xs sm:text-sm font-black text-gray-900 capitalize sm:text-center">{entry.day}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        <span>{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="font-medium">{entry.venue || 'No venue set'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" />
                </div>
                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">No classes scheduled</p>
                <p className="text-gray-400 text-[10px] sm:text-xs">Add this course to your timetable</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outline Edit Modal */}
      {showOutlineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl p-5 sm:p-8 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">{outline ? 'Edit' : 'Add'} Course Outline</h2>
              <button
                onClick={() => setShowOutlineModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
                Course Outline
              </label>
              <textarea
                value={editingOutline}
                onChange={(e) => setEditingOutline(e.target.value)}
                placeholder="Enter the course outline, topics covered, learning objectives, etc."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[200px] sm:min-h-[300px] resize-y text-sm sm:text-base"
                disabled={savingOutline}
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowOutlineModal(false)}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                disabled={savingOutline}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutline}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                disabled={savingOutline}
              >
                {savingOutline ? 'Saving...' : 'Save Outline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Celebration Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Congratulations!</h2>
            <p className="text-gray-600 mb-2">You&apos;ve completed</p>
            <p className="text-xl font-bold text-green-600 mb-6">{courseCode}</p>
            <p className="text-sm text-gray-500 mb-8">
              Keep up the great work! One less carryover to worry about.
            </p>
            <button
              onClick={() => {
                setShowCompletionModal(false)
                router.push('/courses')
              }}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
            >
              Back to Courses
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Remove Carryover?</h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              Are you sure you want to remove <span className="font-semibold">{courseCode}</span> from your carryover courses? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCarryover}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Remove'}
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
