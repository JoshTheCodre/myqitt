'use client'

import { useState, useEffect } from 'react'
import type { Course, CourseFilters, GroupedCourses } from '@/lib/types/course'
import { CourseService } from '@/lib/services/courseService'

export function useCourses(filters?: CourseFilters) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true)
        setError(null)
        const data = await CourseService.getCourses(filters)
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [filters?.school, filters?.department, filters?.level, filters?.semester])

  return { courses, loading, error }
}

export function useGroupedCourses(filters?: CourseFilters) {
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourses>({
    compulsory: [],
    elective: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true)
        setError(null)
        const data = await CourseService.getGroupedCourses(filters)
        setGroupedCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [filters?.school, filters?.department, filters?.level, filters?.semester])

  return { groupedCourses, loading, error }
}

export function useUserCourses(userId?: string) {
  const [groupedCourses, setGroupedCourses] = useState<GroupedCourses | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserCourses() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await CourseService.getCoursesForUser(userId)
        setGroupedCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user courses')
      } finally {
        setLoading(false)
      }
    }

    fetchUserCourses()
  }, [userId])

  return { groupedCourses, loading, error }
}

export function useCourseSearch(searchTerm: string, filters?: CourseFilters) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function searchCourses() {
      if (!searchTerm.trim()) {
        setCourses([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await CourseService.searchCourses(searchTerm, filters)
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search courses')
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchCourses, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, filters?.school, filters?.department, filters?.level, filters?.semester])

  return { courses, loading, error }
}
