'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { Megaphone, BookOpen, Plus, ChevronRight, Users, FileText, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDepartmentName } from '@/lib/hooks/useDepartments'
import { ClassmateService, type Classmate } from '@/lib/services'
import { ConnectionService } from '@/lib/services/connectionService'
import { ConnectionModal } from '@/components/connection-modal'

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user_name?: string
}

interface Course {
  id: string
  course_code: string
  course_title: string
  credit_unit: number
  category: string
}

export default function DepartmentPage() {
  const { profile, user } = useAuthStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingClassmates, setLoadingClassmates] = useState(true)
  const [activeTab, setActiveTab] = useState<'announcements' | 'courses' | 'classmates'>('announcements')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (profile?.department && profile?.school && profile?.level) {
      fetchAnnouncements()
      fetchCourses()
      fetchClassmates()
    }
  }, [profile?.department, profile?.school, profile?.level, profile?.semester])

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true)
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          user_id,
          users!inner(name)
        `)
        .eq('school', profile?.school)
        .eq('department', profile?.department)
        .eq('level', profile?.level)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      setAnnouncements(data?.map(a => ({
        ...a,
        user_name: (a.users as any)?.name || 'Unknown'
      })) || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  const fetchCourses = async () => {
    if (!profile?.school || !profile?.department || !profile?.level || !profile?.semester) {
      console.log('Missing profile data for courses:', { school: profile?.school, dept: profile?.department, level: profile?.level, semester: profile?.semester })
      setLoadingCourses(false)
      return
    }
    
    try {
      setLoadingCourses(true)
      
      // Convert semester from 'first'/'second' to '1'/'2' for the JSONB query
      const semesterNum = profile.semester === 'first' ? '1' : '2'
      const levelKey = (profile.level * 100).toString() // Convert 1 to '100', 2 to '200', etc.
      
      console.log('Fetching courses with:', { school: profile.school, department: profile.department, level: levelKey, semester: semesterNum })
      
      // Fetch course data from the courses table
      const { data, error } = await supabase
        .from('courses')
        .select('course_data')
        .eq('school', profile.school)
        .eq('department', profile.department)
        .single()

      console.log('Courses response:', { data, error })
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - no courses for this department
          console.log('No courses found for department')
          setCourses([])
          return
        }
        throw error
      }
      
      // Extract courses from the JSONB structure
      // Structure: { "100": { "1": [...courses], "2": [...courses] }, "200": {...} }
      const courseData = data?.course_data as Record<string, Record<string, Array<{
        courseCode: string
        courseTitle: string
        courseUnit: number
        category: string
      }>>> | null
      
      if (courseData && courseData[levelKey] && courseData[levelKey][semesterNum]) {
        const semesterCourses = courseData[levelKey][semesterNum]
        const formattedCourses: Course[] = semesterCourses.map((c, index) => ({
          id: `${c.courseCode}-${index}`,
          course_code: c.courseCode,
          course_title: c.courseTitle,
          credit_unit: c.courseUnit,
          category: c.category || 'COMPULSORY'
        }))
        console.log('Formatted courses:', formattedCourses.length)
        setCourses(formattedCourses)
      } else {
        console.log('No courses found for level/semester:', { levelKey, semesterNum, available: courseData ? Object.keys(courseData) : 'none' })
        setCourses([])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const fetchClassmates = async () => {
    if (!user || !profile?.school || !profile?.department || !profile?.level) {
      setLoadingClassmates(false)
      return
    }

    try {
      setLoadingClassmates(true)
      const data = await ClassmateService.getClassmates(
        user.id,
        profile.school,
        profile.department,
        profile.level
      )
      setClassmates(data)
    } catch (error) {
      console.error('Error fetching classmates:', error)
    } finally {
      setLoadingClassmates(false)
    }
  }

  const handleConnect = async (classmate: Classmate) => {
    if (!user) return
    
    if (classmate.isConnected) {
      // Disconnect
      setConnectingId(classmate.id)
      try {
        await ConnectionService.disconnectUser(user.id, classmate.id)
        setClassmates(prev => prev.map(c => 
          c.id === classmate.id ? { ...c, isConnected: false } : c
        ))
      } catch (error) {
        console.error('Error disconnecting:', error)
      } finally {
        setConnectingId(null)
      }
    } else {
      // Show connection modal
      setSelectedClassmate(classmate)
      setShowModal(true)
    }
  }

  const handleConnectionComplete = async (type: 'timetable' | 'assignments' | 'both') => {
    if (!user || !selectedClassmate) return
    
    setConnectingId(selectedClassmate.id)
    try {
      await ConnectionService.connectToUser(user.id, selectedClassmate.id, type)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.department ? formatDepartmentName(profile.department) : 'Not set'}
              </h1>
              <p className="text-sm text-gray-600">
                {profile?.level ? `${profile.level}00 Level` : ''}
              </p>
            </div>
            <Link href="/admin/manage">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md">
                Manage
              </button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'announcements'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'courses'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Courses
            </button>
            <button
              onClick={() => setActiveTab('classmates')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-medium text-xs transition-all ${
                activeTab === 'classmates'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Classmates
            </button>
          </div>

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {/* Add Announcement Button - Only for Course Reps */}
              {profile?.is_course_rep && (
                <Link href="/department/announcement/new">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md">
                    <Plus className="w-5 h-5" />
                    New Announcement
                  </button>
                </Link>
              )}

              {loadingAnnouncements ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{announcement.user_name}</span>
                            <span>•</span>
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No Announcements Yet</h3>
                  <p className="text-sm text-gray-600">
                    {profile?.is_course_rep 
                      ? 'Create your first announcement for your classmates.'
                      : 'Your course rep hasn\'t posted any announcements yet.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              {/* Add Course Button - Only for Course Reps */}
              {profile?.is_course_rep && (
                <Link href="/courses/add">
                  <button className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2 shadow-md">
                    <Plus className="w-5 h-5" />
                    Add Course
                  </button>
                </Link>
              )}

              {loadingCourses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                      <div className="h-2 bg-gray-200"></div>
                      <div className="px-5 py-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-5 bg-gray-200 rounded w-24"></div>
                          <div className="h-7 bg-gray-200 rounded-lg w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                        <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map(course => {
                    // Generate consistent color based on course code
                    const getColorIndex = (code: string) => {
                      let hash = 0
                      for (let i = 0; i < code.length; i++) {
                        hash = code.charCodeAt(i) + ((hash << 5) - hash)
                      }
                      return Math.abs(hash) % 6
                    }
                    
                    const colors = [
                      { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', badge: 'bg-blue-50', code: 'text-blue-600', border: 'hover:border-blue-300' },
                      { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', badge: 'bg-cyan-50', code: 'text-cyan-600', border: 'hover:border-cyan-300' },
                      { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', badge: 'bg-emerald-50', code: 'text-emerald-600', border: 'hover:border-emerald-300' },
                      { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', badge: 'bg-amber-50', code: 'text-amber-600', border: 'hover:border-amber-300' },
                      { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', badge: 'bg-purple-50', code: 'text-purple-600', border: 'hover:border-purple-300' },
                      { bg: 'bg-gradient-to-br from-rose-50 to-rose-100', badge: 'bg-rose-50', code: 'text-rose-600', border: 'hover:border-rose-300' },
                    ]
                    
                    const color = colors[getColorIndex(course.course_code)]
                    
                    return (
                      <div 
                        key={course.id} 
                        className={`bg-white rounded-xl border ${color.border} hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer border-gray-200`}
                      >
                        {/* Gradient bar at top */}
                        <div className={`h-2 ${color.bg}`} />
                        
                        <div className="px-5 py-3 flex flex-col gap-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex flex-col gap-2 mb-1">
                                <div className="flex justify-between items-start">
                                  <p className={`text-md font-bold ${color.code} uppercase tracking-wider`}>{course.course_code}</p>
                                  <div className={`${color.badge} px-3 py-1.5 rounded-lg`}>
                                    <p className={`text-xs font-bold ${color.code}`}>{course.credit_unit} units</p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{course.course_title}</p>
                                <div className="pt-2">
                                  <span className="text-xs font-medium px-2 py-1 rounded-full inline-block bg-gray-100 text-gray-600">
                                    {course.category === 'COMPULSORY' ? 'Compulsory' : 'Elective'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No Courses Yet</h3>
                  <p className="text-sm text-gray-600">
                    {profile?.is_course_rep 
                      ? 'Add your department courses for this semester.'
                      : 'Your course rep hasn\'t added any courses yet.'}
                  </p>
                </div>
              )}

              {/* View All Link */}
              {courses.length > 0 && (
                <Link href="/courses">
                  <button className="w-full py-3 text-blue-600 font-medium text-sm flex items-center justify-center gap-1 hover:text-blue-700 transition-colors">
                    View All Courses
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Classmates Tab */}
          {activeTab === 'classmates' && (
            <div className="space-y-4">
              {loadingClassmates ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : classmates.length > 0 ? (
                <div className="space-y-3">
                  {classmates.map(classmate => (
                    <div key={classmate.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                          {classmate.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{classmate.name}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>{classmate.followers || 0} followers</span>
                            {classmate.isConnected && (
                              <div className="flex items-center gap-2">
                                {classmate.hasTimetable && (
                                  <span className="flex items-center gap-0.5 text-emerald-600">
                                    <Clock className="w-3 h-3" />
                                    TT
                                  </span>
                                )}
                                {classmate.hasAssignments && (
                                  <span className="flex items-center gap-0.5 text-blue-600">
                                    <FileText className="w-3 h-3" />
                                    Asn
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Connect Button */}
                        <button
                          onClick={() => handleConnect(classmate)}
                          disabled={connectingId === classmate.id}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            connectingId === classmate.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No Classmates Found</h3>
                  <p className="text-sm text-gray-600">
                    No other students in your department and level yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connection Modal */}
      {selectedClassmate && user && (
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
          currentUserId={user.id}
          onConnect={handleConnectionComplete}
        />
      )}
    </AppShell>
  )
}
