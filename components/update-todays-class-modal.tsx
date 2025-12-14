'use client'

import React, { useState, useEffect } from 'react'
import { X, Clock, MapPin, BookOpen, Save, AlertCircle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface TimetableClass {
  id: string
  course_code: string
  start_time: string
  end_time: string
  location: string
  day: string
}

interface TodaysClass {
  id?: string
  timetable_id?: string
  course_code: string
  start_time: string
  end_time: string
  location: string
  is_cancelled: boolean
  notes: string
  date: string
}

interface UpdateTodaysClassModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  originalClass: TimetableClass
  existingUpdate?: TodaysClass | null
  onUpdate: () => void
}

export function UpdateTodaysClassModal({
  isOpen,
  onClose,
  userId,
  originalClass,
  existingUpdate,
  onUpdate
}: UpdateTodaysClassModalProps) {
  // Convert 12-hour format (9:00am) to 24-hour format (09:00) for HTML time input
  const convertTo24Hour = (time: string): string => {
    if (!time) return ''
    
    // If already in 24-hour format, return as is
    if (!time.toLowerCase().includes('am') && !time.toLowerCase().includes('pm')) {
      return time
    }
    
    const cleanTime = time.toLowerCase().replace(/\s+/g, '')
    const match = cleanTime.match(/(\d+):(\d+)(am|pm)/)
    if (!match) return time
    
    let hour = parseInt(match[1])
    const minute = match[2]
    const period = match[3]
    
    if (period === 'pm' && hour !== 12) {
      hour += 12
    } else if (period === 'am' && hour === 12) {
      hour = 0
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute}`
  }

  const [formData, setFormData] = useState<TodaysClass>({
    timetable_id: originalClass.id,
    course_code: originalClass.course_code,
    start_time: convertTo24Hour(originalClass.start_time),
    end_time: convertTo24Hour(originalClass.end_time),
    location: originalClass.location,
    is_cancelled: false,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (existingUpdate) {
      setFormData({
        id: existingUpdate.id,
        timetable_id: existingUpdate.timetable_id,
        course_code: existingUpdate.course_code,
        start_time: convertTo24Hour(existingUpdate.start_time),
        end_time: convertTo24Hour(existingUpdate.end_time),
        location: existingUpdate.location,
        is_cancelled: existingUpdate.is_cancelled,
        notes: existingUpdate.notes || '',
        date: existingUpdate.date
      })
    } else {
      setFormData({
        timetable_id: originalClass.id,
        course_code: originalClass.course_code,
        start_time: convertTo24Hour(originalClass.start_time),
        end_time: convertTo24Hour(originalClass.end_time),
        location: originalClass.location,
        is_cancelled: false,
        notes: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
    setHasChanges(false)
  }, [originalClass, existingUpdate, isOpen])

  const handleChange = (field: keyof TodaysClass, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    // Allow saving if there are changes OR if it's a new update (no existingUpdate)
    if (!hasChanges && existingUpdate) {
      toast.error('No changes made')
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        user_id: userId,
        course_code: formData.course_code,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        is_cancelled: formData.is_cancelled,
        notes: formData.notes || null,
        date: formData.date
      }

      if (formData.id && existingUpdate) {
        // Update existing record
        const { error } = await supabase
          .from('todays_classes')
          .update(dataToSave)
          .eq('id', formData.id)

        if (error) throw error
        toast.success('Today\'s class updated! ✨')
      } else {
        // Create new override - database will auto-generate UUID for id
        const { error } = await supabase
          .from('todays_classes')
          .insert(dataToSave)

        if (error) throw error
        toast.success('Today\'s class updated! ✨')
      }

      onUpdate()
      onClose()
    } catch (error: any) {
      console.error('Error saving today\'s class:', error)
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!formData.id) {
      onClose()
      return
    }

    if (!confirm('Remove today\'s update and revert to original timetable?')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('todays_classes')
        .delete()
        .eq('id', formData.id)

      if (error) throw error
      toast.success('Reverted to original timetable')
      onUpdate()
      onClose()
    } catch (error: any) {
      console.error('Error deleting today\'s class:', error)
      toast.error(error.message || 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    
    // If already formatted with am/pm
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
      const cleanTime = time.toLowerCase().replace(/\s+/g, '')
      const match = cleanTime.match(/(\d+):(\d+)(am|pm)/)
      if (match) {
        return `${match[1]}:${match[2]}${match[3].toUpperCase()}`
      }
      return time
    }
    
    // Convert from 24-hour format
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes}${ampm}`
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
        <div
          className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-2xl font-bold mb-1">Update Today's Class</h2>
                <p className="text-blue-100 text-sm">
                  Changes only apply to Monday {/* TESTING: Hardcoded Monday */}
                  {/* {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })} */}
                </p>
                <p className="text-blue-200 text-xs mt-1 font-semibold">
                  🧪 Testing Mode - Showing Monday's classes
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Original Class Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Original Schedule</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>{originalClass.course_code}</strong></p>
                <p>{formatTime(originalClass.start_time)} - {formatTime(originalClass.end_time)} • {originalClass.location}</p>
              </div>
            </div>

            {/* Cancel Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">Cancel This Class</span>
                  <p className="text-sm text-gray-500 mt-1">Mark this class as cancelled for today</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.is_cancelled}
                    onChange={(e) => handleChange('is_cancelled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
                </div>
              </label>
            </div>

            {!formData.is_cancelled && (
              <>
                {/* Course Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={formData.course_code}
                    onChange={(e) => handleChange('course_code', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., CSC 301"
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleChange('start_time', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleChange('end_time', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Lab 3, Building A"
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes {formData.is_cancelled && '(Reason for cancellation)'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder={formData.is_cancelled ? "e.g., Lecturer is unavailable" : "e.g., Moved to larger venue"}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              {formData.id && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-3 text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Revert
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || (!hasChanges && existingUpdate)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  loading || (!hasChanges && existingUpdate)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
                }`}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
