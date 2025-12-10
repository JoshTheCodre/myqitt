import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface Classmate {
  id: string
  name: string
  email: string
  school: string
  department: string
  level: number
  semester: string
  bio?: string
  avatar_url?: string
  phone_number?: string
  followers: number
  hasAssignments: boolean
  hasTimetable: boolean
  isConnected: boolean
}

export interface Connection {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export class ClassmateService {
  // Get classmates (users in same school/department)
  static async getClassmates(
    userId: string, 
    userSchool: string, 
    userDepartment: string
  ): Promise<Classmate[]> {
    try {
      // Get users in same school and department (including current user)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('school', userSchool)
        .eq('department', userDepartment)
      
      if (usersError) throw usersError

      // Get current user's connections
      const { data: connections, error: connectError } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)

      if (connectError) throw connectError

      const connectedIds = connections?.map(c => c.following_id) || []

      if (!users?.length) {
        return []
      }

      const userIds = users.map(u => u.id)

      // Batch fetch all data at once
      const [followersData, assignmentsData, timetablesData] = await Promise.all([
        supabase.from('connections').select('following_id').in('following_id', userIds),
        supabase.from('assignments').select('user_id').in('user_id', userIds),
        supabase.from('timetable').select('user_id').in('user_id', userIds)
      ])

      // Create lookup maps
      const followerCounts = new Map<string, number>()
      const hasAssignments = new Set<string>()
      const hasTimetables = new Set<string>()

      followersData.data?.forEach(f => {
        followerCounts.set(f.following_id, (followerCounts.get(f.following_id) || 0) + 1)
      })

      assignmentsData.data?.forEach(a => hasAssignments.add(a.user_id))
      timetablesData.data?.forEach(t => hasTimetables.add(t.user_id))

      // Build classmates array efficiently
      const classmates: Classmate[] = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        department: user.department,
        level: user.level,
        semester: user.semester,
        bio: user.bio,
        avatar_url: user.avatar_url,
        phone_number: user.phone_number,
        followers: followerCounts.get(user.id) || 0,
        hasAssignments: hasAssignments.has(user.id),
        hasTimetable: hasTimetables.has(user.id),
        isConnected: connectedIds.includes(user.id)
      }))

      return classmates
    } catch (error: any) {
      toast.error('Failed to load classmates')
      throw error
    }
  }

  // Connect to user (simplified - no pending status)
  static async connectToUser(userId: string, targetUserId: string): Promise<void> {
    try {
      // Check if already connected
      const { data: existing } = await supabase
        .from('connections')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single()

      if (existing) {
        toast.error('Already connected to this user')
        return
      }

      // Check if user has existing connection (single connection constraint)
      const { data: existingConnection, error: connectionError } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', userId)
        .limit(1)
        .single()

      if (connectionError && connectionError.code !== 'PGRST116') {
        throw connectionError
      }

      if (existingConnection) {
        toast.error('You can only connect to one classmate at a time')
        return
      }

      const { error } = await supabase
        .from('connections')
        .insert({
          follower_id: userId,
          following_id: targetUserId
        })

      if (error) throw error
      toast.success('Connected successfully!')
    } catch (error: any) {
      if (error.message?.includes('already connected')) return
      toast.error(error.message || 'Failed to connect')
      throw error
    }
  }

  // Disconnect from user
  static async disconnectUser(userId: string, targetUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)

      if (error) throw error
      toast.success('Disconnected successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect')
      throw error
    }
  }

  // Get connected user (since only one connection allowed)
  static async getConnectedUser(userId: string): Promise<Classmate | null> {
    try {
      const { data: connection, error } = await supabase
        .from('connections')
        .select(`
          following_id,
          users!connections_following_id_fkey(
            id, name, email, school, department, level, semester, bio, avatar_url, phone_number
          )
        `)
        .eq('follower_id', userId)
        .single()

      if (error || !connection?.users) return null

      const user = Array.isArray(connection.users) ? connection.users[0] : connection.users

      // Get follower count
      const { count: followerCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)

      // Check for assignments and timetable
      const { count: assignmentCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: timetableCount } = await supabase
        .from('timetable')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        department: user.department,
        level: user.level,
        semester: user.semester,
        bio: user.bio,
        avatar_url: user.avatar_url,
        phone_number: user.phone_number,
        followers: followerCount || 0,
        hasAssignments: (assignmentCount || 0) > 0,
        hasTimetable: (timetableCount || 0) > 0,
        isConnected: true
      }
    } catch (error: any) {
      return null
    }
  }
}