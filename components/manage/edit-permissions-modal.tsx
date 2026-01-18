"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface EditPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  memberName: string
  memberEmail: string
  currentPermissions: string[]
  onSave: (permissions: string[]) => void
}

const availablePermissions = [
  { id: "view-manage-space", label: "View Manage Space" },
  { id: "post-note", label: "Post Note" },
  { id: "can-post", label: "Can Post" },
  { id: "post-resources", label: "Post Resources" },
  { id: "post-assignment", label: "Post Assignment" },
  { id: "post-timetable", label: "Post Timetable" },
  { id: "manage-team", label: "Manage Team" },
  { id: "view-reports", label: "View Reports" },
  { id: "post-updates", label: "Post Updates" },
  { id: "full", label: "Full Access" },
]

export function EditPermissionsModal({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  currentPermissions,
  onSave,
}: EditPermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(currentPermissions)

  if (!isOpen) return null

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSave = () => {
    onSave(selectedPermissions)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Permissions</h2>
            <p className="text-sm text-gray-600">{memberName}</p>
            <p className="text-xs text-gray-500">{memberEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Permissions List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {availablePermissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{permission.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
