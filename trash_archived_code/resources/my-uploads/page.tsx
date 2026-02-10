'use client'

import { useState } from 'react'
import { FileText, BookOpen, GraduationCap, Trash2, Edit2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { AppShell } from '@/utils/layout/app-shell'
import { useRouter } from 'next/navigation'

type ResourceType = 'past_questions' | 'lecture_notes' | 'study_guides'

interface UploadedResource {
  id: string
  title: string
  type: ResourceType
  course: string
  uploadDate: string
  views: number
  downloads: number
  isPublic: boolean
}

export default function MyUploadsPage() {
  const router = useRouter()
  const [uploads, setUploads] = useState<UploadedResource[]>([
    {
      id: '1',
      title: 'CSC 486.1 Final Exam 2023',
      type: 'past_questions',
      course: 'CSC 486.1',
      uploadDate: '2024-12-10',
      views: 124,
      downloads: 45,
      isPublic: true
    },
    {
      id: '2',
      title: 'Algorithms Chapter Notes',
      type: 'lecture_notes',
      course: 'CSC 486.1',
      uploadDate: '2024-12-08',
      views: 89,
      downloads: 32,
      isPublic: true
    },
    {
      id: '3',
      title: 'My Study Notes',
      type: 'study_guides',
      course: 'CSC 301.1',
      uploadDate: '2024-12-05',
      views: 12,
      downloads: 5,
      isPublic: false
    }
  ])

  const handleDelete = (id: string) => {
    setUploads(uploads.filter(u => u.id !== id))
  }

  const handleTogglePublic = (id: string) => {
    setUploads(uploads.map(u => 
      u.id === id ? { ...u, isPublic: !u.isPublic } : u
    ))
  }

  const getTypeLabel = (type: ResourceType) => {
    switch (type) {
      case 'past_questions':
        return 'Past Questions'
      case 'lecture_notes':
        return 'Lecture Notes'
      case 'study_guides':
        return 'Study Guides'
    }
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Uploads</h1>
            <p className="text-sm text-gray-600">Manage your contributed resources</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-900">{uploads.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{uploads.reduce((sum, u) => sum + u.views, 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{uploads.reduce((sum, u) => sum + u.downloads, 0)}</p>
            </div>
          </div>

          {/* Uploads List */}
          <div className="space-y-3">
            {uploads.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No uploads yet</h3>
                <p className="text-gray-600 mb-4">Start contributing materials to help others</p>
                <a href="/resources/contribute" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                  Upload Now
                </a>
              </div>
            ) : (
              uploads.map(upload => (
                <div key={upload.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{upload.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{upload.course}</span>
                        <span>{getTypeLabel(upload.type)}</span>
                        <span>{new Date(upload.uploadDate).toLocaleDateString()}</span>
                        <span>👁️ {upload.views} views</span>
                        <span>⬇️ {upload.downloads} downloads</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublic(upload.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          upload.isPublic
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={upload.isPublic ? 'Public' : 'Private'}
                      >
                        {upload.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(upload.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
