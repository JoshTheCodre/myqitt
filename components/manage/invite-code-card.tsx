"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import toast from "react-hot-toast"

interface InviteCodeCardProps {
  inviteCode: string
}

export function InviteCodeCard({ inviteCode }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      toast.success('Invite code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-600 font-medium">Class Invite Code</p>
          <p className="text-xl font-bold text-blue-800 mt-1">{inviteCode}</p>
          <p className="text-xs text-blue-500 mt-1">Share this code with classmates to join</p>
        </div>
        <button
          onClick={handleCopy}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}
