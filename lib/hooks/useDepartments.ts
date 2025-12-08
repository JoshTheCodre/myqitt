import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface Department {
  id: string
  department: string
  description: string | null
  school: string
}

/**
 * Hook to fetch departments from the database
 * @param schoolId - Optional school ID to filter departments by school
 */
export function useDepartments(schoolId?: string | null) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDepartments() {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('courses')
          .select('id, department, description, school')
          .order('department', { ascending: true })

        // Filter by school if provided
        if (schoolId) {
          query = query.eq('school', schoolId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          console.error('Error fetching departments:', fetchError)
          throw fetchError
        }

        setDepartments(data || [])
      } catch (err) {
        console.error('Failed to fetch departments:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch departments')
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [schoolId])

  return { departments, loading, error }
}

/**
 * Format department name for display
 * Converts snake_case to Title Case
 * Example: "computer_science" -> "Computer Science"
 */
export function formatDepartmentName(department: string): string {
  if (!department) return ''
  
  return department
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert display name to snake_case for database
 * Example: "Computer Science" -> "computer_science"
 */
export function toDepartmentValue(displayName: string): string {
  if (!displayName) return ''
  
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
