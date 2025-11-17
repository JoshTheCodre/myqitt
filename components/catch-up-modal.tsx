'use client'

import { X } from 'lucide-react'

interface CatchUpModalProps {
  isOpen: boolean
  item: string | null
  onClose: () => void
}

export function CatchUpModal({ isOpen, item, onClose }: CatchUpModalProps) {
  if (!isOpen || !item) return null

  // Map items to content
  const contentMap: Record<string, { title: string; description: string; details: string[] }> = {
    'School Calendar': {
      title: 'School Calendar',
      description: 'View important academic dates and holidays',
      details: [
        '📅 Semester Starts: September 15, 2024',
        '📅 Midterm Exams: October 1-15, 2024',
        '📅 Semester Ends: December 20, 2024',
        '📅 Exam Period: January 5-31, 2025',
        '📅 Results Release: February 28, 2025',
      ],
    },
    'Year 1 Clearance Checklist': {
      title: 'Year 1 Clearance Checklist',
      description: 'Complete all required tasks for clearance',
      details: [
        '✓ Library Registration',
        '✓ Course Registration',
        '✓ Health Center Check-up',
        '✓ Hostel Allocation',
        '✓ ID Card Collection',
        '✓ Payments Clearance',
      ],
    },
    'Do your Course Reg Here': {
      title: 'Course Registration',
      description: 'Register your courses for the semester',
      details: [
        '📝 Registration Period: September 1-10, 2024',
        '📝 Minimum Units: 12',
        '📝 Maximum Units: 18',
        '📝 Late Registration Fee: ₦5,000',
        '📝 Registration Portal: portal.university.edu.ng',
      ],
    },
  }

  const content = contentMap[item] || {
    title: item,
    description: 'Item details',
    details: ['No additional details available'],
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto lg:hidden animate-in slide-in-from-bottom">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
          <p className="text-gray-500 mb-6">{content.description}</p>

          <div className="space-y-3">
            {content.details.map((detail, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100"
              >
                <p className="text-sm text-gray-700">{detail}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Desktop Modal */}
      <div className="hidden lg:flex fixed inset-0 bg-black/50 z-50 items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-gray-500 mb-6">{content.description}</p>
            <div className="space-y-3">
              {content.details.map((detail, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100"
                >
                  <p className="text-sm text-gray-700">{detail}</p>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
