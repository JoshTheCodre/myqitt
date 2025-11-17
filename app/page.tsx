'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { RegistrationForm } from './auth/registration-form'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { user, initAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (mounted && user) {
      router.push('/dashboard')
    }
  }, [user, mounted, router])

  if (!mounted) {
    return null
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
