'use client'

import React from 'react'
import { X, Clock, Users, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { CatchUpService, type CatchUpItem } from '@/lib/services/catchUpService'
import { useRouter } from 'next/navigation'

interface CatchUpModalProps {
  isOpen: boolean
  item: CatchUpItem | null
  onClose: () => void
}

export function CatchUpModal({ isOpen, item, onClose }: CatchUpModalProps) {
  const router = useRouter()

  if (!isOpen || !item) return null

  const handleCTAClick = () => {
    if (!item.cta) return

    // Mark as viewed when CTA is clicked
    CatchUpService.markAsViewed(item.id)

    // Handle navigation
    if (item.cta.url.startsWith('http')) {
      window.open(item.cta.url, '_blank')
    } else {
      router.push(item.cta.url)
      onClose()
    }
  }

  const handleClose = () => {
    CatchUpService.markAsViewed(item.id)
    onClose()
  }

  const expiryText = CatchUpService.formatExpiryDate(item.expires_at)
  const targetText = CatchUpService.formatTargetInfo(item)

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto lg:hidden animate-in slide-in-from-bottom">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-sm"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Image (if present) */}
        {item.image_url && (
          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-8 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 pr-8">{item.title}</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{item.summary}</p>

          {/* Markdown Content */}
          {item.content_md && (
            <div className="prose prose-sm max-w-none mb-6">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-600 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-2 mb-4 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-600 leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                  hr: () => <hr className="my-6 border-gray-200" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                }}
              >
                {item.content_md}
              </ReactMarkdown>
            </div>
          )}

          {/* CTA Button */}
          {item.cta && (
            <button
              onClick={handleCTAClick}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md mb-4"
            >
              {item.cta.label}
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{targetText}</span>
            </div>
            {expiryText && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{expiryText}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Modal */}
      <div className="hidden lg:flex fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" onClick={handleClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Image (if present) */}
          {item.image_url && (
            <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden flex-shrink-0">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
              <p className="text-gray-600 leading-relaxed">{item.summary}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Markdown Content */}
            {item.content_md && (
              <div className="prose prose-sm max-w-none mb-6">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-600 mb-3 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-2 mb-4 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-2 mb-4 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-600 leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                    hr: () => <hr className="my-6 border-gray-200" />,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {item.content_md}
                </ReactMarkdown>
              </div>
            )}

            {/* CTA Button */}
            {item.cta && (
              <button
                onClick={handleCTAClick}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {item.cta.label}
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{targetText}</span>
            </div>
            {expiryText && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{expiryText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
