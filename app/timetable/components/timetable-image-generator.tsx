"use client"

import { useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import html2canvas from "html2canvas"
import toast from "react-hot-toast"

interface ClassInfo {
  time: string
  title: string
  location: string
}

interface TimetableImageGeneratorProps {
  timetable: Record<string, ClassInfo[]>
}

export interface TimetableImageGeneratorHandle {
  generateAndShare: () => Promise<void>
}

export const TimetableImageGenerator = forwardRef<TimetableImageGeneratorHandle, TimetableImageGeneratorProps>(
  function TimetableImageGenerator({ timetable }, ref) {
    const timetableRef = useRef<HTMLDivElement>(null)

    const downloadImage = useCallback((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a')
      link.download = 'timetable.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Timetable downloaded!')
    }, [])

    const generateAndShare = useCallback(async () => {
      console.log('generateAndShare called, timetableRef:', timetableRef.current)
      
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

    // Expose the generateAndShare function via ref
    useImperativeHandle(ref, () => ({
      generateAndShare
    }), [generateAndShare])

    // Helper to normalize time for comparison
    const normalizeTime = (timeStr: string): string => {
      // Convert "8:00 AM" to "8am" format for comparison
      const match = timeStr.match(/^(\d{1,2})(?::00)?\s*(AM|PM)$/i)
      if (match) {
        const hour = match[1]
        const period = match[2].toLowerCase()
        return `${hour}${period}`
      }
      return timeStr.toLowerCase()
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

    return (
      <div
        ref={timetableRef}
        style={{ 
          display: 'none',
          padding: '32px',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>My Timetable</h1>
          <p style={{ color: '#6b7280' }}>Weekly Class Schedule</p>
        </div>

        {/* Timetable Grid */}
        <div style={{ border: '2px solid #d1d5db', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#2563eb' }}>
                <th style={{ padding: '12px 16px', color: '#ffffff', fontWeight: 'bold', textAlign: 'left', borderRight: '1px solid #60a5fa' }}>Time</th>
                {days.map((day, idx) => (
                  <th key={day} style={{ 
                    padding: '12px 16px', 
                    color: '#ffffff', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    borderRight: idx < days.length - 1 ? '1px solid #60a5fa' : 'none' 
                  }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIdx) => (
                <tr key={time} style={{ backgroundColor: timeIdx % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontWeight: '600', 
                    color: '#374151', 
                    borderRight: '1px solid #e5e7eb',
                    whiteSpace: 'nowrap'
                  }}>
                    {time}
                  </td>
                  {days.map((day, dayIdx) => {
                    // Match times like "9am-10am" with slots like "9:00 AM"
                    const normalizedSlot = normalizeTime(time)
                    const classForSlot = timetable[day]?.find(cls => {
                      const classStartTime = cls.time.split('-')[0].trim().toLowerCase()
                      return classStartTime === normalizedSlot || cls.time.toLowerCase().startsWith(normalizedSlot)
                    })
                    
                    return (
                      <td key={day} style={{ 
                        padding: '12px 16px', 
                        borderRight: dayIdx < days.length - 1 ? '1px solid #e5e7eb' : 'none' 
                      }}>
                        {classForSlot ? (
                          <div style={{ 
                            backgroundColor: '#dbeafe', 
                            borderRadius: '8px', 
                            padding: '8px',
                            borderLeft: '4px solid #3b82f6'
                          }}>
                            <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e3a8a', margin: 0 }}>{classForSlot.title}</p>
                            <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px', margin: 0 }}>{classForSlot.location}</p>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>-</div>
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
        <div style={{ marginTop: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          Generated by MyQitt 💙
        </div>
      </div>
    )
  }
)
