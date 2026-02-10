'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/utils/layout/app-shell'
import { useAuthStore, type UserProfileWithDetails } from '@/app/auth/store/authStore'
import { supabase } from '@/utils/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const { profile, user } = useAuthStore()
  const typedProfile = profile as UserProfileWithDetails | null
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Check if user is course rep
  const isCourseRep = typedProfile?.user_roles?.some(
    (ur: { role?: { name: string } }) => ur.role?.name === 'course_rep'
  ) || false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return toast.error('Title is required')
    if (!content.trim()) return toast.error('Content is required')
    if (!typedProfile?.class_group_id) {
      return toast.error('Profile incomplete')
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          content: content.trim(),
          user_id: user?.id,
          class_group_id: typedProfile.class_group_id,
        })

      if (error) throw error

      toast.success('Announcement posted!')
      router.push('/department')
    } catch (error) {
      console.error('Error posting announcement:', error)
      toast.error('Failed to post announcement')
    } finally {
      setLoading(false)
    }
  }

  // Only course reps can access this page
  if (!isCourseRep) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Only course reps can create announcements.</p>
            <Link href="/department">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Go Back
              </button>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/department">
              <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New Announcement</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Class Cancelled Tomorrow"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement here..."
                rows={6}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 resize-none disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                'Posting...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Post Announcement
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
