'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

// Helper function to format department names
function formatDepartmentName(dept: string): string {
  return dept
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { profile, user, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    bio: '',
  })

  // Populate form with current profile data only when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        phone_number: profile.phone_number || '',
        bio: profile.bio || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    // Validate
    if (!formData.name.trim()) return toast.error('Name is required')

    setLoading(true)
    
    try {
      // Prepare update data - only editable fields
      const updateData = {
        name: formData.name,
        phone_number: formData.phone_number || undefined,
        bio: formData.bio || undefined,
      }

      await updateProfile(updateData)
      onClose()
      
    } catch (error) {
      // Error already handled in store
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget && !loading) {
          onClose()
        }
      }}
    >
      <div className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 disabled:opacity-50"
              style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 disabled:opacity-50"
              style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
            />
          </div>

          {/* Class Info (Read Only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">Class Information</label>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">School:</span> {typeof profile?.school === 'object' ? profile?.school?.name : profile?.school || 'Not set'}</p>
              <p><span className="font-medium">Department:</span> {profile?.class_group?.department?.name ? formatDepartmentName(profile.class_group.department.name) : 'Not set'}</p>
              <p><span className="font-medium">Level:</span> {profile?.class_group?.level?.level_number ? `${profile.class_group.level.level_number}00 Level` : 'Not set'}</p>
              <p><span className="font-medium">Semester:</span> {profile?.current_semester?.name || 'Not set'}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Contact your course rep to change class information.</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={loading}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 resize-none"
              style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
