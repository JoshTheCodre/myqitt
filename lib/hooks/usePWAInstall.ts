'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallHook {
  deferredPrompt: BeforeInstallPromptEvent | null
  installApp: () => Promise<void>
  isInstalled: boolean
}

export function usePWAInstall(): PWAInstallHook {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkInstallStatus = () => {
      // Check localStorage flag
      const installedFlag = localStorage.getItem('pwa-installed')
      if (installedFlag === 'true') {
        setIsInstalled(true)
        return true
      }

      // Check if running in standalone mode (Android/Chrome)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        localStorage.setItem('pwa-installed', 'true')
        return true
      }

      // Check if running as PWA on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        localStorage.setItem('pwa-installed', 'true')
        return true
      }

      return false
    }

    const isAlreadyInstalled = checkInstallStatus()

    if (!isAlreadyInstalled) {
      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      // Listen for app installed event
      const handleAppInstalled = () => {
        setIsInstalled(true)
        setDeferredPrompt(null)
        localStorage.setItem('pwa-installed', 'true')
      }

      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available')
      return
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setIsInstalled(true)
        localStorage.setItem('pwa-installed', 'true')
      } else {
        console.log('User dismissed the install prompt')
      }

      // Clear the deferred prompt
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error during app installation:', error)
    }
  }

  return {
    deferredPrompt,
    installApp,
    isInstalled,
  }
}
