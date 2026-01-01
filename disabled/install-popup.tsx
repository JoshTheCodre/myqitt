'use client'

import { useState } from 'react'
import { usePWAInstall } from '@/lib/hooks/usePWAInstall'
import { Download, X } from 'lucide-react'

export function InstallPopup() {
  const { deferredPrompt, installApp, isInstalled } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if already installed, no prompt available, or user dismissed
  if (isInstalled || !deferredPrompt || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    await installApp()
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 relative overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Install Qitt App
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Get quick access and better performance. Install our app for the best experience!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
