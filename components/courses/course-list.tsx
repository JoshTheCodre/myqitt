'use client'

import type { Course } from '@/lib/types/course'

interface CourseCardProps {
  course: Course
  onClick?: (course: Course) => void
  selected?: boolean
}

export function CourseCard({ course, onClick, selected }: CourseCardProps) {
  const isCompulsory = course.tags?.includes('compulsory')
  
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
  
  const color = colors[getColorIndex(course.code)]
  
  return (
    <div
      className={`bg-white rounded-xl border ${color.border} hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer ${
        selected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
      onClick={() => onClick?.(course)}
    >
      {/* Gradient bar at top */}
      <div className={`h-2 ${color.bg}`} />
      
      <div className="px-5 py-3 flex flex-col gap-4">
        {/* Course details */}
        <div className="space-y-3">
          {/* Code and Title row */}
          <div>
            <div className="flex flex-col gap-2 mb-1">
              <div className='flex justify-between items-start'>
                <p className={`text-md font-bold ${color.code} uppercase tracking-wider`}>{course.code}</p>
                <div className={`${color.badge} px-3 py-1.5 rounded-lg`}>
                  <p className={`text-xs font-bold ${color.code}`}>{course.credits} units</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900">{course.title}</p>
              {course.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{course.description}</p>
              )}
              {isCompulsory !== undefined && (
                <div className="pt-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                    isCompulsory
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompulsory ? 'Compulsory' : 'Elective'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lecturer */}
          {course.lecturer && course.lecturer !== 'TBD' && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="truncate">{course.lecturer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CourseListProps {
  courses: Course[]
  title?: string
  emptyMessage?: string
  onCourseClick?: (course: Course) => void
  selectedCourses?: string[]
}

export function CourseList({
  courses,
  title,
  emptyMessage = 'No courses available',
  onCourseClick,
  selectedCourses = []
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      {title && (
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={onCourseClick}
            selected={selectedCourses.includes(course.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface GroupedCourseListProps {
  compulsory: Course[]
  elective: Course[]
  onCourseClick?: (course: Course) => void
  selectedCourses?: string[]
  showCredits?: boolean
}

export function GroupedCourseList({
  compulsory,
  elective,
  onCourseClick,
  selectedCourses = [],
  showCredits = true
}: GroupedCourseListProps) {
  const totalCompulsoryCredits = compulsory.reduce((sum, c) => sum + c.credits, 0)
  const totalElectiveCredits = elective.reduce((sum, c) => sum + c.credits, 0)
  const totalCredits = totalCompulsoryCredits + totalElectiveCredits
  const totalCourses = compulsory.length + elective.length

  return (
    <div className="space-y-6">
      {showCredits && (
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Credits</p>
              <p className="text-xl font-bold text-gray-900">{totalCredits} units</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-sm font-bold text-gray-900">{totalCompulsoryCredits}</p>
                <p className="text-xs text-gray-500">Compulsory</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{totalElectiveCredits}</p>
                <p className="text-xs text-gray-500">Elective</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {compulsory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Compulsory Courses</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
              {compulsory.length}
            </span>
          </div>
          <CourseList
            courses={compulsory}
            onCourseClick={onCourseClick}
            selectedCourses={selectedCourses}
            emptyMessage="No compulsory courses"
          />
        </div>
      )}

      {elective.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900">Elective Courses</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
              {elective.length}
            </span>
          </div>
          <CourseList
            courses={elective}
            onCourseClick={onCourseClick}
            selectedCourses={selectedCourses}
            emptyMessage="No elective courses"
          />
        </div>
      )}
    </div>
  )
}
