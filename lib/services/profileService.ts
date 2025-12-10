import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface School {
  id: string
  name: string
}

export interface Department {
  id: string
  department: string
  school_id: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  phone_number?: string
  school?: string
  department?: string
  level?: number
  semester?: string
  bio?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export class ProfileService {
  // Get schools list
  static async getSchools(): Promise<School[]> {
    try {
      // Check cache first
      const cached = localStorage.getItem('schools_cache')
      const cacheTimestamp = localStorage.getItem('schools_cache_timestamp')
      const now = Date.now()
      const ONE_HOUR = 60 * 60 * 1000

      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        return JSON.parse(cached)
      }

      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name')

      if (error) throw error

      // Cache the results
      localStorage.setItem('schools_cache', JSON.stringify(data))
      localStorage.setItem('schools_cache_timestamp', now.toString())

      return data || []
    } catch (error: any) {
      toast.error('Failed to load schools')
      throw error
    }
  }

  // Get departments for a school
  static async getDepartments(schoolId: string): Promise<Department[]> {
    try {
      // Check cache first
      const cacheKey = `departments_${schoolId}_cache`
      const timestampKey = `departments_${schoolId}_timestamp`
      const cached = localStorage.getItem(cacheKey)
      const cacheTimestamp = localStorage.getItem(timestampKey)
      const now = Date.now()
      const ONE_HOUR = 60 * 60 * 1000

      if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
        return JSON.parse(cached)
      }

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('school_id', schoolId)
        .order('department')

      if (error) throw error

      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(timestampKey, now.toString())

      return data || []
    } catch (error: any) {
      toast.error('Failed to load departments')
      throw error
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast.success('Profile updated successfully!')
      return data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }

  // Get user profile
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        throw error
      }

      return data
    } catch (error: any) {
      toast.error('Failed to load profile')
      throw error
    }
  }

  // Upload profile avatar
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: data.publicUrl })

      toast.success('Profile picture updated!')
      return data.publicUrl
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture')
      throw error
    }
  }

  // Delete user account
  static async deleteAccount(userId: string): Promise<void> {
    try {
      // Delete user data in order (due to foreign key constraints)
      
      // 1. Delete connections
      await supabase.from('connections').delete().eq('user_id', userId)
      await supabase.from('connections').delete().eq('connected_user_id', userId)

      // 2. Delete assignments
      await supabase.from('assignments').delete().eq('user_id', userId)

      // 3. Delete timetable entries
      await supabase.from('timetable').delete().eq('user_id', userId)

      // 4. Delete user profile
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast.success('Account deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account')
      throw error
    }
  }

  // Change password (requires current session)
  static async changePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
      throw error
    }
  }

  // Clear profile cache
  static clearProfileCache(): void {
    const keys = [
      'schools_cache',
      'schools_cache_timestamp'
    ]
    
    // Clear department caches (all schools)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('departments_') && key.endsWith('_cache')) {
        keys.push(key)
      }
      if (key.startsWith('departments_') && key.endsWith('_timestamp')) {
        keys.push(key)
      }
    })

    keys.forEach(key => localStorage.removeItem(key))
  }
}