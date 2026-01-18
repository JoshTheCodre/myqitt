'use client'

import { useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { GroupedCourseList } from '@/components/courses/course-list'
import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'
import { useAuthStore, UserProfile } from '@/lib/store/authStore'
import { BookOpen, Loader2 } from 'lucide-react'

// ============ HEADER COMPONENT ============
function Header({ profile }: { profile: UserProfile | null }) {
    // Get level and semester from new schema
    const classGroup = profile?.class_group as { level?: { level_number: number } } | undefined
    const currentSemester = profile?.current_semester as { name: string } | undefined
    const levelNumber = classGroup?.level?.level_number
    const semesterName = currentSemester?.name

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
    const { user, profile, initialized } = useAuthStore()
    const { userCourses, loading, error, fetchUserCourses } = useCourseStore()
    const { hasUserCourses } = useCourseSelectors()

    // Fetch user courses on mount or when user changes
    useEffect(() => {
        let mounted = true
        
        const loadData = async () => {
            if (!initialized) return
            
            if (user?.id && profile && mounted) {
                await fetchUserCourses(user.id)
            }
        }
        
        loadData()
        
        return () => {
            mounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, profile?.id, initialized])

    // ============ MAIN RENDER ============
    return (
        <AppShell>
            <div className="h-full flex items-start justify-center">
                <div className="w-full max-w-6xl px-4 py-8 pb-24 lg:pb-8">
                    <Header profile={profile} />
                    
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
                            />
                        )}

                        {!loading && !error && !hasUserCourses && (
                            <div className="bg-gray-50 rounded-xl p-8 text-center">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">No courses found</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Make sure your profile has school, department, level, and semester information.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
