import { create } from 'zustand'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// New schema-aligned UserProfile interface
export interface UserProfile {
  id: string
  email: string
  name?: string
  phone_number?: string
  avatar_url?: string
  bio?: string
  // New FK-based fields
  school_id?: string
  class_group_id?: string
  current_session_id?: string
  current_semester_id?: string
  // Invite code for course reps (still on users table)
  invite_code?: string
  created_at?: string
  updated_at?: string
}

// Extended profile with joined data for display
export interface UserProfileWithDetails extends UserProfile {
  school?: { id: string; name: string }
  class_group?: {
    id: string
    name?: string
    school_id: string
    department_id: string
    level_id: string
    department?: { id: string; name: string }
    level?: { id: string; level_number: number; name: string }
  }
  current_session?: { id: string; name: string }
  current_semester?: { id: string; name: string }
  course_rep_user?: { id: string; name: string }
  user_roles?: Array<{ role: { id: string; name: string } }>
}

// Registration data for course rep
export interface CourseRepRegistrationData {
  name: string
  email?: string
  phone_number?: string
  school_id: string
  department_id: string
  level_number: number
  session_id?: string
  semester_id?: string
}

// Registration data for student via invite
export interface StudentRegistrationData {
  name: string
  phone_number?: string
}

interface AuthState {
  user: User | null
  profile: UserProfileWithDetails | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  initialize: () => Promise<void>
  register: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  registerCourseRep: (email: string, password: string, userData: CourseRepRegistrationData) => Promise<string>
  registerWithInvite: (inviteCode: string, password: string, userData: StudentRegistrationData) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithPhone: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
  getInviteInfo: (inviteCode: string) => Promise<{
    level_invite: any;
    class_group: any;
    level_rep: any;
  } | null>
  isCourseRep: () => boolean
  hasRole: (roleName: string) => boolean
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  // Helper to check if user is course rep
  isCourseRep: () => {
    const { profile } = get()
    if (!profile?.user_roles) return false
    return profile.user_roles.some(ur => ur.role?.name === 'course_rep')
  },

  // Helper to check if user has a specific role
  hasRole: (roleName: string) => {
    const { profile } = get()
    if (!profile?.user_roles) return false
    return profile.user_roles.some(ur => ur.role?.name === roleName)
  },

