'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { ArrowLeft, Calendar, FileText, User, Download, Upload } from 'lucide-react'
import { Suspense } from 'react'

function AssignmentDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const courseCode = searchParams.get('courseCode') || ''
  const title = searchParams.get('title') || ''
  const description = searchParams.get('description') || ''
  const dueDate = searchParams.get('dueDate') || ''
  const submissionType = searchParams.get('submissionType') || ''
  const lecturer = searchParams.get('lecturer') || ''

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full max-w-3xl px-4 py-8 pb-24 lg:pb-8 overflow-x-hidden">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Assignments</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
              {courseCode}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          </div>

          {/* Details Cards */}
          <div className="space-y-4">
            {/* Due Date Card */}
            <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Due Date</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{dueDate}</p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-3">Description</p>
                  <p className="text-gray-700 leading-relaxed">{description}</p>
                </div>
              </div>
            </div>

            {/* Submission Type Card */}
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Submission Type</p>
                  <p className="text-lg font-semibold text-blue-700 mt-1">{submissionType}</p>
                </div>
              </div>
            </div>

            {/* Lecturer Card */}
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Lecturer</p>
                  <p className="text-lg font-semibold text-purple-700 mt-1">{lecturer}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md">
              <Upload className="w-5 h-5" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function AssignmentDetailPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading assignment...</p>
          </div>
        </div>
      </AppShell>
    }>
      <AssignmentDetailContent />
    </Suspense>
  )
}
