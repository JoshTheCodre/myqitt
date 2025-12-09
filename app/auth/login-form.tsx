'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
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

    setLoading(true)
    try {
      await login(data.email, data.password)
      setData({ email: '', password: '' })
      if (rememberMe) localStorage.setItem('rememberMe', 'true')
      // Redirect is handled by the login action
    } catch (error) {
      // Error already handled by store
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">Email</label>
        <input
          type="email"
          name="email"
          placeholder="john@example.com"
          value={data.email}
          onChange={handleChange}
          autoComplete="off"
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-800 mb-2">Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password123"
          value={data.password}
          onChange={handleChange}
          autoComplete="off"
          disabled={loading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 rounded border border-gray-300 cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#4045EF' }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
