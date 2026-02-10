"use client"

import { useState } from "react"
import type { Classmate } from "@/app/classmates/store/classmateStore"
import { MemberCard } from "./member-card"
import { EditPermissionsModal } from "./edit-permissions-modal"
import toast from "react-hot-toast"

interface DetailedTabProps {
  classmates: Classmate[]
  currentUserId: string
}

export function DetailedTab({ classmates, currentUserId }: DetailedTabProps) {
  const [editingMember, setEditingMember] = useState<{
    id: string
    name: string
    email: string
    permissions: string[]
  } | null>(null)

  // Course reps have full permissions
  const courseRepPermissions = ["post-assignment", "post-timetable", "post-resources", "manage-team", "full"]
  // Students have view-only permissions
  const studentPermissions = ["view-manage-space"]

  // Sort classmates: course reps first, then students
  const sortedClassmates = [...classmates].sort((a, b) => {
    if (a.isCourseRep && !b.isCourseRep) return -1
    if (!a.isCourseRep && b.isCourseRep) return 1
    return a.name.localeCompare(b.name)
  })

  const handleEditPermissions = (member: Classmate) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      email: member.email,
      permissions: member.isCourseRep ? courseRepPermissions : studentPermissions,
    })
  }

  const handleSavePermissions = (permissions: string[]) => {
    // TODO: Implement actual permission saving logic
    toast.success("Permissions updated successfully")
    console.log("Updated permissions:", permissions)
  }

  return (
    <div className="space-y-2">
      {sortedClassmates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          No members found
        </div>
      ) : (
        sortedClassmates.map((member) => (
          <MemberCard
            key={member.id}
            name={member.name}
            email={member.email}
            role={member.isCourseRep ? "Course Rep" : "Student"}
            status="approved"
            badge={member.id === currentUserId ? "You" : undefined}
            showAdminBadge={member.isCourseRep}
            type="detailed"
            permissions={member.isCourseRep ? courseRepPermissions : studentPermissions}
            onRevoke={() => handleEditPermissions(member)}
          />
        ))
      )}

      {editingMember && (
        <EditPermissionsModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          memberName={editingMember.name}
          memberEmail={editingMember.email}
          currentPermissions={editingMember.permissions}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  )
}