  // Initialize auth state with full profile details
  initialize: async () => {
    set({ loading: true, initialized: false })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch profile with all related data
        const { data: profile, error } = await supabase
          .from('users')
          .select(`
            *,
            school:schools!users_school_id_fkey(id, name),
            class_group:class_groups!users_class_group_id_fkey(
              id, name, school_id, department_id, level_id,
              department:departments!class_groups_department_id_fkey(id, name),
              level:levels!class_groups_level_id_fkey(id, level_number, name)
            ),
            current_session:sessions!users_current_session_id_fkey(id, name),
            current_semester:semesters!users_current_semester_id_fkey(id, name),
            user_roles(role:roles(id, name))
          `)
          .eq('id', session.user.id)
          .single()

        set({ 
          user: session.user, 
          profile: error ? null : profile, 
          loading: false, 
          initialized: true 
        })
      } else {
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true 
        })
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select(`
              *,
              school:schools!users_school_id_fkey(id, name),
              class_group:class_groups!users_class_group_id_fkey(
                id, name, school_id, department_id, level_id,
                department:departments!class_groups_department_id_fkey(id, name),
                level:levels!class_groups_level_id_fkey(id, level_number, name)
              ),
              current_session:sessions!users_current_session_id_fkey(id, name),
              current_semester:semesters!users_current_semester_id_fkey(id, name),
              user_roles(role:roles(id, name))
            `)
            .eq('id', session.user.id)
            .single()

          set({ 
            user: session.user, 
            profile, 
            loading: false, 
            initialized: true 
          })
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            profile: null, 
            loading: false, 
            initialized: true 
          })
        }
      })
      
    } catch (error) {
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        initialized: true 
      })
    }
  },

  // Register new user (simple - used for direct registration if needed)
  register: async (email: string, password: string, userData: Partial<UserProfile>) => {
    set({ loading: true })
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create profile with new schema
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school_id: userData.school_id,
          class_group_id: userData.class_group_id,
          current_session_id: userData.current_session_id,
          current_semester_id: userData.current_semester_id,
          bio: userData.bio,
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Assign student role
      const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single()

      if (studentRole) {
        await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role_id: studentRole.id })
      }

      set({ user: authData.user, profile, loading: false, initialized: true })
      toast.success('Account created successfully!')
      
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Register as Course Rep - creates class_group, level_rep, and level_invites
  registerCourseRep: async (email: string, password: string, userData: CourseRepRegistrationData) => {
    set({ loading: true })
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // 1. First check if level exists for this department
      let levelId: string | null = null
      const { data: existingLevel } = await supabase
        .from('levels')
        .select('id')
        .eq('department_id', userData.department_id)
        .eq('level_number', userData.level_number)
        .single()

      if (existingLevel) {
        levelId = existingLevel.id
      } else {
        // Create level
        const { data: newLevel, error: levelError } = await supabase
          .from('levels')
          .insert({
            department_id: userData.department_id,
            level_number: userData.level_number,
            name: `${userData.level_number * 100} Level`
          })
          .select()
          .single()

        if (levelError) throw levelError
        levelId = newLevel.id
      }

      // 2. Check if class_group exists or create one
      let classGroupId: string | null = null
      const { data: existingClassGroup } = await supabase
        .from('class_groups')
        .select('id')
        .eq('school_id', userData.school_id)
        .eq('department_id', userData.department_id)
        .eq('level_id', levelId)
        .single()

      if (existingClassGroup) {
        classGroupId = existingClassGroup.id
      } else {
        const { data: newClassGroup, error: cgError } = await supabase
          .from('class_groups')
          .insert({
            school_id: userData.school_id,
            department_id: userData.department_id,
            level_id: levelId,
            name: `${userData.level_number * 100} Level`
          })
          .select()
          .single()

        if (cgError) throw cgError
        classGroupId = newClassGroup.id
      }

      // 3. Generate unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      // 4. Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school_id: userData.school_id,
          class_group_id: classGroupId,
          current_session_id: userData.session_id || null,
          current_semester_id: userData.semester_id || null,
          invite_code: inviteCode, // Keep for backwards compatibility
        })
        .select()
        .single()

      if (profileError) throw profileError

      // 5. Get role IDs and assign roles
      const { data: roles } = await supabase
        .from('roles')
        .select('id, name')
        .in('name', ['student', 'course_rep'])

      if (roles) {
        const roleInserts = roles.map(role => ({
          user_id: authData.user!.id,
          role_id: role.id
        }))
        await supabase.from('user_roles').insert(roleInserts)
      }

      // 6. Create level_rep entry
      const { data: levelRep, error: levelRepError } = await supabase
        .from('level_reps')
        .insert({
          user_id: authData.user.id,
          class_group_id: classGroupId,
          is_active: true
        })
        .select()
        .single()

      if (levelRepError) throw levelRepError

      // 7. Create level_invite entry
      const { error: inviteError } = await supabase
        .from('level_invites')
        .insert({
          level_rep_id: levelRep.id,
          class_group_id: classGroupId,
          invite_code: inviteCode,
          is_active: true
        })

      if (inviteError) throw inviteError

      set({ user: authData.user, profile, loading: false, initialized: true })
      toast.success('Course Rep account created successfully!')
      
      return inviteCode
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Register user with invite code (students joining via link)
  registerWithInvite: async (inviteCode: string, password: string, userData: StudentRegistrationData) => {
    set({ loading: true })
    
    try {
      // 1. Get invite info from level_invites table
      const { data: inviteData, error: inviteError } = await supabase
        .from('level_invites')
        .select(`
          id,
          class_group_id,
          max_uses,
          use_count,
          expires_at,
          is_active,
          level_rep:level_reps!level_invites_level_rep_id_fkey(
            id,
            user_id,
            user:users!level_reps_user_id_fkey(id, name, school_id, current_session_id, current_semester_id)
          ),
          class_group:class_groups!level_invites_class_group_id_fkey(
            id,
            school_id,
            department_id,
            level_id
          )
        `)
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single()

      if (inviteError || !inviteData) {
        throw new Error('Invalid invite code')
      }

      // Check if invite has expired
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        throw new Error('This invite link has expired')
      }

      // Check if invite has reached max uses
      if (inviteData.max_uses && inviteData.use_count >= inviteData.max_uses) {
        throw new Error('This invite link has reached its maximum uses')
      }

      // 2. Generate unique email using phone number
      const uniqueEmail = `${userData.phone_number?.replace(/[^0-9]/g, '')}@qitt.app`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Get level rep user info
      const levelRepUser = inviteData.level_rep?.user

      // 3. Create user profile with same class_group as course rep
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: uniqueEmail,
          name: userData.name || '',
          phone_number: userData.phone_number,
          school_id: inviteData.class_group?.school_id || levelRepUser?.school_id,
          class_group_id: inviteData.class_group_id,
          current_session_id: levelRepUser?.current_session_id || null,
          current_semester_id: levelRepUser?.current_semester_id || null,
        })
        .select()
        .single()

      if (profileError) throw profileError

      // 4. Assign student role
      const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single()

      if (studentRole) {
        await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role_id: studentRole.id })
      }

      // 5. Increment invite use count
      await supabase
        .from('level_invites')
        .update({ use_count: (inviteData.use_count || 0) + 1 })
        .eq('id', inviteData.id)

      set({ user: authData.user, profile, loading: false, initialized: true })
      toast.success('Account created successfully!')
      
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Registration failed')
      throw error
    }
  },

  // Get invite info by code (for displaying on join page)
  getInviteInfo: async (inviteCode: string) => {
    try {
      const { data, error } = await supabase
        .from('level_invites')
        .select(`
          id,
          invite_code,
          class_group_id,
          is_active,
          expires_at,
          level_rep:level_reps!level_invites_level_rep_id_fkey(
            id,
            user:users!level_reps_user_id_fkey(
              id, 
              name,
              school:schools!users_school_id_fkey(id, name)
            )
          ),
          class_group:class_groups!level_invites_class_group_id_fkey(
            id,
            name,
            school:schools!class_groups_school_id_fkey(id, name),
            department:departments!class_groups_department_id_fkey(id, name),
            level:levels!class_groups_level_id_fkey(id, level_number, name)
          )
        `)
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single()

      if (error || !data) return null
      
      return {
        level_invite: data,
        class_group: data.class_group,
        level_rep: data.level_rep
      }
    } catch {
      return null
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    set({ loading: true })
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      // Fetch profile with all related data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          school:schools!users_school_id_fkey(id, name),
          class_group:class_groups!users_class_group_id_fkey(
            id, name, school_id, department_id, level_id,
            department:departments!class_groups_department_id_fkey(id, name),
            level:levels!class_groups_level_id_fkey(id, level_number, name)
          ),
          current_session:sessions!users_current_session_id_fkey(id, name),
          current_semester:semesters!users_current_semester_id_fkey(id, name),
          user_roles(role:roles(id, name))
        `)
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      set({ 
        user: authData.user, 
        profile, 
        loading: false, 
        initialized: true 
      })
      
      toast.success('Welcome back!')
      
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
      
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // Login with phone number
  loginWithPhone: async (phone: string, password: string) => {
    set({ loading: true })
    
    try {
      // First find the user's email by phone number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('phone_number', phone)
        .single()

      if (userError || !userData) {
        throw new Error('No account found with this phone number')
      }

      // Then login with the email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Login failed')

      // Fetch profile with all related data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          school:schools!users_school_id_fkey(id, name),
          class_group:class_groups!users_class_group_id_fkey(
            id, name, school_id, department_id, level_id,
            department:departments!class_groups_department_id_fkey(id, name),
            level:levels!class_groups_level_id_fkey(id, level_number, name)
          ),
          current_session:sessions!users_current_session_id_fkey(id, name),
          current_semester:semesters!users_current_semester_id_fkey(id, name),
          user_roles(role:roles(id, name))
        `)
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      set({ 
        user: authData.user, 
        profile, 
        loading: false, 
        initialized: true 
      })
      
      toast.success('Welcome back!')
      
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
      
    } catch (error: any) {
      set({ loading: false })
      toast.error(error.message || 'Login failed')
      throw error
    }
  },

  // Logout user
  logout: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null, loading: false, initialized: true })
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/'
      }
      
      toast.success('Logged out successfully')
      
    } catch (error) {
      set({ user: null, profile: null, loading: false, initialized: true })
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  },

  // Update profile
  updateProfile: async (profileData: Partial<UserProfile>) => {
    const { user, profile } = get()
    if (!user || !profile) throw new Error('No authenticated user')

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select(`
          *,
          school:schools!users_school_id_fkey(id, name),
          class_group:class_groups!users_class_group_id_fkey(
            id, name, school_id, department_id, level_id,
            department:departments!class_groups_department_id_fkey(id, name),
            level:levels!class_groups_level_id_fkey(id, level_number, name)
          ),
          current_session:sessions!users_current_session_id_fkey(id, name),
          current_semester:semesters!users_current_semester_id_fkey(id, name),
          user_roles(role:roles(id, name))
        `)
        .single()

      if (error) throw error

      set({ profile: updatedProfile })
      toast.success('Profile updated successfully!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  },
}))
