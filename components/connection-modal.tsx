'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, FileText, Clock, User, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  classmate: {
    id: string
    name: string
    bio?: string
    hasTimetable: boolean
    hasAssignments: boolean
  }
  currentUserId: string
  onConnect: (type: 'timetable' | 'assignments' | 'both') => Promise<void>
}

interface LastUpdated {
  timetable?: string
  assignments?: string
}

export function ConnectionModal({ 
  isOpen, 
  onClose, 
  classmate, 
  currentUserId,
  onConnect 
}: ConnectionModalProps) {
  const [selectedType, setSelectedType] = useState<'timetable' | 'assignments' | 'both' | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<LastUpdated>({})
  const [existingConnections, setExistingConnections] = useState<{
    timetable?: string
    assignments?: string
  }>({})

  useEffect(() => {
    if (isOpen) {
      loadLastUpdated()
      loadExistingConnections()
    }
  }, [isOpen, classmate.id])

  async function loadLastUpdated() {
    try {
      const [timetableData, assignmentsData] = await Promise.all([
        classmate.hasTimetable 
          ? supabase.from('timetable').select('updated_at').eq('user_id', classmate.id).single()
          : Promise.resolve({ data: null }),
        classmate.hasAssignments
          ? supabase.from('assignments').select('updated_at').eq('user_id', classmate.id).single()
          : Promise.resolve({ data: null })
      ])

      setLastUpdated({
        timetable: timetableData.data?.updated_at,
        assignments: assignmentsData.data?.updated_at
      })
    } catch (error) {
      console.error('Error loading last updated:', error)
    }
  }

  async function loadExistingConnections() {
    try {
      const { data } = await supabase
        .from('connections')
        .select('following_id, connection_type')
        .eq('follower_id', currentUserId)

      if (data) {
        const connections: any = {}
        data.forEach(conn => {
          if (conn.connection_type === 'timetable' || conn.connection_type === 'both') {
            connections.timetable = conn.following_id
          }
          if (conn.connection_type === 'assignments' || conn.connection_type === 'both') {
            connections.assignments = conn.following_id
          }
        })
        setExistingConnections(connections)
      }
    } catch (error) {
      console.error('Error loading existing connections:', error)
    }
  }

  function getTimeAgo(dateString?: string) {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleConnect() {
    if (!selectedType) return

    setLoading(true)
    try {
      await onConnect(selectedType)
      onClose()
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const canConnect = classmate.hasTimetable || classmate.hasAssignments
  const hasMaxTimetableConnections = existingConnections.timetable !== undefined
  const hasMaxAssignmentConnections = existingConnections.assignments !== undefined

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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {classmate.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{classmate.name}</h2>
                {classmate.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{classmate.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!canConnect ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No shared content available</p>
                <p className="text-sm text-gray-500 mt-1">
                  This user hasn&apos;t added a timetable or assignments yet
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Connect to access:</h3>
                
                <div className="space-y-3">
                  {/* Timetable Option */}
                  {classmate.hasTimetable && (
                    <button
                      onClick={() => setSelectedType(selectedType === 'timetable' ? null : 'timetable')}
                      disabled={hasMaxTimetableConnections}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'timetable'
                          ? 'border-blue-500 bg-blue-50'
                          : hasMaxTimetableConnections
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedType === 'timetable' ? 'bg-blue-500' : 'bg-blue-100'
                        }`}>
                          <Calendar className={`w-5 h-5 ${
                            selectedType === 'timetable' ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">Timetable</h4>
                            {selectedType === 'timetable' && (
                              <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {getTimeAgo(lastUpdated.timetable)}
                          </p>
                          {hasMaxTimetableConnections && (
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                              ⚠️ Already connected to another timetable
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Assignments Option */}
                  {classmate.hasAssignments && (
                    <button
                      onClick={() => setSelectedType(selectedType === 'assignments' ? null : 'assignments')}
                      disabled={hasMaxAssignmentConnections}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'assignments'
                          ? 'border-emerald-500 bg-emerald-50'
                          : hasMaxAssignmentConnections
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedType === 'assignments' ? 'bg-emerald-500' : 'bg-emerald-100'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            selectedType === 'assignments' ? 'text-white' : 'text-emerald-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">Assignments</h4>
                            {selectedType === 'assignments' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {getTimeAgo(lastUpdated.assignments)}
                          </p>
                          {hasMaxAssignmentConnections && (
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                              ⚠️ Already connected to another assignment list
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Both Option */}
                  {classmate.hasTimetable && classmate.hasAssignments && 
                   !hasMaxTimetableConnections && !hasMaxAssignmentConnections && (
                    <button
                      onClick={() => setSelectedType(selectedType === 'both' ? null : 'both')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'both'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedType === 'both' ? 'bg-gradient-to-br from-blue-500 to-emerald-500' : 'bg-gradient-to-br from-blue-100 to-emerald-100'
                        }`}>
                          <CheckCircle2 className={`w-5 h-5 ${
                            selectedType === 'both' ? 'text-white' : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">Both</h4>
                            {selectedType === 'both' && (
                              <CheckCircle2 className="w-5 h-5 text-purple-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Access timetable and assignments
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700">
                    💡 You can connect to <strong>one timetable</strong> and <strong>one assignment list</strong> at a time. 
                    Choose wisely!
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {canConnect && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!selectedType || loading}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    selectedType && !loading
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
