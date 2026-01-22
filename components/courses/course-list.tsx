'use client'

import type { CourseItem } from '@/lib/types/course'
import { ChevronRight } from 'lucide-react'

interface CourseCardProps {
  course: CourseItem
  onClick?: (course: CourseItem) => void
  selected?: boolean
}

export function CourseCard({ course, onClick, selected }: CourseCardProps) {
  // Use light blue top bar with gray content for hierarchy
  const color = {
    topBar: 'bg-gradient-to-r from-blue-100 to-blue-200',
    badge: 'bg-gray-100',
    code: 'text-gray-900',
    title: 'text-gray-500',
    units: 'text-gray-800',
    border: 'hover:border-blue-300'
  }
  
  return (
    <div
      className={`bg-white rounded-xl border ${color.border} hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer ${
        selected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
      onClick={() => onClick?.(course)}
    >
      {/* Light blue bar at top */}
      <div className={`h-1 ${color.topBar}`} />
      
      <div className="px-5 py-3 flex flex-col gap-4">
        {/* Course details */}
        <div className="space-y-3">
          {/* Code and Title row */}
          <div>
            <div className="flex flex-col gap-2 mb-1">
              <div className='flex justify-between items-start'>
                <p className={`text-md font-bold ${color.code} uppercase tracking-wider`}>{course.courseCode}</p>
                <div className="flex items-center gap-2">
                  <div className={`${color.badge} px-3 py-1.5 rounded-lg`}>
                    <p className={`text-xs font-semibold ${color.units}`}>{course.courseUnit} units</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <p className={`text-sm font-semibold ${color.title}`}>{course.courseTitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CourseListProps {
  courses: CourseItem[]
  title?: string
  emptyMessage?: string
  onCourseClick?: (course: CourseItem) => void
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
            key={course.courseCode}
            course={course}
            onClick={onCourseClick}
            selected={selectedCourses.includes(course.courseCode)}
          />
        ))}
      </div>
    </div>
  )
}

interface GroupedCourseListProps {
  compulsory: CourseItem[]
  elective: CourseItem[]
  onCourseClick?: (course: CourseItem) => void
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
  const totalCompulsoryCredits = compulsory.reduce((sum, c) => sum + c.courseUnit, 0)
  const totalElectiveCredits = elective.reduce((sum, c) => sum + c.courseUnit, 0)
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
