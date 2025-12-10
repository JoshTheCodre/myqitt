'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'
import { ProfileService } from '@/lib/services'
import type { School, Department } from '@/lib/services'

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
  const [schools, setSchools] = useState<School[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    school: '',
    department: '',
    level: '',
    semester: '',
    bio: '',
  })

  // Load schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsData = await ProfileService.getSchools()
        setSchools(schoolsData)
      } catch (error) {
        // Error already handled in service
      } finally {
        setLoadingSchools(false)
      }
    }

    if (isOpen) {
      fetchSchools()
    }
  }, [isOpen])

  // Load departments when school changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.school) {
        setDepartments([])
        return
      }

      setLoadingDepartments(true)
      try {
        const departmentsData = await ProfileService.getDepartments(formData.school)
        setDepartments(departmentsData)
      } catch (error) {
        // Error already handled in service
        setDepartments([])
      } finally {
        setLoadingDepartments(false)
      }
    }

    fetchDepartments()
  }, [formData.school])

  // Populate form with current profile data only when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        phone_number: profile.phone_number || '',
        school: profile.school || '',
        department: profile.department || '',
        level: profile.level ? String(profile.level) : '',
        semester: profile.semester || '',
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
    if (!formData.level) return toast.error('Level is required')
    if (!formData.semester) return toast.error('Semester is required')

    setLoading(true)
    
    try {
      // Convert semester from "1"/"2" to "first"/"second" if needed
      let semester = formData.semester
      if (semester === '1') semester = 'first'
      if (semester === '2') semester = 'second'

      // Prepare update data
      const updateData = {
        name: formData.name,
        phone_number: formData.phone_number || undefined,
        department: formData.department || undefined,
        level: parseInt(formData.level),
        semester: semester,
        bio: formData.bio || undefined,
        school: formData.school || undefined,
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

          {/* School */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">School</label>
            <div className="relative">
              <select
                name="school"
                value={formData.school}
                onChange={handleChange}
                disabled={loading || loadingSchools}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900 disabled:opacity-50"
                style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
              >
                <option value="">Select School</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Department</label>
            <div className="relative">
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading || loadingDepartments || !formData.school}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900 disabled:opacity-50"
                style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
              >
                <option value="">
                  {!formData.school ? 'Select a school first' : loadingDepartments ? 'Loading departments...' : departments.length === 0 ? 'No departments available' : 'Select Department'}
                </option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.department}>
                    {formatDepartmentName(dept.department)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
            </div>
          </div>

          {/* Level and Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Level</label>
              <div className="relative">
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900 disabled:opacity-50"
                  style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                >
                  <option value="">Select Level</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                  <option value="6">Level 6</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Semester</label>
              <div className="relative">
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900 disabled:opacity-50"
                  style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                >
                  <option value="">Select Semester</option>
                  <option value="first">First Semester</option>
                  <option value="second">Second Semester</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
              </div>
            </div>
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
