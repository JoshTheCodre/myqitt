'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { GroupedCourseList } from '@/components/courses/course-list'
import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'
import { useAuthStore, UserProfileWithDetails } from '@/lib/store/authStore'
import { BookOpen, Loader2, Plus, X, AlertTriangle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CourseItem } from '@/lib/types/course'
import toast from 'react-hot-toast'
import { CourseRegistrationModal } from '@/components/course-registration-modal'
import { supabase } from '@/lib/supabase/client'

// ============ HEADER COMPONENT ============
function Header({ profile }: { profile: UserProfileWithDetails | null }) {
    // Get level and semester from new schema
    const levelNumber = profile?.class_group?.level?.level_number
    const semesterName = profile?.current_semester?.name

    return (
        <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">My Courses</h1>
            <p className="text-sm text-gray-500 mt-2">
                {levelNumber && semesterName && (
                    <>{levelNumber}00 Level • {semesterName}</>
                )}
            </p>
        </div>
    )
}

export default function CoursesPage() {
    const router = useRouter()
    const user = useAuthStore((s) => s.user)
    const profile = useAuthStore((s) => s.profile)
    const status = useAuthStore((s) => s.status)
    const { 
        userCourses, 
        carryoverCourses, 
        loading, 
        carryoverLoading, 
        error, 
        fetchUserCourses, 
        fetchCarryoverCourses 
    } = useCourseStore()
    const { hasUserCourses, hasCarryoverCourses, carryoverCredits } = useCourseSelectors()
    const [showCarryoverModal, setShowCarryoverModal] = useState(false)
    const [showRegistrationModal, setShowRegistrationModal] = useState(false)

    // Check if user has already confirmed course registration
    useEffect(() => {
        const checkRegistrationStatus = async () => {
            if (!user?.id) return

            try {
                // First check database
                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('course_registration_completed')
                    .eq('user_id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    // PGRST116 = no rows returned, which is fine
                    console.error('Error checking registration status:', error)
                }

                // If user hasn't confirmed registration, show modal
                if (!data?.course_registration_completed) {
                    // Also check localStorage as fallback
                    const localStatus = localStorage.getItem(`course_registration_${user.id}`)
                    if (localStatus !== 'completed') {
                        setShowRegistrationModal(true)
                    }
                }
            } catch (err) {
                console.error('Error checking registration:', err)
                // Check localStorage as fallback
                const localStatus = localStorage.getItem(`course_registration_${user.id}`)
                if (localStatus !== 'completed') {
                    setShowRegistrationModal(true)
                }
            }
        }

        checkRegistrationStatus()
    }, [user?.id])

    const handleCourseClick = (course: CourseItem) => {
        router.push(`/courses/detail?code=${encodeURIComponent(course.courseCode)}&title=${encodeURIComponent(course.courseTitle)}&unit=${course.courseUnit}`)
    }

    const handleCarryoverClick = (courseId: string, courseCode: string, courseTitle: string, courseUnit: number) => {
        router.push(`/courses/detail?code=${encodeURIComponent(courseCode)}&title=${encodeURIComponent(courseTitle)}&unit=${courseUnit}&carryover=true&id=${courseId}`)
    }

    // Fetch user courses on mount or when user changes
    useEffect(() => {
        let mounted = true
        
        const loadData = async () => {
            if (status !== 'authenticated') return
            
            if (user?.id && profile && mounted) {
                await Promise.all([
                    fetchUserCourses(user.id),
                    fetchCarryoverCourses(user.id)
                ])
            }
        }
        
        loadData()
        
        return () => {
            mounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, profile?.id, status])

    // ============ MAIN RENDER ============
    return (
        <AppShell>
            <div className="h-full flex items-start justify-center">
                <div className="w-full max-w-6xl px-4 py-8 pb-24 lg:pb-8">
                    <div className="flex items-center justify-between mb-8">
                        <Header profile={profile} />
                        <button
                            onClick={() => setShowCarryoverModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add Carryover</span>
                        </button>
                    </div>
                    
                    <div className="mt-8">
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {!loading && !error && userCourses && (
                            <GroupedCourseList
                                compulsory={userCourses.compulsory}
                                elective={userCourses.elective}
                                showCredits={true}
                                onCourseClick={handleCourseClick}
                            />
                        )}

                        {/* Carryover Courses Section */}
                        {!loading && !carryoverLoading && hasCarryoverCourses && (
                            <div className="mt-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Carryover Courses</h2>
                                        <p className="text-sm text-gray-500">
                                            {carryoverCourses.length} course{carryoverCourses.length !== 1 ? 's' : ''} • {carryoverCredits} credit unit{carryoverCredits !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {carryoverCourses.map((course) => (
                                        <button
                                            key={course.id}
                                            onClick={() => handleCarryoverClick(course.id, course.courseCode, course.courseTitle, course.courseUnit)}
                                            className="w-full bg-orange-50 border border-orange-200 rounded-xl p-4 text-left hover:bg-orange-100 hover:border-orange-300 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                                                            CARRYOVER
                                                        </span>
                                                        <span className="text-sm font-bold text-orange-700">{course.courseCode}</span>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 mt-1 truncate">{course.courseTitle}</h3>
                                                    <p className="text-sm text-gray-500">{course.courseUnit} Credit Unit{course.courseUnit !== 1 ? 's' : ''}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors flex-shrink-0" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loading && !error && !hasUserCourses && !hasCarryoverCourses && (
                            <div className="bg-gray-50 rounded-xl p-8 text-center">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">No courses found</p>
                                {/* Show specific missing fields */}
                                {(!profile?.class_group_id || !profile?.current_semester_id) ? (
                                    <div className="text-gray-500 text-sm mt-2 space-y-1">
                                        <p>Your profile is missing required information:</p>
                                        <ul className="text-left max-w-xs mx-auto mt-2 space-y-1">
                                            {!profile?.class_group_id && (
                                                <li className="flex items-center gap-2 text-amber-600">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>Class Group (department/level)</span>
                                                </li>
                                            )}
                                            {!profile?.current_semester_id && (
                                                <li className="flex items-center gap-2 text-amber-600">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>Current Semester</span>
                                                </li>
                                            )}
                                        </ul>
                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="mt-4 inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                                        >
                                            Update Profile <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm mt-1">
                                        No courses are available for your department and semester yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Carryover Modal */}
            {showCarryoverModal && (
                <CarryoverModal 
                    onClose={() => setShowCarryoverModal(false)}
                    onSuccess={() => {
                        setShowCarryoverModal(false)
                    }}
                />
            )}

            {/* Course Registration Check Modal */}
            {showRegistrationModal && user?.id && (
                <CourseRegistrationModal
                    userId={user.id}
                    onClose={() => setShowRegistrationModal(false)}
                />
            )}
        </AppShell>
    )
}

// ============ CARRYOVER MODAL COMPONENT ============
function CarryoverModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuthStore()
    const { addCarryoverCourse } = useCourseStore()
    const [courseCode, setCourseCode] = useState('')
    const [courseTitle, setCourseTitle] = useState('')
    const [creditUnit, setCreditUnit] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!user?.id) {
            toast.error('You must be logged in')
            return
        }

        if (!courseCode.trim() || !courseTitle.trim() || !creditUnit) {
            toast.error('Please fill in all fields')
            return
        }

        const creditValue = parseInt(creditUnit)
        if (isNaN(creditValue) || creditValue < 1 || creditValue > 6) {
            toast.error('Credit unit must be between 1 and 6')
            return
        }

        setSubmitting(true)
        try {
            await addCarryoverCourse(user.id, {
                course_code: courseCode.trim(),
                course_title: courseTitle.trim(),
                credit_unit: creditValue
            })
            toast.success('Carryover course added!')
            onSuccess()
        } catch (error: unknown) {
            console.error('Error adding carryover:', error)
            // Check for duplicate error
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
                toast.error('This carryover course already exists')
            } else {
                toast.error('Failed to add carryover course')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add Carryover Course</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Course Code
                        </label>
                        <input
                            type="text"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                            placeholder="e.g., CSC 301"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            disabled={submitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Course Title
                        </label>
                        <input
                            type="text"
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                            placeholder="e.g., Data Structures"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            disabled={submitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Credit Units
                        </label>
                        <input
                            type="number"
                            value={creditUnit}
                            onChange={(e) => setCreditUnit(e.target.value)}
                            placeholder="e.g., 3"
                            min="1"
                            max="6"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            disabled={submitting}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? 'Adding...' : 'Add Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
