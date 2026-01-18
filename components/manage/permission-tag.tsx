interface PermissionTagProps {
  permission: string
}

export function PermissionTag({ permission }: PermissionTagProps) {
  const permissionLabels: Record<string, string> = {
    "view-manage-space": "view-manage-space",
    "post-note": "post-note",
    "can-post": "can-post",
    "post-resources": "post-resources",
    "post-assignment": "post-assignment",
    "post-timetable": "post-timetable",
    full: "full",
    "view-reports": "view-reports",
    "manage-team": "manage-team",
    "post-updates": "post-updates",
  }

  const label = permissionLabels[permission] || permission

  return (
    <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-blue-200 text-blue-600">
      {label}
    </div>
  )
}
