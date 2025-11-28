'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Users, FileText, Clock } from 'lucide-react'

// ============ TYPES ============
interface Classmate {
  id: number
  name: string
  followers: number
  hasAssignments: boolean
  hasTimetable: boolean
  connectedTo?: string
}

interface HeaderProps {
  classmateCount: number
}

interface ClassmateCardProps {
  name: string
  followers: number
  hasAssignments: boolean
  hasTimetable: boolean
  connected: boolean
  connectedTo?: string
  onConnect: (name: string) => void
}

interface ClassmatesListProps {
  connectedClassmates: Record<string, boolean>
  setConnectedClassmates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

// ============ HEADER COMPONENT ============
const Header = ({ classmateCount }: HeaderProps) => (
  <div>
    <div className="flex items-center gap-3">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Classmates</h1>
      <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm font-semibold">{classmateCount}</div>
    </div>
    <p className="text-gray-500 mt-2 text-sm">Connect with peers in your class</p>
  </div>
)

// ============ CLASSMATE CARD COMPONENT ============
const ClassmateCard = ({ 
  name, 
  followers,
  hasAssignments,
  hasTimetable,
  connected,
  connectedTo,
  onConnect 
}: ClassmateCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 overflow-hidden group relative">
    <div className="p-5 flex flex-col gap-4">
      {/* Connect button - top right rectangular */}
      <button
        onClick={() => onConnect(name)}
        className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${
          connected
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
        }`}
      >
        {connected ? '✓ Connected' : 'Connect'}
      </button>

      {/* Avatar and header */}
      <div className="flex items-center gap-3 pr-20">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg border border-blue-100 group-hover:border-blue-200 transition-colors">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate">{name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{followers} followers</span>
          </div>
        </div>
      </div>

      {/* Connection status badge - cute social style */}
      {connected && connectedTo && (
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-lg px-4 py-3">
          <p className="text-xs font-medium text-emerald-700 mb-1">💚 Connected With</p>
          <p className="text-sm font-bold text-emerald-900">{connectedTo}</p>
        </div>
      )}

      {/* Status items - only show if not connected */}
      {!connected && (
        <div className="space-y-2">
          {/* Assignments */}
          <div className="flex items-center gap-2.5">
            <FileText className={`w-4 h-4 flex-shrink-0 ${
              hasAssignments ? 'text-blue-600' : 'text-gray-300'
            }`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Assignments</span>
                <span className="text-gray-500 mx-1.5">•</span>
                <span className={hasAssignments ? 'font-medium text-gray-700' : 'text-gray-400'}>
                  {hasAssignments ? 'Shared' : 'None'}
                </span>
              </p>
            </div>
          </div>

          {/* Timetable */}
          <div className="flex items-center gap-2.5">
            <Clock className={`w-4 h-4 flex-shrink-0 ${
              hasTimetable ? 'text-blue-600' : 'text-gray-300'
            }`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Timetable</span>
                <span className="text-gray-500 mx-1.5">•</span>
                <span className={hasTimetable ? 'font-medium text-gray-700' : 'text-gray-400'}>
                  {hasTimetable ? 'Shared' : 'None'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)

// ============ CLASSMATES LIST COMPONENT ============
const ClassmatesList = ({ connectedClassmates, setConnectedClassmates }: ClassmatesListProps) => {
  const classmates: Classmate[] = [
    { 
      id: 1, 
      name: 'Adekunle Ade',
      followers: 24,
      hasAssignments: true,
      hasTimetable: true,
      connectedTo: 'Blessing Grace',
    },
    { 
      id: 2, 
      name: 'Chioma Uche',
      followers: 18,
      hasAssignments: true,
      hasTimetable: false,
    },
    { 
      id: 3, 
      name: 'Tunde Adeyemi',
      followers: 32,
      hasAssignments: false,
      hasTimetable: true,
      connectedTo: 'Adekunle Ade',
    },
    { 
      id: 4, 
      name: 'Zainab Ahmed',
      followers: 15,
      hasAssignments: true,
      hasTimetable: true,
    },
    { 
      id: 5, 
      name: 'Oluwaseun Bello',
      followers: 27,
      hasAssignments: false,
      hasTimetable: false,
    },
    { 
      id: 6, 
      name: 'Blessing Okonkwo',
      followers: 21,
      hasAssignments: true,
      hasTimetable: true,
      connectedTo: 'Zainab Ahmed',
    },
    { 
      id: 7, 
      name: 'David Okafor',
      followers: 14,
      hasAssignments: true,
      hasTimetable: false,
    },
    { 
      id: 8, 
      name: 'Gloria Nnamdi',
      followers: 19,
      hasAssignments: false,
      hasTimetable: true,
    },
  ]

  const toggleConnect = (name: string) => {
    setConnectedClassmates((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {classmates.map((classmate) => (
        <ClassmateCard
          key={classmate.id}
          name={classmate.name}
          followers={classmate.followers}
          hasAssignments={classmate.hasAssignments}
          hasTimetable={classmate.hasTimetable}
          connected={connectedClassmates[classmate.name] || !!classmate.connectedTo}
          connectedTo={connectedClassmates[classmate.name] ? classmate.name : classmate.connectedTo}
          onConnect={toggleConnect}
        />
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function ClassmatesPage() {
  const [connectedClassmates, setConnectedClassmates] = useState<Record<string, boolean>>({})

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-7xl px-4 py-8 pb-24 lg:pb-8">
          <Header classmateCount={8} />
          <div className="mt-12">
            <ClassmatesList 
              connectedClassmates={connectedClassmates}
              setConnectedClassmates={setConnectedClassmates}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
