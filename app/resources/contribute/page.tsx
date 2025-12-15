'use client'

import { useState } from 'react'
import { Upload, FileText, BookOpen, GraduationCap, Plus, X, ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type ResourceType = 'past_questions' | 'lecture_notes' | 'study_guides'

interface FormData {
  title: string
  type: ResourceType | ''
  course: string
  description: string
  isPublic: boolean
  file: File | null
}

const courses = [
  'CSC 486.1',
  'CSC 301.1',
  'MTH 201.1',
  'CSC 205.1',
  'PHY 102.1',
  'ENG 101.1'
]

const resourceTypes: { value: ResourceType; label: string; icon: any }[] = [
  { value: 'past_questions', label: 'Past Questions', icon: FileText },
  { value: 'lecture_notes', label: 'Lecture Notes', icon: BookOpen },
  { value: 'study_guides', label: 'Study Guides', icon: GraduationCap }
]

export default function ContributePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    type: '',
    course: '',
    description: '',
    isPublic: true,
    file: null
  })

  const [uploading, setUploading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: target.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.type || !formData.course || !formData.file) {
      toast.error('Please fill in all required fields')
      return
    }

    setUploading(true)
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Material uploaded successfully! Thanks for contributing 🙌')
      setFormData({
        title: '',
        type: '',
        course: '',
        description: '',
        isPublic: true,
        file: null
      })
    } catch (error) {
      toast.error('Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Contribute Materials</h1>
            <p className="text-sm text-gray-600">Share study materials to help other students</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Pro Tip:</strong> The more quality materials you share, the more helpful you become to the community. Thanks for helping everyone escape this place faster! 😂
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resource Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Resource Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {resourceTypes.map(type => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        formData.type === type.value
                          ? 'bg-blue-50 border-blue-600 text-blue-600'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Material Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., CSC 486.1 Final Exam 2023"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any notes or details about this material..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Upload File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    {formData.file ? formData.file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">PDF, DOC, PPT, XLS or TXT</p>
                </label>
              </div>
            </div>

            {/* Public/Private */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this public so others can see and download it
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Material
                </>
              )}
            </button>
          </form>

          {/* Tips */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tips for Great Materials</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Use clear, descriptive titles so others can easily find what they need</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Make sure files are well-organized and easy to read</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Add relevant details in the description field</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Quality materials get more downloads and positive feedback</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
