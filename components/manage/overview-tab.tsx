import { useState } from "react"
import type { Classmate } from "@/lib/services"
import { MemberCard } from "./member-card"

interface OverviewTabProps {
  classmates: Classmate[]
  currentUserId: string
}

export function OverviewTab({ classmates, currentUserId }: OverviewTabProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "course-reps" | "students">("all")

  const courseReps = classmates.filter(c => c.isCourseRep)
  const students = classmates.filter(c => !c.isCourseRep)
  
  const displayedMembers = activeFilter === "all" 
    ? classmates 
    : activeFilter === "course-reps" 
    ? courseReps 
    : students

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{classmates.length} member{classmates.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              activeFilter === "all" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({classmates.length})
          </button>
          <button
            onClick={() => setActiveFilter("course-reps")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              activeFilter === "course-reps" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Course Reps ({courseReps.length})
          </button>
          <button
            onClick={() => setActiveFilter("students")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              activeFilter === "students" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Students ({students.length})
          </button>
        </div>
      </div>

      {/* Display members based on active filter */}
      <div className="space-y-2">
        {displayedMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No members found
          </div>
        ) : (
          displayedMembers.map((member) => (
            <MemberCard
              key={member.id}
              name={member.name}
              email={member.email}
              role={member.isCourseRep ? 'Course Rep' : 'Student'}
              status="approved"
              badge={member.id === currentUserId ? 'You' : undefined}
              type="overview"
            />
          ))
        )}
      </div>
    </div>
  )
}
