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
      <div className="flex justify-center mb-8 pt-4">
        <Image src="/qitt-logo.svg" alt="Qitt logo" width={120} height={120} priority style={{ width: 'auto', height: 'auto' }} />
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'login' && <LoginForm />}
        {activeTab === 'register' && (
          <div className="space-y-6">
            {/* Course Rep Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Course Representative</h3>
                  <p className="text-sm text-gray-600">Manage your class and invite classmates</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                As a course rep, you&apos;ll have the ability to manage timetables, assignments, and important class information for your department.
              </p>
              <CourseRepRegisterForm onRegisterSuccess={handleRegisterSuccess} />
            </div>

            {/* Student Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Student</h3>
                  <p className="text-sm text-gray-600">Join using your course rep&apos;s invite link</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    Request an invite link from your course rep. It will look like:
                  </p>
                  <code className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md mt-2 block break-all font-mono">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://qitt.app'}/join/ABC123
                  </code>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    Open the link to register quickly with your name, phone number, and password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 mt-auto text-center border-t border-gray-100">
        <p className="text-xs text-gray-500">
          © 2025 Qitt Technologies. All rights reserved.
        </p>
      </div>
    </div>
  )
}
