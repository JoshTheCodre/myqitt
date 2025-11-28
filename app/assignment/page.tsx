'use client'

import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AppShell } from '@/components/layout/app-shell'
import { FileText, Calendar, ChevronRight } from 'lucide-react'

// ============ TYPES ============
interface AssignmentDate {
  date: string
  label: string
  title: string
  description: string
  submissionType: string
  lecturer: string
}

interface Assignment {
  id: number
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
}

interface AssignmentCardProps {
  courseCode: string
  assignmentCount: number
  dates: AssignmentDate[]
  onDateClick: (dateLabel: string) => void
}

interface AssignmentsListProps {
  router: AppRouterInstance
}

// ============ HEADER COMPONENT ============
function Header() {
  return (
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
}

// ============ ASSIGNMENT CARD COMPONENT ============
function AssignmentCard({ 
  courseCode, 
  assignmentCount, 
  dates,
  onDateClick 
}: AssignmentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-6">
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
              onClick={() => onDateClick(item.label)}
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
}

// ============ ASSIGNMENTS LIST COMPONENT ============
function AssignmentsList({ router }: AssignmentsListProps) {
  const assignments: Assignment[] = [
    {
      id: 1,
      courseCode: 'STAT 180',
      assignmentCount: 2,
      dates: [
        { 
          date: '2025-12-25', 
          label: 'Dec 25',
          title: 'Statistical Analysis Project',
          description: 'Complete a comprehensive statistical analysis of the provided dataset using SPSS or R. Include hypothesis testing, correlation analysis, and regression modeling.',
          submissionType: 'PDF Report',
          lecturer: 'Dr. Adewale Johnson'
        },
        { 
          date: '2025-12-30', 
          label: 'Dec 30',
          title: 'Probability Theory Assignment',
          description: 'Solve problems 1-20 from Chapter 5. Show all working and provide detailed explanations for each solution.',
          submissionType: 'Handwritten/PDF',
          lecturer: 'Dr. Adewale Johnson'
        },
      ],
    },
    {
      id: 2,
      courseCode: 'CSC 310',
      assignmentCount: 1,
      dates: [
        { 
          date: '2025-12-28', 
          label: 'Dec 28',
          title: 'Web Application Development',
          description: 'Build a full-stack web application using React and Node.js. Must include authentication, CRUD operations, and responsive design.',
          submissionType: 'GitHub Repository Link',
          lecturer: 'Engr. Sarah Okonkwo'
        },
      ],
    },
    {
      id: 3,
      courseCode: 'MATH 250',
      assignmentCount: 3,
      dates: [
        { 
          date: '2025-12-22', 
          label: 'Dec 22',
          title: 'Linear Algebra Problems',
          description: 'Complete exercises 10-25 from the textbook. Focus on matrix operations, eigenvalues, and vector spaces.',
          submissionType: 'PDF',
          lecturer: 'Prof. Michael Eze'
        },
        { 
          date: '2025-12-26', 
          label: 'Dec 26',
          title: 'Calculus Applications',
          description: 'Solve real-world problems using integration and differentiation techniques learned in class.',
          submissionType: 'Handwritten',
          lecturer: 'Prof. Michael Eze'
        },
        { 
          date: '2025-12-31', 
          label: 'Dec 31',
          title: 'Differential Equations',
          description: 'Solve first and second-order differential equations. Include boundary value problems.',
          submissionType: 'PDF',
          lecturer: 'Prof. Michael Eze'
        },
      ],
    },
    {
      id: 4,
      courseCode: 'PHY 240',
      assignmentCount: 2,
      dates: [
        { 
          date: '2025-12-24', 
          label: 'Dec 24',
          title: 'Quantum Mechanics Lab Report',
          description: 'Write a detailed lab report on the photoelectric effect experiment conducted in class. Include data analysis and conclusions.',
          submissionType: 'PDF Report',
          lecturer: 'Dr. Chukwuemeka Nnamdi'
        },
        { 
          date: '2025-12-29', 
          label: 'Dec 29',
          title: 'Thermodynamics Problems',
          description: 'Solve problems related to the laws of thermodynamics, heat engines, and entropy.',
          submissionType: 'Handwritten/PDF',
          lecturer: 'Dr. Chukwuemeka Nnamdi'
        },
      ],
    },
    {
      id: 5,
      courseCode: 'ENG 260',
      assignmentCount: 1,
      dates: [
        { 
          date: '2025-12-27', 
          label: 'Dec 27',
          title: 'Research Paper on Nigerian Literature',
          description: 'Write a 2000-word research paper analyzing the themes and literary devices in Chinua Achebe\'s "Things Fall Apart".',
          submissionType: 'Word Document',
          lecturer: 'Dr. Fatima Bello'
        },
      ],
    },
  ]

  const handleDateClick = (assignmentData: AssignmentDate & { courseCode: string }) => {
    // Navigate to assignment detail page with query params
    const params = new URLSearchParams({
      courseCode: assignmentData.courseCode,
      title: assignmentData.title,
      description: assignmentData.description,
      dueDate: assignmentData.label,
      submissionType: assignmentData.submissionType,
      lecturer: assignmentData.lecturer,
    })
    router.push(`/assignment/detail?${params.toString()}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          courseCode={assignment.courseCode}
          assignmentCount={assignment.assignmentCount}
          dates={assignment.dates}
          onDateClick={(dateLabel) => {
            const dateData = assignment.dates.find(d => d.label === dateLabel)
            if (dateData) {
              handleDateClick({ ...dateData, courseCode: assignment.courseCode })
            }
          }}
        />
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function AssignmentPage() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Header />
          
          <div className="mt-12">
            <AssignmentsList router={router} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
