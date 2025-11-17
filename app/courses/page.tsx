'use client'

import { AppShell } from '@/components/layout/app-shell'
import { BookOpen, Users } from 'lucide-react'

export default function CoursesPage() {
    // ============ HEADER COMPONENT ============
    const Header = ({ courseCount }: { courseCount: number }) => (
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Courses</h1>
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{courseCount}</div>
            </div>
            <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm">
                <p>Explore all your academic courses</p>
            </div>
        </div>
    )

    // ============ COURSE CARD COMPONENT ============
    const CourseCard = ({ code, title, credits, lecturer, index }: { code: string; title: string; credits: string; lecturer: string; index: number }) => {
        // Cycle through brand accent colors
        const colors = [
            { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', badge: 'bg-blue-50', code: 'text-blue-600', border: 'hover:border-blue-300' },
            { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', badge: 'bg-cyan-50', code: 'text-cyan-600', border: 'hover:border-cyan-300' },
            { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', badge: 'bg-emerald-50', code: 'text-emerald-600', border: 'hover:border-emerald-300' },
            { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', badge: 'bg-amber-50', code: 'text-amber-600', border: 'hover:border-amber-300' },
            { bg: 'bg-gradient-to-br from-purple-50 to-purple-100', badge: 'bg-purple-50', code: 'text-purple-600', border: 'hover:border-purple-300' },
            { bg: 'bg-gradient-to-br from-rose-50 to-rose-100', badge: 'bg-rose-50', code: 'text-rose-600', border: 'hover:border-rose-300' },
        ]
        const color = colors[index % colors.length]

        return (
            <div className={`bg-white rounded-xl border border-gray-200 ${color.border} hover:shadow-md transition-all duration-300 overflow-hidden group`}>
                <div className={`h-2 ${color.bg}`} />
                <div className="px-5 py-3 flex flex-col gap-4">
                    {/* Header with credits */}


                    {/* Course details */}
                    <div className="space-y-3">
                        {/* Code and Title row */}
                        <div>
                            <div className="flex flex-col gap-2 mb-1">
                                <div className='flex justify-between'>
                                    <p className={`text-md font-bold ${color.code} uppercase tracking-wider`}>{code} </p>
                                    <div className="flex items-start justify-between">
                                        <div />
                                        <div className="text-right">
                                            <div className={`${color.badge} px-3 py-1.5 rounded-lg`}>
                                                <p className={`text-xs font-bold ${color.code}`}>{credits} units</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{title}</p>
                            </div>
                        </div>

                        {/* Lecturer */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Users className="w-3.5 h-3.5" />
                                <p className="truncate">{lecturer}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ============ COURSES LIST COMPONENT ============
    const CoursesList = () => {
        const courses = [
            {
                id: 1,
                code: 'STAT 180',
                title: 'Introduction to Statistics',
                credits: '3',
                lecturer: 'Dr. Ifianyi Okoye',
            },
            {
                id: 2,
                code: 'CSC 310',
                title: 'Data Structures and Algorithms',
                credits: '4',
                lecturer: 'Prof. Chioma Nwankwo',
            },
            {
                id: 3,
                code: 'MATH 250',
                title: 'Calculus II',
                credits: '3',
                lecturer: 'Dr. Emmanuel Edet',
            },
            {
                id: 4,
                code: 'PHY 240',
                title: 'Mechanics and Thermodynamics',
                credits: '4',
                lecturer: 'Prof. Adekunle Bello',
            },
            {
                id: 5,
                code: 'CSC 380',
                title: 'Database Management Systems',
                credits: '3',
                lecturer: 'Dr. Ngozi Okafor',
            },
            {
                id: 6,
                code: 'ENG 260',
                title: 'English Composition',
                credits: '2',
                lecturer: 'Dr. Zainab Adeyemi',
            },
            {
                id: 7,
                code: 'CSC 420',
                title: 'Web Development',
                credits: '3',
                lecturer: 'Engr. Segun Oladipo',
            },
        ]

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course, index) => (
                    <CourseCard
                        key={course.id}
                        code={course.code}
                        title={course.title}
                        credits={course.credits}
                        lecturer={course.lecturer}
                        index={index}
                    />
                ))}
            </div>
        )
    }

    // ============ MAIN RENDER ============
    return (
        <AppShell>
            <div className="h-full flex items-start justify-center">
                <div className="w-full max-w-6xl px-4 py-8 pb-24 lg:pb-8">
                    <Header courseCount={7} />
                    <div className="mt-12">
                        <CoursesList />
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
