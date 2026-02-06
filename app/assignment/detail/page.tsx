'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Calendar, FileText, Trash2, Edit, X, CheckCircle, Share2, Copy } from 'lucide-react'
import { Suspense, useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useAuthStore, type UserProfileWithDetails } from '@/lib/store/authStore'
import { AssignmentService } from '@/lib/services'
import { AssignmentImageGenerator, AssignmentImageGeneratorHandle } from '@/components/assignment/assignment-image-generator'

function AssignmentDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useAuthStore()
  const typedProfile = profile as UserProfileWithDetails | null
  const [deleting, setDeleting] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const assignmentImageRef = useRef<AssignmentImageGeneratorHandle>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: ''
  })

  // State for displaying current assignment data (can be updated)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentDescription, setCurrentDescription] = useState('')
  const [currentDueDate, setCurrentDueDate] = useState('')

  const id = searchParams.get('id') || ''
  const courseCode = searchParams.get('courseCode') || ''
  const title = searchParams.get('title') || ''
  const description = searchParams.get('description') || ''
  const dueDate = searchParams.get('dueDate') || ''
  
  // Initialize display state from URL params
  useEffect(() => {
    setCurrentTitle(title)
    setCurrentDescription(description)
    setCurrentDueDate(dueDate)
  }, [title, description, dueDate])
  
  // Fetch submission status
  useEffect(() => {
    if (id) {
      fetchSubmissionStatus()
    }
  }, [id])

  const fetchSubmissionStatus = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's personal submission status
      const { data, error } = await supabase
        .from('user_assignment_submissions')
        .select('submitted, submitted_at')
        .eq('assignment_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setSubmitted(data.submitted || false)
        setSubmittedAt(data.submitted_at)
      } else {
        // No submission record yet - default to not submitted
        setSubmitted(false)
        setSubmittedAt(null)
      }
    } catch (error) {
      console.error('Failed to fetch submission status:', error)
    }
  }
  
  const handleToggleSubmission = async () => {
    if (!id) return

    setToggling(true)
    try {
      const newSubmitted = !submitted
      await AssignmentService.toggleSubmission(id, newSubmitted)
      setSubmitted(newSubmitted)
      setSubmittedAt(newSubmitted ? new Date().toISOString() : null)
      
      toast.success(newSubmitted ? 'Marked as submitted!' : 'Marked as not submitted')
    } catch (error) {
      console.error('Failed to toggle submission:', error)
      toast.error('Failed to update submission status')
    } finally {
      setToggling(false)
    }
  }

  const handleShareAsImage = () => {
    assignmentImageRef.current?.generateAndShare()
  }

  const handleShareAsText = async () => {
    const text = `📝 ${currentTitle}\n\n📚 Course: ${courseCode}\n📅 Due: ${currentDueDate}\n\n${currentDescription}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assignment: ${currentTitle}`,
          text: text
        })
        toast.success('Shared successfully!')
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy to clipboard')
      }
    }
  }
  
  // Check if user is course rep - they can edit any assignment in their class
  const isCourseRep = typedProfile?.user_roles?.some(
    (ur: { role?: { name: string } }) => ur.role?.name === 'course_rep'
  ) || false

  // Initialize form data when modal opens
  const handleOpenModal = () => {
    setFormData({
      title: currentTitle,
      description: currentDescription,
      dueDate: currentDueDate
    })
    setShowUpdateModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!id) {
      toast.error('Assignment ID not found')
      return
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.dueDate) {
      toast.error('Please fill in all fields')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('assignments')
        .update({
          title: formData.title,
          description: formData.description,
          due_date: formData.dueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating assignment:', error)
        toast.error('Failed to update assignment')
        setUpdating(false)
        return
      }

      // Update the displayed data with new values
      setCurrentTitle(formData.title)
      setCurrentDescription(formData.description)
      setCurrentDueDate(formData.dueDate)

      toast.success('Assignment updated successfully!')
      setShowUpdateModal(false)
      setUpdating(false)
    } catch (error) {
      console.error('Failed to update assignment:', error)
      toast.error('Failed to update assignment')
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!id) {
      toast.error('Assignment ID not found')
      return
    }

    if (!confirm('Are you sure you want to delete this assignment?')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting assignment:', error)
        toast.error('Failed to delete assignment')
        setDeleting(false)
        return
      }

      toast.success('Assignment deleted successfully!')
      router.push('/assignment')
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      toast.error('Failed to delete assignment')
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full max-w-3xl px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Assignments</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                {courseCode}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShareAsText}
                  className="p-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  title="Share as text"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShareAsImage}
                  className="p-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  title="Share as image"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{currentTitle}</h1>
          </div>

          {/* Details Cards */}
          <div className="space-y-4">
            {/* Submission Status Card */}
            <div className={`p-6 rounded-2xl border-2 shadow-sm ${
              submitted 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    submitted ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`w-6 h-6 ${
                      submitted ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${
                      submitted ? 'text-green-600' : 'text-gray-600'
                    }`}>Submission Status</p>
                    <p className={`text-lg font-bold mt-1 ${
                      submitted ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {submitted ? 'Submitted ✓' : 'Not Submitted'}
                    </p>
                    {submittedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(submittedAt).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleToggleSubmission}
                  disabled={toggling}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 ${
                    submitted
                      ? 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {toggling ? 'Updating...' : submitted ? 'Mark as Not Submitted' : 'Mark as Submitted'}
                </button>
              </div>
            </div>

            {/* Due Date Card */}
            <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Due Date</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{currentDueDate}</p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-3">Description</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{currentDescription}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isCourseRep && (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button 
                onClick={handleOpenModal}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                <Edit className="w-5 h-5" />
                <span>Update</span>
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Update Assignment</h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Assignment title"
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="Assignment description"
                  rows={4}
                />
              </div>

              {/* Due Date Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Image Generator */}
      <AssignmentImageGenerator
        ref={assignmentImageRef}
        courseCode={courseCode}
        title={currentTitle}
        description={currentDescription}
        dueDate={currentDueDate}
        submitted={submitted}
      />
    </AppShell>
  )
}

export default function AssignmentDetailPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading assignment...</p>
          </div>
        </div>
      </AppShell>
    }>
      <AssignmentDetailContent />
    </Suspense>
  )
}
