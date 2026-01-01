'use client'

import Image from 'next/image'
import { LoginForm } from './login-form'
import { CourseRepRegisterForm } from './course-rep-register-form'
import { useState } from 'react'
import { Users, Link2, UserPlus } from 'lucide-react'

export function RegistrationForm() {
  const [activeTab, setActiveTab] = useState('login')

  const handleRegisterSuccess = () => {
    setActiveTab('login')
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-center mb-6 pt-2">
        <Image src="/qitt-logo.svg" alt="Qitt logo" width={100} height={100} priority style={{ width: 'auto', height: 'auto' }} />
      </div>

      <div className="flex gap-0 mb-6 bg-gray-100 rounded-md p-1">
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-3 px-4 rounded-sm transition-colors ${
            activeTab === 'login' ? 'bg-white text-gray-600 font-semibold' : 'text-gray-600 hover:text-gray-800'
          }`}
          style={activeTab === 'login' ? { color: '#4045EF' } : {}}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-3 px-4 rounded-sm font-semibold transition-colors ${
            activeTab === 'register' ? 'bg-white' : 'text-gray-600 hover:text-gray-800'
          }`}
          style={activeTab === 'register' ? { color: '#4045EF' } : {}}
        >
          Register
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'login' && <LoginForm />}
        {activeTab === 'register' && (
          <div className="space-y-6">
            {/* Course Rep Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Are you a Course Rep?</h3>
                  <p className="text-sm text-gray-600">Register and invite your classmates</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                As a course rep, you&apos;ll manage the timetable, assignments, and class information for your department.
              </p>
              <CourseRepRegisterForm onRegisterSuccess={handleRegisterSuccess} />
            </div>

            {/* Student Section */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Are you a Student?</h3>
                  <p className="text-sm text-gray-600">Join using your course rep&apos;s link</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-200">
                <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    Ask your course rep for an invite link. It looks like:
                  </p>
                  <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 block break-all">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://qitt.app'}/join/ABC123
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    Open the link on your phone or browser to register quickly with just your name, phone, and password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 mt-auto text-center border-t border-gray-200">
        <p className="text-sm text-gray-600">
          © 2025 <span className="font-semibold text-gray-800">Qitt Technologies</span>. All rights reserved.
        </p>
      </div>
    </div>
  )
}
