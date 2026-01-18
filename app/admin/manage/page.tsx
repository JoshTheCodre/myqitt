'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore, type UserProfileWithDetails } from '@/lib/store/authStore'
import { ClassmateService, type Classmate } from '@/lib/services'
import { ChevronLeft, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Helper function to format department names
function formatDepartmentName(dept: string): string {
  return dept
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ============================================
// PermissionTag Component
// ============================================
interface PermissionTagProps {
  permission: string
}

function PermissionTag({ permission }: PermissionTagProps) {
  const permissionLabels: Record<string, string> = {
    "course_rep": "Course Rep",
    "student": "Student",
  }

  const label = permissionLabels[permission] || permission

  return (
    <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-blue-200 text-blue-600 bg-blue-50">
      {label}
    </div>
  )
}

// ============================================
// MemberCard Component
// ============================================
interface MemberCardProps {
  name: string
  email: string
  role: string
  badge?: string
  type: "overview" | "detailed"
  isCurrentUser?: boolean
}

function MemberCard({ name, email, role, badge, type, isCurrentUser }: MemberCardProps) {
  if (type === "overview") {
    return (
      <div className="flex items-center justify-between border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm">
                {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-gray-900">{name}</h4>
                {badge && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-semibold">{badge}</span>}
              </div>
              <p className="text-sm text-gray-600">{email}</p>
            </div>
          </div>
        </div>
        {!isCurrentUser && (
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-blue-800">{name}</h3>
            {badge && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-semibold">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{email}</p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <PermissionTag permission={role} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TabNavigation Component
// ============================================
interface TabNavigationProps {
  activeTab: "overview" | "detailed"
  onTabChange: (tab: "overview" | "detailed") => void
}

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: "overview", label: "Members" },
    { id: "detailed", label: "Roles" },
  ] as const

  return (
    <div className="flex gap-2 w-full py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="text-sm font-semibold">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function ManageClassmatesPage() {
  const router = useRouter()
  const { profile, user } = useAuthStore()
  const typedProfile = profile as UserProfileWithDetails | null
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [filteredClassmates, setFilteredClassmates] = useState<Classmate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Check if user is course rep
  const isCourseRep = typedProfile?.user_roles?.some(
    (ur: { role?: { name: string } }) => ur.role?.name === 'course_rep'
  ) || false
  
  // Get class_group_id and display info
  const classGroupId = typedProfile?.class_group_id
  const departmentName = typedProfile?.class_group?.department?.name
  const levelNumber = typedProfile?.class_group?.level?.level_number

  // Redirect if not course rep
  useEffect(() => {
    if (!initialized) return
    
    if (profile && !isCourseRep) {
      router.push('/dashboard')
    }
  }, [profile, isCourseRep, router, initialized])

  useEffect(() => {
    if (!initialized) return
    
    if (classGroupId && user && profile) {
      fetchClassmates()
    } else if (initialized) {
      setLoading(false)
    }
  }, [classGroupId, user?.id, profile?.id, initialized])

  useEffect(() => {
    filterClassmates()
  }, [searchQuery, classmates])

  const fetchClassmates = async () => {
    if (!classGroupId || !user) return
    
    try {
      setLoading(true)
      const data = await ClassmateService.getClassmates(classGroupId)
      setClassmates(data)
    } catch (error) {
      console.error('Error fetching classmates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClassmates = () => {
    let filtered = [...classmates]

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }

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
                  {departmentName ? formatDepartmentName(departmentName) : ''} • {levelNumber ? `${levelNumber}00 Level` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Total Classmates</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classmates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
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
                {searchQuery ? 'Try a different search term' : 'No classmates in your department'}
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
                    </div>

                    {/* Actions */}
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
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
