'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { RegistrationForm } from './auth/registration-form'

export default function HomePage() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.push('/dashboard')
    }
  }, [user, status, router])

  // AuthGate handles loading state, but double-check
  if (status === 'idle' || status === 'loading') {
    return null // AuthGate shows spinner
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
