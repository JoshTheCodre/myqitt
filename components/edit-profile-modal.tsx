'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/authStore'
import { useDepartments, formatDepartmentName } from '@/lib/hooks/useDepartments'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SchoolOption {
  id: string
  name: string
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { profile, user } = useAuthStore()
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    school: '',
    department: '',
    level: '',
    semester: '',
    bio: '',
  })
  
  // Fetch departments based on selected school
  const { departments, loading: loadingDepartments } = useDepartments(formData.school || null)

  // Load schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        console.log('Fetching schools...')
        const { data: schoolsData, error } = await supabase
          .from('schools')
          .select('id, name')

        if (error) {
          console.error('Error fetching schools:', error)
          throw error
        }
        
        console.log('Schools fetched:', schoolsData)
        setSchools(schoolsData || [])
      } catch (error) {
        console.error('Failed to fetch schools:', error)
        toast.error('Failed to load schools')
      } finally {
        setLoadingSchools(false)
      }
    }

    if (isOpen) {
      fetchSchools()
    }
  }, [isOpen])

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
    
    console.log('Submit triggered')
    console.log('User:', user)
    console.log('Profile:', profile)
    
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    // Validate
    if (!formData.name.trim()) {
      return toast.error('Name is required')
    }
    if (!formData.level) {
      return toast.error('Level is required')
    }
    if (!formData.semester) {
      return toast.error('Semester is required')
    }

    setLoading(true)
    console.log('Starting update...')
    
    try {
      // Convert semester from "1"/"2" to "first"/"second" if needed
      let semester = formData.semester
      if (semester === '1') semester = 'first'
      if (semester === '2') semester = 'second'

      // Prepare update data
      const updateData: {
        name: string
        phone_number: string | null
        department: string | null
        level: number
        semester: string
        bio: string | null
        school?: string
      } = {
        name: formData.name,
        phone_number: formData.phone_number || null,
        department: formData.department || null,
        level: parseInt(formData.level),
        semester: semester,
        bio: formData.bio || null,
      }

      // Only include school if it's a valid UUID
      if (formData.school && formData.school.trim()) {
        updateData.school = formData.school
      }

      console.log('Update data:', updateData)
      console.log('Updating user ID:', user.id)

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()

      console.log('Update response:', { data, error })

      if (error) {
        console.error('Update error:', error)
        throw error
      }

      // Update the profile in the store immediately
      if (data && data[0]) {
        useAuthStore.setState({ profile: data[0] })
      }

      toast.success('Profile updated successfully!')
      setLoading(false)
      onClose()
    } catch (error) {
      console.error('Submit error:', error)
      setLoading(false)
      const err = error as Error
      const msg = err?.message || 'Failed to update profile'
      toast.error(msg)
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
