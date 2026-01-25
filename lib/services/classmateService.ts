import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface Classmate {
  id: string
  name: string
  email: string
  avatar_url?: string
  phone_number?: string
  bio?: string
  isCourseRep: boolean
  isVerifiedCourseRep: boolean
  // Display info from joined data
  schoolName?: string
  departmentName?: string
  levelNumber?: number
}

export class ClassmateService {
  // Get classmates (users in same class_group)
  static async getClassmates(userId: string): Promise<Classmate[]> {
    try {
      // First get the user's class_group_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('class_group_id')
        .eq('id', userId)
        .single()

      if (userError || !userData?.class_group_id) {
        console.error('User not in a class group')
        return []
      }

      // Get all users in the same class group
      const { data: classmates, error: classmatesError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          avatar_url,
          phone_number,
          bio,
          user_roles(role:roles(name), verified),
          school:schools!users_school_id_fkey(name),
          class_group:class_groups!users_class_group_id_fkey(
            department:departments!class_groups_department_id_fkey(name),
            level:levels!class_groups_level_id_fkey(level_number)
          )
        `)
        .eq('class_group_id', userData.class_group_id)
        .order('name')

      if (classmatesError) {
        throw classmatesError
      }

      if (!classmates?.length) {
        return []
      }

      // Transform to Classmate interface
      const result: Classmate[] = classmates.map(user => {
        const courseRepRole = user.user_roles?.find(
          (ur: any) => ur.role?.name === 'course_rep'
        )
        const isCourseRep = !!courseRepRole
        const isVerifiedCourseRep = isCourseRep && (courseRepRole as any)?.verified === true

        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          avatar_url: user.avatar_url || undefined,
          phone_number: user.phone_number || undefined,
          bio: user.bio || undefined,
          isCourseRep,
          isVerifiedCourseRep,
          schoolName: (user.school as any)?.name,
          departmentName: (user.class_group as any)?.department?.name,
          levelNumber: (user.class_group as any)?.level?.level_number
        }
      })

      // Sort: verified course rep first, then alphabetically by name
      result.sort((a, b) => {
        if (a.isVerifiedCourseRep && !b.isVerifiedCourseRep) return -1
        if (!a.isVerifiedCourseRep && b.isVerifiedCourseRep) return 1
        return (a.name || '').localeCompare(b.name || '')
      })

      return result
    } catch (error: any) {
      toast.error('Failed to load classmates')
      console.error('Error fetching classmates:', error)
      return []
    }
  }

  // Get classmates count
  static async getClassmatesCount(userId: string): Promise<number> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('class_group_id')
        .eq('id', userId)
        .single()

      if (!userData?.class_group_id) return 0

      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('class_group_id', userData.class_group_id)

      if (error) return 0
      return count || 0
    } catch {
      return 0
    }
  }

  // Get course rep for user's class group
  static async getCourseRep(userId: string): Promise<Classmate | null> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('class_group_id')
        .eq('id', userId)
        .single()

      if (!userData?.class_group_id) return null

      // Find the level rep for this class group
      const { data: levelRep, error } = await supabase
        .from('level_reps')
        .select(`
          user:users!level_reps_user_id_fkey(
            id,
            name,
            email,
            avatar_url,
            phone_number,
            bio
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
        avatar_url: user.avatar_url,
        phone_number: user.phone_number,
        bio: user.bio,
        isCourseRep: true,
        isVerifiedCourseRep: true // Level reps from level_reps table are considered verified
      }
    } catch {
      return null
    }
  }

  // Search classmates by name
  static async searchClassmates(userId: string, searchTerm: string): Promise<Classmate[]> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('class_group_id')
        .eq('id', userId)
        .single()

      if (!userData?.class_group_id) return []

      const { data: classmates, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          avatar_url,
          phone_number,
          bio,
          user_roles(role:roles(name), verified)
        `)
        .eq('class_group_id', userData.class_group_id)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(20)

      if (error) throw error

      return (classmates || []).map(user => {
        const courseRepRole = user.user_roles?.find(
          (ur: any) => ur.role?.name === 'course_rep'
        )
        const isCourseRep = !!courseRepRole
        const isVerifiedCourseRep = isCourseRep && (courseRepRole as any)?.verified === true
        
        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          avatar_url: user.avatar_url || undefined,
          phone_number: user.phone_number || undefined,
          bio: user.bio || undefined,
          isCourseRep,
          isVerifiedCourseRep
        }
      })
    } catch (error) {
      console.error('Error searching classmates:', error)
      return []
    }
  }
}
