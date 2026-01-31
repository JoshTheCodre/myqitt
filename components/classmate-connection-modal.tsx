'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, FileText, Clock, BookOpen, CheckCircle2, Unlink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ConnectionOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}

interface ClassmateConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  classmate: {
    id: string
    name: string
  }
  currentUserId: string
  onConnected: () => void
}

// Note: course_list is NOT included because courses are general for everyone in the same level/semester
// Only course_outline requires connection to view
const connectionOptions: ConnectionOption[] = [
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'See their class schedule',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500'
  },
  {
    id: 'assignments',
    label: 'Assignments',
    description: 'View their assignment list',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500'
  },
  {
    id: 'today_classes',
    label: "Today's Classes",
    description: 'See their schedule for today',
    icon: <Clock className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500'
  },
  {
    id: 'course_outline',
    label: 'Course Outline',
    description: 'Access their course outlines',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500'
  }
]

export function ClassmateConnectionModal({
  isOpen,
  onClose,
  classmate,
  currentUserId,
  onConnected
}: ClassmateConnectionModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(connectionOptions.map(opt => opt.id)) // All checked by default
  )
  const [loading, setLoading] = useState(false)
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Check if already connected when modal opens
  useEffect(() => {
    const checkConnection = async () => {
      if (!isOpen) return
      
      const { data } = await supabase
        .from('connections')
        .select('connection_types')
        .eq('follower_id', currentUserId)
        .eq('following_id', classmate.id)
        .single()
      
      if (data) {
        setIsAlreadyConnected(true)
        setSelectedOptions(new Set(data.connection_types || []))
      } else {
        setIsAlreadyConnected(false)
        setSelectedOptions(new Set(connectionOptions.map(opt => opt.id)))
      }
    }
    
    checkConnection()
  }, [isOpen, currentUserId, classmate.id])

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(optionId)) {
        newSet.delete(optionId)
      } else {
        newSet.add(optionId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedOptions(new Set(connectionOptions.map(opt => opt.id)))
  }

  const deselectAll = () => {
    setSelectedOptions(new Set())
  }

  const handleConnect = async () => {
    if (selectedOptions.size === 0) {
      toast.error('Please select at least one option')
      return
    }

    setLoading(true)
    try {
      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', classmate.id)
        .single()

      if (existingConnection) {
        // Update existing connection
        const { error } = await supabase
          .from('connections')
          .update({
            connection_types: Array.from(selectedOptions)
          })
          .eq('id', existingConnection.id)

        if (error) throw error
        toast.success(`Updated connection with ${classmate.name}`)
      } else {
        // Create new connection
        const { error } = await supabase
          .from('connections')
          .insert({
            follower_id: currentUserId,
            following_id: classmate.id,
            connection_types: Array.from(selectedOptions)
          })

        if (error) throw error
        toast.success(`Connected with ${classmate.name}!`)
      }

      onConnected()
      onClose()
    } catch (error: any) {
      console.error('Error connecting:', error)
      toast.error(error.message || 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', classmate.id)

      if (error) throw error
      
      toast.success(`Disconnected from ${classmate.name}`)
      onConnected()
      onClose()
    } catch (error: any) {
      console.error('Error disconnecting:', error)
      toast.error(error.message || 'Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-gray-100">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-4 pr-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {classmate.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  Connect with {classmate.name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Choose what you want to access
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Quick actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors font-medium"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors font-medium"
              >
                Deselect All
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {connectionOptions.map((option) => {
                const isSelected = selectedOptions.has(option.id)
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={`w-full p-3.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${option.borderColor} ${option.bgColor}`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? `${option.bgColor} ${option.color}`
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {option.label}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? `${option.borderColor} ${option.bgColor}`
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className={`w-5 h-5 ${option.color}`} />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600">
                💡 Connecting allows you to view their shared content. They will be notified of your connection.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {/* Disconnect button - only show if already connected */}
            {isAlreadyConnected && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="w-full mb-3 px-4 py-2.5 text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={selectedOptions.size === 0 || loading}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                  selectedOptions.size > 0 && !loading
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Saving...' : isAlreadyConnected ? `Update (${selectedOptions.size})` : `Connect (${selectedOptions.size})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
