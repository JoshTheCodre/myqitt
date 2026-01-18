import { PermissionTag } from "./permission-tag"

interface MemberCardProps {
  name: string
  email: string
  role: string
  status: "approved" | "pending"
  badge?: string
  type: "overview" | "detailed"
  permissions?: string[]
  onRevoke?: () => void
  showAdminBadge?: boolean
}

export function MemberCard({ name, email, role, status, badge, type, permissions, onRevoke, showAdminBadge }: MemberCardProps) {
  if (type === "overview") {
    return (
      <div className="flex items-center justify-between border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium">{name}</h4>
            {badge && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-semibold">{badge}</span>}
          </div>
          <p className="text-sm text-gray-600 mt-1">{email}</p>
          <div className="flex gap-2 mt-2">
            <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold border-transparent shadow ${
              role === 'Course Rep' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}>
              {role}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-blue-800">{name}</h3>
            {showAdminBadge && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded font-semibold">
                Admin
              </span>
            )}
            {badge && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-semibold">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{email}</p>
          {permissions && permissions.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {permissions.map((permission, pIndex) => (
                <PermissionTag key={pIndex} permission={permission} />
              ))}
            </div>
          )}
        </div>
        {onRevoke && (
          <button
            onClick={onRevoke}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            aria-label="Edit permissions"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
