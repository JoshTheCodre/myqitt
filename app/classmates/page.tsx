'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/lib/store/authStore'
import { ClassmateService, type Classmate } from '@/lib/services'
import { ClassmateConnectionModal } from '@/components/classmate-connection-modal'
import { supabase } from '@/lib/supabase/client'

interface HeaderProps {
  classmateCount: number
}

interface ClassmateCardProps {
  classmate: Classmate
  isCurrentUser: boolean
  isConnected: boolean
  onConnect: () => void
}

interface ClassmatesListProps {
  onCountUpdate: (count: number) => void
}


// ============ HEADER COMPONENT ============
function Header({ classmateCount }: HeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Classmates</h1>
        <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm font-semibold">{classmateCount}</div>
      </div>
      <p className="text-gray-500 mt-2 text-sm">Connect with peers to share timetables, assignments & more</p>
    </div>
  )
}

// ============ CLASSMATE CARD COMPONENT ============
function ClassmateCard({ 
  classmate,
  isCurrentUser,
  isConnected,
  onConnect
}: ClassmateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 overflow-hidden group relative">
      <div className="p-5">
        {/* Current user badge or Connect button */}
        {isCurrentUser ? (
          <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            You
          </div>
        ) : (
          <button
            onClick={onConnect}
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isConnected
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            {isConnected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Connected
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Connect
              </>
            )}
          </button>
        )}

        {/* Avatar and header */}
        <div className="flex items-center gap-3 pr-24">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg border border-blue-100 group-hover:border-blue-200 transition-colors">
            {classmate.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{classmate.name}</h3>
            {classmate.isCourseRep && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full border border-amber-200">
                Course Rep
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ CLASSMATES LIST COMPONENT ============
function ClassmatesList({ onCountUpdate }: ClassmatesListProps) {
  const { user, profile } = useAuthStore()
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [connections, setConnections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null)
  const [showModal, setShowModal] = useState(false)

  const loadConnections = async () => {
    if (!user?.id) return
    
    try {
      const { data } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', user.id)
      
      if (data) {
        setConnections(new Set(data.map(c => c.following_id)))
      }
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  useEffect(() => {
    const loadClassmates = async () => {
      if (!user || !profile?.class_group_id) {
        setLoading(false)
        return
      }

      try {
        const data = await ClassmateService.getClassmates(user.id)
        setClassmates(data)
        onCountUpdate(data.length)
        await loadConnections()
      } catch (error) {
        console.error('Error loading classmates:', error)
        setClassmates([])
        onCountUpdate(0)
      } finally {
        setLoading(false)
      }
    }

    loadClassmates()
  }, [user?.id, profile?.class_group_id, onCountUpdate])

  const handleConnectClick = (classmate: Classmate) => {
    setSelectedClassmate(classmate)
    setShowModal(true)
  }

  const handleConnected = () => {
    loadConnections()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 overflow-hidden relative">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            
            {/* Connect button skeleton */}
            <div className="absolute top-4 right-4 h-7 w-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full"></div>
            
            {/* Avatar and header */}
            <div className="flex items-center gap-3 pr-20">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-md w-28 mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-md w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (classmates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">No classmates found in your class</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classmates.map((classmate) => (
          <ClassmateCard
            key={classmate.id}
            classmate={classmate}
            isCurrentUser={classmate.id === user?.id}
            isConnected={connections.has(classmate.id)}
            onConnect={() => handleConnectClick(classmate)}
          />
        ))}
      </div>

      {/* Connection Modal */}
      {selectedClassmate && user && (
        <ClassmateConnectionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedClassmate(null)
          }}
          classmate={selectedClassmate}
          currentUserId={user.id}
          onConnected={handleConnected}
        />
      )}
    </>
  )
}

// ============ MAIN COMPONENT ============
export default function ClassmatesPage() {
  const [classmateCount, setClassmateCount] = useState(0)

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-7xl px-4 py-8 pb-24 lg:pb-8">
          <Header classmateCount={classmateCount} />
          <div className="mt-12">
            <ClassmatesList 
              onCountUpdate={setClassmateCount}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
