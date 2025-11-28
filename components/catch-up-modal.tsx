'use client'

import { useState } from 'react'
import { X, MessageCircle, Lock, Zap } from 'lucide-react'

interface CatchUpModalProps {
  isOpen: boolean
  item: string | null
  onClose: () => void
}

export function CatchUpModal({ isOpen, item, onClose }: CatchUpModalProps) {
  const [regNumber, setRegNumber] = useState('')

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
      title: 'Course Registration Service',
      description: 'Get your course registration done quickly and securely',
      details: [
        '📱 Message this number with your portal details',
        '⚡ Get it done in minutes',
        '🔒 Fast and secured',
        '✅ Verified and trusted service',
      ],
    },
  }

  const content = contentMap[item] || {
    title: item,
    description: 'Item details',
    details: ['No additional details available'],
  }

  // Special rendering for Course Registration
  const isCourseReg = item === 'Do your Course Reg Here'

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

          {isCourseReg ? (
            <div className="space-y-3">
              {/* Registration Number Input Card */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 202210955032DF"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                />
              </div>

              {/* WhatsApp Button */}
              <button 
                className="w-full bg-gradient-to-br from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                disabled={!regNumber.trim()}
                onClick={() => {
                  const message = `Hi, I need help with course registration. My registration number is: ${regNumber}`
                  const encodedMessage = encodeURIComponent(message)
                  window.open(`https://wa.me/2349034954069?text=${encodedMessage}`, '_blank')
                }}
              >
                <MessageCircle className="w-5 h-5" />
                Start Registration
              </button>

              {/* Quick Info Badge */}
              <div className="flex items-center justify-center gap-3 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">Fast</span>
                </div>
                <div className="w-1 h-1 bg-green-300 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">Secure</span>
                </div>
                <div className="w-1 h-1 bg-green-300 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">Easy</span>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
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
            
            {isCourseReg ? (
              <div className="space-y-3">
                {/* Registration Number Input Card */}
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 202210955032DF"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full px-4 py-2.5 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                  />
                </div>

                {/* WhatsApp Button */}
                <button 
                  className="w-full bg-gradient-to-br from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  disabled={!regNumber.trim()}
                  onClick={() => {
                    const message = `Hi, I need help with course registration. My registration number is: ${regNumber}`
                    const encodedMessage = encodeURIComponent(message)
                    window.open(`https://wa.me/2349034954069?text=${encodedMessage}`, '_blank')
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Start Registration
                </button>

                {/* Quick Info Badge */}
                <div className="flex items-center justify-center gap-3 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">Fast</span>
                  </div>
                  <div className="w-1 h-1 bg-green-300 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">Secure</span>
                  </div>
                  <div className="w-1 h-1 bg-green-300 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">Easy</span>
                  </div>
                </div>
              </div>
            ) : (
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
            )}

            <button
              onClick={onClose}
              className="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
