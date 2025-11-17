'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { FileText, Calendar, User, ChevronRight } from 'lucide-react'

export default function AssignmentPage() {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)

  // ============ HEADER COMPONENT ============
  const Header = () => (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Assignments</h1>
        <div className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#E8ECFF', color: '#0A32F8' }}>5</div>
      </div>
      <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm">
        <FileText className="w-4 h-4" />
        <p>Track your academic assignments and deadlines</p>
      </div>
    </div>
  )

  // ============ ASSIGNMENT CARD COMPONENT ============
  const AssignmentCard = ({ 
    courseCode, 
    assignmentCount, 
    dates,
    onDateClick 
  }: { 
    courseCode: string
    assignmentCount: number
    dates: { date: string; label: string }[]
    onDateClick: (date: string) => void
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-6" style={{ borderColor: selectedAssignment ? '#0A32F8' : '#e5e7eb' }}>
      <div className="rounded-full mb-4 h-2" style={{ background: 'linear-gradient(to right, #E8ECFF, #C8DBFF)' }} />
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{courseCode}</h3>
          <p className="text-sm text-gray-600 mt-1">{assignmentCount} assignment{assignmentCount > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Dates</p>
        <div className="flex flex-wrap gap-2">
          {dates.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onDateClick(item.date)}
              className="px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-colors"
              style={{ 
                backgroundColor: '#E8ECFF',
                color: '#0A32F8',
                border: '1px solid #C8DBFF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C8DBFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E8ECFF'
              }}
            >
              <Calendar className="w-3 h-3" />
              <span>{item.label}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ============ ASSIGNMENTS LIST COMPONENT ============
  const AssignmentsList = () => {
    const assignments = [
      {
        id: 1,
        courseCode: 'STAT 180',
        assignmentCount: 2,
        dates: [
          { date: '2025-12-25', label: 'Dec 25' },
          { date: '2025-12-30', label: 'Dec 30' },
        ],
      },
      {
        id: 2,
        courseCode: 'CSC 310',
        assignmentCount: 1,
        dates: [
          { date: '2025-12-28', label: 'Dec 28' },
        ],
      },
      {
        id: 3,
        courseCode: 'MATH 250',
        assignmentCount: 3,
        dates: [
          { date: '2025-12-22', label: 'Dec 22' },
          { date: '2025-12-26', label: 'Dec 26' },
          { date: '2025-12-31', label: 'Dec 31' },
        ],
      },
      {
        id: 4,
        courseCode: 'PHY 240',
        assignmentCount: 2,
        dates: [
          { date: '2025-12-24', label: 'Dec 24' },
          { date: '2025-12-29', label: 'Dec 29' },
        ],
      },
      {
        id: 5,
        courseCode: 'ENG 260',
        assignmentCount: 1,
        dates: [
          { date: '2025-12-27', label: 'Dec 27' },
        ],
      },
    ]

    const handleDateClick = (date: string) => {
      setSelectedAssignment(date)
      // Can add modal or navigation here
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            courseCode={assignment.courseCode}
            assignmentCount={assignment.assignmentCount}
            dates={assignment.dates}
            onDateClick={handleDateClick}
          />
        ))}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header />
          
          <div className="mt-12">
            <AssignmentsList />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
