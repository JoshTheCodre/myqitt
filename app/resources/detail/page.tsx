'use client'

import { useSearchParams } from 'next/navigation'
import { ArrowLeft, FileText, User, Calendar, Download, Share2, Bookmark } from 'lucide-react'
import { AppShell } from '@/utils/layout/app-shell'
import { pastQuestions } from '@/utils/mock-data/resources'

export default function ResourceDetailPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const resource = pastQuestions.find(q => q.id === id)

  if (!resource) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Resource not found</h2>
            <a href="/resources" className="text-sm text-blue-600 hover:text-blue-700">
              Back to resources
            </a>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-y-auto h-full">
          
          {/* Back Button */}
          <a 
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </a>

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium">
                    {resource.course}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {resource.uploadedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(resource.uploadDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download ({resource.fileSize})
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{resource.downloadCount}</div>
              <div className="text-xs text-gray-500">Downloads</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{resource.fileSize}</div>
              <div className="text-xs text-gray-500">File Size</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">PDF</div>
              <div className="text-xs text-gray-500">Format</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              This resource contains comprehensive exam questions for {resource.course}. 
              It includes questions from previous semesters that can help you prepare effectively 
              for upcoming exams. The material covers all major topics and provides good practice 
              for understanding the exam format and question types.
            </p>
          </div>

          {/* About Uploader */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About the Uploader</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{resource.uploadedBy}</div>
                <div className="text-sm text-gray-500">Course Representative</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
