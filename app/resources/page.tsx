'use client'

import { useState } from 'react'
import { FolderSearch, ChevronDown, User, Calendar, Download, FileText } from 'lucide-react'
import { AppShell } from '@/utils/layout/app-shell'
import { courses, pastQuestions, type PastQuestion } from '@/utils/mock-data/resources'


function QuestionCard({ question }: { question: PastQuestion }) {
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
      onClick={() => window.location.href = `/resources/detail?id=${question.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">{question.title}</h3>

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full font-medium">{question.course}</span>
            <span>{question.fileSize}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {question.uploadedBy}
            </span>

            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(question.uploadDate).toLocaleDateString()}
            </span>

            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {question.downloadCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'past_questions' | 'lecture_notes' | 'study_guides'>('past_questions')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filtered = selectedCourse === 'all'
    ? pastQuestions
    : pastQuestions.filter(q => q.course === selectedCourse)

  const dropdownLabel = selectedCourse === 'all'
    ? 'All Courses'
    : courses.find(c => c.code === selectedCourse)?.code || selectedCourse

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center overflow-hidden">
        <div className="w-full lg:w-3/4 px-4 py-8 pb-24 lg:pb-8 overflow-y-auto h-full">

          {/* Header with Dropdown */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            
            {/* Course Filter Dropdown - Small and Cute */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-full text-xs font-medium text-yellow-700 hover:from-yellow-100 hover:to-amber-100 hover:border-yellow-400 transition-all shadow-sm"
              >
                <span>{dropdownLabel}</span>
                <ChevronDown className={`w-3 h-3 text-yellow-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => { setSelectedCourse('all'); setDropdownOpen(false) }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-yellow-50 transition-colors ${
                        selectedCourse === 'all' ? 'text-yellow-700 font-semibold bg-yellow-50' : 'text-gray-700'
                      }`}
                    >
                      All Courses
                    </button>

                    {courses.map(c => (
                      <button
                        key={c.code}
                        onClick={() => { setSelectedCourse(c.code); setDropdownOpen(false) }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-yellow-50 transition-colors ${
                          selectedCourse === c.code ? 'text-yellow-700 font-semibold bg-yellow-50' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{c.code}</div>
                        <div className="text-gray-500">{c.title}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('past_questions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'past_questions'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
              }`}
            >
              Past Questions
            </button>
            {/* Future tabs - hidden for now */}
            {/* 
            <button
              onClick={() => setActiveTab('lecture_notes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'lecture_notes'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
              }`}
            >
              Lecture Notes
            </button>
            <button
              onClick={() => setActiveTab('study_guides')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'study_guides'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
              }`}
            >
              Study Guides
            </button>
            */}
          </div>


          {/* Results Count */}
          <p className="text-xs text-gray-500 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>


          {/* Question List */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FolderSearch className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No past questions yet</h3>
              <p className="text-sm text-gray-500">
                {selectedCourse === 'all'
                  ? 'No past questions have been uploaded yet'
                  : `No past questions for ${selectedCourse}`}
              </p>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
