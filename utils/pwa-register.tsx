'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    
    // Delay registration to not block initial page load
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
      } catch (error) {
        // Silently fail - PWA features just won't work
        console.log('Service Worker not available')
      }
    }
    
    // Register after page load
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])

  return null
}
