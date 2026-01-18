import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface School {
  id: string
  name: string
  logo_url?: string
}

export interface Faculty {
  id: string
  school_id: string
  name: string
  code?: string
}

export interface Department {
  id: string
  faculty_id: string
  name: string
  code?: string
}

export interface Level {
  id: string
  department_id: string
  level_number: number
  name: string
}

export interface Session {
  id: string
  school_id: string
  name: string
  is_active: boolean
}

export interface Semester {
  id: string
  school_id: string
  name: string
}

export class ProfileService {
  // Get schools list
  static async getSchools(): Promise<School[]> {
    try {
      const cached = localStorage.getItem('schools_cache')
      const cacheTimestamp = localStorage.getItem('schools_cache_timestamp')
      const now = Date.now()
      const ONE_HOUR = 60 * 60 * 1000

      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        return JSON.parse(cached)
      }

      const { data, error } = await supabase
        .from('schools')
        .select('id, name, logo_url')
        .order('name')

      if (error) throw error

      localStorage.setItem('schools_cache', JSON.stringify(data))
      localStorage.setItem('schools_cache_timestamp', now.toString())

      return data || []
    } catch (error: any) {
      toast.error('Failed to load schools')
      throw error
    }
  }

  // Get faculties for a school
  static async getFaculties(schoolId: string): Promise<Faculty[]> {
    try {
      const cacheKey = `faculties_${schoolId}_cache`
      const timestampKey = `faculties_${schoolId}_timestamp`
      const cached = localStorage.getItem(cacheKey)
      const cacheTimestamp = localStorage.getItem(timestampKey)
      const now = Date.now()
      const ONE_HOUR = 60 * 60 * 1000

      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        return JSON.parse(cached)
      }

      const { data, error } = await supabase
        .from('faculties')
        .select('id, school_id, name, code')
        .eq('school_id', schoolId)
        .order('name')

      if (error) throw error

      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(timestampKey, now.toString())

      return data || []
    } catch (error: any) {
      toast.error('Failed to load faculties')
      throw error
    }
  }

  // Get departments for a faculty
  static async getDepartments(facultyId: string): Promise<Department[]> {
    try {
      const cacheKey = `departments_${facultyId}_cache`
      const timestampKey = `departments_${facultyId}_timestamp`
      const cached = localStorage.getItem(cacheKey)
      const cacheTimestamp = localStorage.getItem(timestampKey)
      const now = Date.now()
      const ONE_HOUR = 60 * 60 * 1000

      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        return JSON.parse(cached)
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, faculty_id, name, code')
        .eq('faculty_id', facultyId)
        .order('name')

      if (error) throw error

      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(timestampKey, now.toString())

      return data || []
    } catch (error: any) {
      toast.error('Failed to load departments')
      throw error
    }
  }

  // Get departments directly by school_id (via faculty)
  static async getDepartmentsBySchool(schoolId: string): Promise<Department[]> {
    try {
      const cacheKey = `departments_school_${schoolId}_cache`
      const timestampKey = `departments_school_${schoolId}_timestamp`
      const cached = localStorage.getItem(cacheKey)
      const cacheTimestamp = localStorage.getItem(timestampKey)
      const now = Date.now()
      const ONE_HOUR = 60 * 60 * 1000

      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        return JSON.parse(cached)
      }

      const { data, error } = await supabase
        .from('departments')
        .select(`
          id, 
          faculty_id, 
          name, 
          code,
          faculty:faculties!departments_faculty_id_fkey(school_id)
        `)
        .order('name')

      if (error) throw error

      // Filter by school_id
      const filtered = (data || []).filter(
        dept => (dept.faculty as any)?.school_id === schoolId
      )

      localStorage.setItem(cacheKey, JSON.stringify(filtered))
      localStorage.setItem(timestampKey, now.toString())

      return filtered
    } catch (error: any) {
      toast.error('Failed to load departments')
      throw error
    }
  }

  // Get levels for a department
  static async getLevels(departmentId: string): Promise<Level[]> {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('id, department_id, level_number, name')
        .eq('department_id', departmentId)
        .order('level_number')

      if (error) throw error
      return data || []
    } catch (error: any) {
      toast.error('Failed to load levels')
      throw error
    }
  }

  // Get sessions for a school
  static async getSessions(schoolId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, school_id, name, is_active')
        .eq('school_id', schoolId)
        .order('name', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      toast.error('Failed to load sessions')
      throw error
    }
  }

  // Get semesters for a school
  static async getSemesters(schoolId: string): Promise<Semester[]> {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('id, school_id, name')
        .eq('school_id', schoolId)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error: any) {
      toast.error('Failed to load semesters')
      throw error
    }
  }

  // Get course rep for user's class group (using level_reps table)
  static async getCourseRepForDepartment(userId: string): Promise<{
    id: string
    name: string
    email?: string
    phone_number?: string
  } | null> {
    try {
      // Get user's class_group_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('class_group_id')
        .eq('id', userId)
        .single()

      if (userError || !userData?.class_group_id) return null

      // Get active level rep for this class group
      const { data: levelRep, error } = await supabase
        .from('level_reps')
        .select(`
          user:users!level_reps_user_id_fkey(
            id,
            name,
            email,
            phone_number
          )
        `)
        .eq('class_group_id', userData.class_group_id)
        .eq('is_active', true)
        .single()

      if (error || !levelRep?.user) return null

      const user = levelRep.user as any
      return {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        phone_number: user.phone_number
      }
    } catch {
      return null
    }
  }

  // Get invite code for course rep
  static async getInviteCode(userId: string): Promise<string | null> {
    try {
      // First get level_rep entry for this user
      const { data: levelRep, error: levelRepError } = await supabase
        .from('level_reps')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (levelRepError || !levelRep) return null

      // Get invite code from level_invites
      const { data: invite, error } = await supabase
        .from('level_invites')
        .select('invite_code')
        .eq('level_rep_id', levelRep.id)
        .eq('is_active', true)
        .single()

      if (error || !invite) return null
      return invite.invite_code
    } catch {
      return null
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string, 
    updates: {
      name?: string
      phone_number?: string
      bio?: string
      avatar_url?: string
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }

  // Upload profile avatar
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: publicUrl })

      return publicUrl
    } catch (error: any) {
      toast.error('Failed to upload avatar')
      throw error
    }
  }

  // Format department name for display
  static formatDepartmentName(name: string): string {
    if (!name) return ''
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Get school name by ID
  static async getSchoolName(schoolId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('name')
        .eq('id', schoolId)
        .single()

      if (error || !data) return 'Unknown School'
      return data.name
    } catch {
      return 'Unknown School'
    }
  }
}
