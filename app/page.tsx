'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { RegistrationForm } from './auth/registration-form'

export default function HomePage() {
  const { user, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (initialized && user) {
      router.push('/dashboard')
    }
  }, [user, initialized, router])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center" style={{ backgroundImage: "url('/auth-banner.jpg')" }} />
      <div className="w-full lg:w-1/2 px-6 py-8 overflow-y-auto bg-white">
        <div className="max-w-md mx-auto">
          <RegistrationForm />
        </div>
      </div>
    </div>
  )
}
