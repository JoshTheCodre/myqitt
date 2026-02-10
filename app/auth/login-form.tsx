'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/app/auth/store/authStore'

export function LoginForm() {
  const { login, loading } = useAuthStore()
  const [data, setData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!data.email.trim()) return toast.error('Email is required')
    if (!data.password.trim()) return toast.error('Password is required')

    try {
      await login(data.email, data.password)
      setData({ email: '', password: '' })
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
    } catch (error) {
      // Error handled in store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 px-1">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={data.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          value={data.password}
          onChange={handleChange}
          autoComplete="current-password"
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        <label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
          Keep me signed in
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        style={{ backgroundColor: '#4045EF' }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
