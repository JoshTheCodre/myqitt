'use client'

import { X, Calendar, FileText, User } from 'lucide-react'

interface AssignmentDetailModalProps {
  isOpen: boolean
  assignment: {
    courseCode: string
    title: string
    description: string
    dueDate: string
    submissionType: string
    lecturer: string
  } | null
  onClose: () => void
}

export function AssignmentDetailModal({ isOpen, assignment, onClose }: AssignmentDetailModalProps) {
  if (!isOpen || !assignment) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto lg:hidden animate-in slide-in-from-bottom">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-6">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
              {assignment.courseCode}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h2>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Due Date */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-semibold uppercase">Due Date</p>
                  <p className="text-lg font-bold text-red-700">{assignment.dueDate}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Description</p>
                  <p className="text-sm text-gray-700">{assignment.description}</p>
                </div>
              </div>
            </div>

            {/* Submission Type */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase">Submission Type</p>
                  <p className="text-sm font-medium text-blue-700">{assignment.submissionType}</p>
                </div>
              </div>
            </div>

            {/* Lecturer */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-semibold uppercase">Lecturer</p>
                  <p className="text-sm font-medium text-purple-700">{assignment.lecturer}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Desktop Modal */}
      <div className="hidden lg:flex fixed inset-0 bg-black/50 z-50 items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-2">
                {assignment.courseCode}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Due Date */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-semibold uppercase">Due Date</p>
                  <p className="text-lg font-bold text-red-700">{assignment.dueDate}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Description</p>
                  <p className="text-sm text-gray-700">{assignment.description}</p>
                </div>
              </div>
            </div>

            {/* Submission Type */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase">Submission Type</p>
                  <p className="text-sm font-medium text-blue-700">{assignment.submissionType}</p>
                </div>
              </div>
            </div>

            {/* Lecturer */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-semibold uppercase">Lecturer</p>
                  <p className="text-sm font-medium text-purple-700">{assignment.lecturer}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
