'use client'

import Image from 'next/image'
import { LoginForm } from './login-form'
import { StudentRegisterForm } from './student-register-form'
import { useState } from 'react'

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
        {activeTab === 'register' && <StudentRegisterForm onRegisterSuccess={handleRegisterSuccess} />}
      </div>

      <div className="pt-6 mt-auto text-center border-t border-gray-100">
        <p className="text-xs text-gray-500">
          © 2025 Qitt Technologies. All rights reserved.
        </p>
      </div>
    </div>
  )
}
