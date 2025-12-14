'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit3, Info } from 'lucide-react'

interface ClassMenuProps {
  onUpdate: () => void
  hasUpdate?: boolean
}

export function ClassMenu({ onUpdate, hasUpdate }: ClassMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors relative"
        aria-label="Class options"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
        {hasUpdate && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-10 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onUpdate()
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 text-gray-700 hover:text-blue-600"
            >
              <Edit3 className="w-4 h-4" />
              <div>
                <div className="font-medium text-sm">
                  {hasUpdate ? 'Edit Update' : 'Update Class'}
                </div>
                <div className="text-xs text-gray-500">For today only</div>
              </div>
            </button>

            {hasUpdate && (
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="flex items-start gap-2 text-xs text-blue-600">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>This class has been updated for today</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
