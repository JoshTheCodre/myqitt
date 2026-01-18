"use client"

import { useRef, useCallback, useEffect } from "react"
import html2canvas from "html2canvas"
import toast from "react-hot-toast"

interface ClassInfo {
  time: string
  title: string
  location: string
}

interface TimetableImageGeneratorProps {
  timetable: Record<string, ClassInfo[]>
  onShare: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export function TimetableImageGenerator({ timetable, triggerRef }: TimetableImageGeneratorProps) {
  const timetableRef = useRef<HTMLDivElement>(null)

  const downloadImage = useCallback((canvas: HTMLCanvasElement) => {
    const link = document.createElement('a')
    link.download = 'timetable.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Timetable downloaded!')
  }, [])

  const generateAndShare = useCallback(async () => {
    if (!timetableRef.current) {
      toast.error('Timetable not ready')
      return
    }

    try {
      toast.loading('Generating timetable image...', { id: 'share-loading' })
      
      // Show the hidden timetable temporarily
      timetableRef.current.style.display = 'block'
      timetableRef.current.style.position = 'fixed'
      timetableRef.current.style.top = '-9999px'
      timetableRef.current.style.left = '-9999px'
      timetableRef.current.style.width = '1200px'

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200))

      // Generate canvas
      const canvas = await html2canvas(timetableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1200,
      })

      // Hide it again
      timetableRef.current.style.display = 'none'
      
      toast.dismiss('share-loading')

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate image')
          return
        }

        const file = new File([blob], 'timetable.png', { type: 'image/png' })

        // Try to share on mobile
        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Timetable',
              text: 'Check out my class timetable!',
            })
            toast.success('Timetable shared!')
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              downloadImage(canvas)
            }
          }
        } else {
          // Fallback to download
          downloadImage(canvas)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error generating timetable image:', error)
      toast.dismiss('share-loading')
      toast.error('Failed to share timetable')
      
      if (timetableRef.current) {
        timetableRef.current.style.display = 'none'
      }
    }
  }, [downloadImage])

  // Attach click handler when ref is available
  useEffect(() => {
    const button = triggerRef?.current
    if (button) {
      const handleClick = (e: MouseEvent) => {
        e.preventDefault()
        generateAndShare()
      }
      button.addEventListener('click', handleClick)
      return () => {
        button.removeEventListener('click', handleClick)
      }
    }
  }, [triggerRef, generateAndShare])

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

  return (
    <div
      ref={timetableRef}
      style={{ display: 'none' }}
      className="p-8 bg-white"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Timetable</h1>
        <p className="text-gray-600">Weekly Class Schedule</p>
      </div>

      {/* Timetable Grid */}
      <div className="border-2 border-gray-300 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-500">
              <th className="px-4 py-3 text-white font-bold text-left border-r border-blue-400">Time</th>
              {days.map(day => (
                <th key={day} className="px-4 py-3 text-white font-bold text-center border-r border-blue-400 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, timeIdx) => (
              <tr key={time} className={timeIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  {time}
                </td>
                {days.map(day => {
                  const classForSlot = timetable[day]?.find(cls => 
                    cls.time.startsWith(time)
                  )
                  
                  return (
                    <td key={day} className="px-4 py-3 border-r border-gray-200 last:border-r-0">
                      {classForSlot ? (
                        <div className="bg-blue-100 rounded-lg p-2 border-l-4 border-blue-500">
                          <p className="font-bold text-sm text-blue-900">{classForSlot.title}</p>
                          <p className="text-xs text-blue-600 mt-1">{classForSlot.location}</p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-sm">-</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        Generated by MyQitt
      </div>
    </div>
  )
}
