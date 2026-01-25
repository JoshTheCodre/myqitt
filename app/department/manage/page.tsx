"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/authStore"
import { ClassmateService, type Classmate } from "@/lib/services"
import toast from "react-hot-toast"
import { ManagementScreen } from "@/components/manage/management-screen"

// ============================================
// Main Page Export
// ============================================
export default function ManagePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const status = useAuthStore((s) => s.status)
  const isCourseRep = useAuthStore((s) => s.isCourseRep)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [departmentName, setDepartmentName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to initialize
    if (status !== 'authenticated') return

    // Redirect if not logged in
    if (!user) {
      router.replace('/auth')
      return
    }

    // Redirect if not a course rep
    if (!isCourseRep()) {
      toast.error('Only course representatives can access this page')
      router.replace('/dashboard')
      return
    }

    // Load data
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Get classmates
        if (user?.id) {
          const data = await ClassmateService.getClassmates(user.id)
          setClassmates(data)
        }

        // Get department name from profile
        if (profile?.class_group?.department?.name) {
          const levelNum = profile.class_group?.level?.level_number || ''
          setDepartmentName(`${profile.class_group.department.name} ${levelNum}00L`)
        }
      } catch (error) {
        console.error('Error loading manage data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [status, user, profile, isCourseRep, router])

  // Show loading while initializing
  if (status !== 'authenticated' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not logged in or not course rep (will redirect)
  if (!user || !isCourseRep()) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <ManagementScreen 
        classmates={classmates}
        currentUserId={user.id}
        departmentName={departmentName}
      />
    </main>
  )
}
