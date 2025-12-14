'use client'

import { useState, useEffect } from 'react'
import { FileText, BookOpen, GraduationCap, Search, MoreVertical, ChevronRight, Upload, FolderOpen, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

type ResourceType = 'past_questions' | 'lecture_notes' | 'study_guides'

interface Resource {
  id: string
  title: string
  type: ResourceType
  course: string
  uploadedBy: string
  uploadDate: string
  downloadCount: number
  fileSize: string
}

interface Course {
  id: string
  code: string
  title: string
}

export default function ResourcesPage() {
  const { user } = useAuthStore()
  const [selectedCourse, setSelectedCourse] = useState<string>('for-you')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  // Mock data - replace with actual Supabase query
  const resources: Resource[] = [
    {
      id: '1',
      title: '2023 Final Exam Questions',
      type: 'past_questions',
      course: 'CSC 486.1',
      uploadedBy: 'John Doe',
      uploadDate: '2024-12-10',
      downloadCount: 45,
      fileSize: '2.3 MB'
    },
    {
      id: '2',
      title: '2022 Mid-Semester Questions',
      type: 'past_questions',
      course: 'CSC 486.1',
      uploadedBy: 'Jane Smith',
      uploadDate: '2024-12-08',
      downloadCount: 32,
      fileSize: '1.8 MB'
    },
    {
      id: '3',
      title: 'Data Structures Chapter 1-5',
      type: 'lecture_notes',
      course: 'CSC 301.1',
      uploadedBy: 'Mike Wilson',
      uploadDate: '2024-12-05',
      downloadCount: 78,
      fileSize: '5.1 MB'
    },
    {
      id: '4',
      title: 'Sorting Algorithms Notes',
      type: 'lecture_notes',
      course: 'CSC 486.1',
      uploadedBy: 'Sarah Lee',
      uploadDate: '2024-12-03',
      downloadCount: 56,
      fileSize: '3.2 MB'
    },
    {
      id: '5',
      title: 'Algorithm Analysis Guide',
      type: 'study_guides',
      course: 'CSC 486.1',
      uploadedBy: 'Tom Brown',
      uploadDate: '2024-12-01',
      downloadCount: 41,
      fileSize: '2.7 MB'
    },
    {
      id: '6',
      title: 'Exam Preparation Guide',
      type: 'study_guides',
      course: 'CSC 301.1',
      uploadedBy: 'Lisa Wang',
      uploadDate: '2024-11-28',
      downloadCount: 67,
      fileSize: '4.1 MB'
    }
  ]

  useEffect(() => {
    loadCourses()
  }, [user])

  const loadCourses = async () => {
    try {
      // Mock courses - replace with actual query from user's timetable
      const mockCourses: Course[] = [
        { id: '1', code: 'CSC 486.1', title: 'Algorithm Design' },
        { id: '2', code: 'CSC 301.1', title: 'Data Structures' },
        { id: '3', code: 'MTH 201.1', title: 'Calculus II' },
        { id: '4', code: 'CSC 205.1', title: 'Computer Architecture' }
      ]
      setCourses(mockCourses)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load courses:', error)
      setLoading(false)
    }
  }

  const getResourcesByType = (type: ResourceType, courseCode?: string) => {
    return resources.filter(r => {
      const matchesType = r.type === type
      
      // For "For You" tab, show saved/recommended resources
      if (courseCode === 'for-you') {
        return matchesType
      }
      
      const matchesCourse = !courseCode || r.course === courseCode
      return matchesType && matchesCourse
    })
  }

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <div className="flex-shrink-0 w-56 bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-lg hover:border-blue-200 transition-all">
      <h4 className="font-semibold text-gray-900 mb-1.5 text-sm line-clamp-2 leading-tight">{resource.title}</h4>
      <p className="text-xs text-gray-500 mb-3">{resource.course}</p>
      
      <div className="text-xs text-gray-500 mb-3">
        <div className="flex items-center justify-between">
          <span>By {resource.uploadedBy}</span>
          <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
        </div>
      </div>

      <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs shadow-sm">
        View
      </button>
    </div>
  )

  const ResourceSection = ({ 
    title, 
    type
  }: { 
    title: string
    type: ResourceType
  }) => {
    const sectionResources = getResourcesByType(type, selectedCourse)
    
    if (sectionResources.length === 0) return null

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {sectionResources.length}
            </span>
          </div>
          <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {sectionResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
              <p className="text-sm text-gray-600">Access study materials for your courses</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Popover Menu */}
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">Contribute</span>
                      </button>
                      <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">My Uploads</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Course Tabs */}
          <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedCourse('for-you')}
                className={`px-4 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 ${
                  selectedCourse === 'for-you'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                For You
              </button>
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.code)}
                  className={`px-4 py-1.5 rounded-full font-medium whitespace-nowrap transition-all text-xs ${
                    selectedCourse === course.code
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {course.code}
                </button>
              ))}
            </div>
          </div>

          {/* For You Banner - Only show when "For You" is selected */}
          {selectedCourse === 'for-you' && (
            <div className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold">Your Saved Resources</h2>
                    <div className="flex items-center justify-center w-7 h-7 bg-white/30 backdrop-blur-sm rounded-full">
                      <span className="text-sm font-bold">5</span>
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm">
                    Click contribute to add materials and help us all escape this place 😂🤣 No cap, we're in this together fr fr
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resource Sections */}
          <div className="space-y-6">
            <ResourceSection
              title="Past Questions"
              type="past_questions"
            />
            
            <ResourceSection
              title="Lecture Notes"
              type="lecture_notes"
            />
            
            <ResourceSection
              title="Study Guides"
              type="study_guides"
            />
          </div>

          {/* Empty State */}
          {getResourcesByType('past_questions', selectedCourse).length === 0 &&
           getResourcesByType('lecture_notes', selectedCourse).length === 0 &&
           getResourcesByType('study_guides', selectedCourse).length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources available</h3>
              <p className="text-gray-600">
                {selectedCourse === 'for-you' 
                  ? 'Start saving resources to see them here!' 
                  : `No resources available for ${selectedCourse}`}
              </p>
            </div>
          )}
        </div>

        {/* Add custom scrollbar hiding */}
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
      <BottomNav />
    </>
  )
}
