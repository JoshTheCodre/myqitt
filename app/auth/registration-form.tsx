'use client'

import Image from 'next/image'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { useState } from 'react'

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
        {activeTab === 'register' && <RegisterForm onRegisterSuccess={handleRegisterSuccess} />}
      </div>

      <div className="pt-8 mt-auto text-center border-t border-gray-200">
        <p className="text-sm text-gray-600">
          © 2025 <span className="font-semibold text-gray-800">Qitt Technologies</span>. All rights reserved.
        </p>
      </div>
    </div>
  )
}
