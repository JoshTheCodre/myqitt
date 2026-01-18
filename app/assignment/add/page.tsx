'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Calendar, FileText, Save, BookOpen, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCourseStore } from '@/lib/store/courseStore'
import { useAuthStore } from '@/lib/store/authStore'
import { AssignmentService, CourseService } from '@/lib/services'

export default function AddAssignmentPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { userCourses, fetchUserCourses, loading } = useCourseStore()
  const [formData, setFormData] = useState({
    courseCode: '',
    description: '',
    dueDate: '',
  })
  const [attachments, setAttachments] = useState<File[]>([])
  
  // Get all courses for dropdown
  const allCourses = userCourses 
    ? [...(userCourses.compulsory || []), ...(userCourses.elective || [])]
    : []
  
  // Debug logging
  useEffect(() => {
    console.log('Assignment - User:', user)
    console.log('Assignment - User Courses:', userCourses)
    console.log('Assignment - All Courses:', allCourses)
    console.log('Assignment - Loading:', loading)
    
    if (!loading && allCourses.length === 0 && user) {
      toast('Complete your profile to see courses', {
        icon: 'ℹ️',
        duration: 4000
      })
    }
  }, [user, userCourses, allCourses, loading])
  
  // Check if there are any changes
  const hasChanges = formData.courseCode || formData.description || formData.dueDate || attachments.length > 0
  
  // Fetch user courses
  useEffect(() => {
    if (user?.id) {
      fetchUserCourses(user.id)
    }
  }, [user?.id, fetchUserCourses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasChanges) return
    
    // Validation
    if (!formData.courseCode || !formData.description || !formData.dueDate) {
      toast.error('Please fill in all fields')
      return
    }

    if (!user) {
      toast.error('You must be logged in')
      return
    }

    try {
      // Get the course_id from the course code
      const courseId = await CourseService.getCourseIdByCode(user.id, formData.courseCode)
      if (!courseId) {
        toast.error('Could not find the selected course')
        return
      }

      await AssignmentService.createAssignment(user.id, {
        title: `${formData.courseCode} Assignment`,
        description: formData.description,
        course_id: courseId,
        due_at: formData.dueDate,
      })

      router.push('/assignment')
    } catch (error) {
      // Error already handled by service
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isPDF = file.type === 'application/pdf'
      return isImage || isPDF
    })
    
    if (validFiles.length !== files.length) {
      toast.error('Only images and PDF files are allowed')
    }
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full max-w-3xl px-4 py-6 pb-24 lg:pb-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Add Assignment</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Course Code and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  <BookOpen className="w-3 h-3 inline mr-0.5" />
                  Course
                </label>
                <select
                  value={formData.courseCode}
                  onChange={(e) => handleChange('courseCode', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">{loading ? 'Loading courses...' : allCourses.length === 0 ? 'No courses found' : 'Select course'}</option>
                  {allCourses.map((course) => (
                    <option key={course.courseCode} value={course.courseCode}>
                      {course.courseCode} - {course.courseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  <Calendar className="w-3 h-3 inline mr-0.5" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                <FileText className="w-3 h-3 inline mr-0.5" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter assignment details and requirements..."
                rows={8}
                className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                required
              />
            </div>

            {/* File Attachments */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                <Upload className="w-3 h-3 inline mr-0.5" />
                Attachments (Images & PDFs)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Click to upload files</span>
              </label>
              
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-2 sticky bottom-0 bg-gray-50 p-3 -mx-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-1.5 px-2 bg-white text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1 ${
                  hasChanges
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
