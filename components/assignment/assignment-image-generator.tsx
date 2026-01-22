"use client"

import { useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import html2canvas from "html2canvas"
import toast from "react-hot-toast"

interface AssignmentImageGeneratorProps {
  courseCode: string
  title: string
  description: string
  dueDate: string
  submitted: boolean
}

export interface AssignmentImageGeneratorHandle {
  generateAndShare: () => Promise<void>
}

export const AssignmentImageGenerator = forwardRef<AssignmentImageGeneratorHandle, AssignmentImageGeneratorProps>(
  function AssignmentImageGenerator({ courseCode, title, description, dueDate, submitted }, ref) {
    const assignmentRef = useRef<HTMLDivElement>(null)

    const downloadImage = useCallback((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a')
      link.download = `assignment-${courseCode}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Assignment downloaded!')
    }, [courseCode])

    const generateAndShare = useCallback(async () => {
      console.log('generateAndShare called, assignmentRef:', assignmentRef.current)
      
      if (!assignmentRef.current) {
        toast.error('Assignment not ready')
        return
      }

      try {
        toast.loading('Generating assignment image...', { id: 'share-loading' })
        
        // Show the hidden assignment temporarily
        assignmentRef.current.style.display = 'block'
        assignmentRef.current.style.position = 'fixed'
        assignmentRef.current.style.top = '-9999px'
        assignmentRef.current.style.left = '-9999px'
        assignmentRef.current.style.width = '800px'

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 200))

        // Generate canvas
        const canvas = await html2canvas(assignmentRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 800,
        })

        // Hide it again
        assignmentRef.current.style.display = 'none'
        
        toast.dismiss('share-loading')

        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            toast.error('Failed to generate image')
            return
          }

          const file = new File([blob], `assignment-${courseCode}.png`, { type: 'image/png' })

          // Try to share on mobile
          if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `Assignment: ${title}`,
                text: `${courseCode} - ${title}`,
              })
              toast.success('Assignment shared!')
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
        console.error('Error generating assignment image:', error)
        toast.dismiss('share-loading')
        toast.error('Failed to share assignment')
        
        if (assignmentRef.current) {
          assignmentRef.current.style.display = 'none'
        }
      }
    }, [courseCode, title, downloadImage])

    // Expose the generateAndShare function via ref
    useImperativeHandle(ref, () => ({
      generateAndShare
    }), [generateAndShare])

    return (
      <div
        ref={assignmentRef}
        style={{ 
          display: 'none',
          padding: '48px',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          width: '800px'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            {courseCode}
          </div>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#111827',
            marginBottom: '8px',
            lineHeight: '1.2'
          }}>
            {title}
          </h1>
        </div>

        {/* Status Badge */}
        {submitted && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#d1fae5',
            border: '2px solid #6ee7b7',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <span style={{ 
              fontSize: '20px',
              color: '#059669',
              fontWeight: 'bold'
            }}>
              ✓ Submitted
            </span>
          </div>
        )}

        {/* Due Date Card */}
        <div style={{ 
          padding: '20px',
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#fee2e2',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📅
            </div>
            <div>
              <p style={{ 
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                Due Date
              </p>
              <p style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#b91c1c'
              }}>
                {dueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div style={{ 
          padding: '24px',
          backgroundColor: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#e5e7eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              📝
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                Description
              </p>
              <p style={{ 
                fontSize: '16px',
                color: '#374151',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '2px solid #e5e7eb',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Generated with 💙 from MyQitt
        </div>
      </div>
    )
  }
)
