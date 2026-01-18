"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Classmate } from "@/lib/services"
import { TabNavigation } from "./tab-navigation"
import { OverviewTab } from "./overview-tab"
import { DetailedTab } from "./detailed-tab"

interface ManagementScreenProps {
  classmates: Classmate[]
  currentUserId: string
  inviteCode: string | null
  departmentName: string
}

export function ManagementScreen({ classmates, currentUserId, inviteCode, departmentName }: ManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">("overview")
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-secondary rounded-lg transition-colors" 
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manage Class</h1>
              <p className="text-sm text-muted-foreground">{departmentName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <OverviewTab 
            classmates={classmates} 
            currentUserId={currentUserId}
            inviteCode={inviteCode}
          />
        )}
        {activeTab === "detailed" && (
          <DetailedTab 
            classmates={classmates}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  )
}
