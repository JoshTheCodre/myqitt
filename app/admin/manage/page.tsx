'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/lib/store/authStore'
import { ClassmateService, type Classmate } from '@/lib/services'
import { ConnectionService } from '@/lib/services/connectionService'
import { ArrowLeft, Users, UserCheck, UserX, Search, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { formatDepartmentName } from '@/lib/hooks/useDepartments'

export default function ManageClassmatesPage() {
  const { profile, user } = useAuthStore()
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [filteredClassmates, setFilteredClassmates] = useState<Classmate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'connected' | 'unconnected'>('all')

  useEffect(() => {
    if (profile?.department && profile?.school && profile?.level && user) {
      fetchClassmates()
    }
  }, [profile?.department, profile?.school, profile?.level, user?.id])

  useEffect(() => {
    filterClassmates()
  }, [searchQuery, filterType, classmates])

  const fetchClassmates = async () => {
    if (!profile?.department || !profile?.school || !profile?.level || !user) return
    
    try {
      setLoading(true)
      const data = await ClassmateService.getClassmates(
        user.id,
        profile.school,
        profile.department,
        profile.level
      )
      setClassmates(data)
    } catch (error) {
      console.error('Error fetching classmates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClassmates = () => {
    let filtered = [...classmates]

    // Filter by connection status
    if (filterType === 'connected') {
      filtered = filtered.filter(c => c.isConnected)
    } else if (filterType === 'unconnected') {
      filtered = filtered.filter(c => !c.isConnected)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.department?.toLowerCase().includes(query)
      )
    }

    setFilteredClassmates(filtered)
  }

  const handleDisconnect = async (classmateId: string) => {
    if (!user) return
    
    try {
      await ConnectionService.disconnectUser(user.id, classmateId)
      setClassmates(prev => prev.map(c => 
        c.id === classmateId ? { ...c, isConnected: false } : c
      ))
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }

  const connectedCount = classmates.filter(c => c.isConnected).length
  const totalCount = classmates.length

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center bg-gray-50">
        <div className="w-full max-w-3xl px-4 py-6 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/department">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Department</span>
              </button>
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Classmates</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {profile?.department ? formatDepartmentName(profile.department) : ''} • {profile?.level ? `${profile.level}00 Level` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-gray-600">Connected</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{connectedCount}</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Others</span>
              </div>
              <p className="text-2xl font-bold text-gray-500">{totalCount - connectedCount}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classmates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setFilterType('connected')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filterType === 'connected'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Connected ({connectedCount})
              </button>
              <button
                onClick={() => setFilterType('unconnected')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filterType === 'unconnected'
                    ? 'bg-gray-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Others ({totalCount - connectedCount})
              </button>
            </div>
          </div>

          {/* Classmates List */}
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-gray-600">Loading classmates...</p>
            </div>
          ) : filteredClassmates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No classmates found</h3>
              <p className="text-gray-600 text-sm">
                {searchQuery ? 'Try a different search term' : 'No classmates match the current filter'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
              {filteredClassmates.map((classmate) => (
                <div
                  key={classmate.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-sm">
                        {getInitials(classmate.name)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{classmate.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {classmate.isConnected && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <UserCheck className="w-3 h-3" />
                            Connected
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {classmate.followers || 0} connections
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {classmate.isConnected && (
                        <button
                          onClick={() => handleDisconnect(classmate.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
