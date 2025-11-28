'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Calendar, FileText, Save, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCourseStore } from '@/lib/store/courseStore'

export default function AddAssignmentPage() {
  const router = useRouter()
  const { userCourses, fetchUserCourses } = useCourseStore()
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    description: '',
    dueDate: '',
  })
  
  // Get all courses for dropdown
  const allCourses = userCourses 
    ? [...(userCourses.compulsory || []), ...(userCourses.elective || [])]
    : []
  
  // Check if there are any changes
  const hasChanges = formData.courseCode || formData.title || formData.description || formData.dueDate
  
  // Fetch user courses
  useEffect(() => {
    // TODO: Get actual user ID from auth
    fetchUserCourses('user-id')
  }, [fetchUserCourses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasChanges) return
    
    // Validation
    if (!formData.courseCode || !formData.title || !formData.description || !formData.dueDate) {
      toast.error('Please fill in all fields')
      return
    }

    // TODO: Save to database
    toast.success('Assignment added successfully!')
    router.push('/assignment')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full max-w-3xl px-4 py-6 pb-24 lg:pb-8 overflow-y-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          {/* Header */}
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">Add Assignment</h1>
            <p className="text-gray-600 text-xs">Create a new assignment with details and deadline</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Course Code and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-[10px] font-bold text-gray-600 mb-2">
                  <BookOpen className="w-2.5 h-2.5 inline mr-0.5" />
                  Course
                </label>
                {allCourses.length > 0 ? (
                  <select
                    value={formData.courseCode}
                    onChange={(e) => {
                      const selectedCourse = allCourses.find(c => c.code === e.target.value)
                      if (selectedCourse) {
                        handleChange('courseCode', selectedCourse.code)
                        handleChange('title', selectedCourse.title)
                      }
                    }}
                    className="w-full px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Select course</option>
                    {allCourses.map((course) => (
                      <option key={course.id} value={course.code}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.courseCode}
                    onChange={(e) => handleChange('courseCode', e.target.value.toUpperCase())}
                    placeholder="CSC 301"
                    className="w-full px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-[10px] font-bold text-gray-600 mb-2">
                  <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Assignment Title */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-600 mb-2">
                <FileText className="w-2.5 h-2.5 inline mr-0.5" />
                Assignment Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Data Structures Project"
                className="w-full px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <label className="block text-[10px] font-bold text-gray-600 mb-2">
                <FileText className="w-2.5 h-2.5 inline mr-0.5" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter assignment details and requirements..."
                rows={8}
                className="w-full px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                required
              />
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
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
