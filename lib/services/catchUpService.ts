import { supabase } from '@/lib/supabase/client'

export interface CatchUpItem {
  id: string
  title: string
  summary: string
  image_url?: string
  content_md?: string
  cta?: {
    label: string
    url: string
  } | null
  targets: {
    global: boolean
    schools: string[]
    departments: string[]
    levels: number[]
    class_groups: string[]
  }
  expires_at?: string | null
  created_at: string
}

export interface UserProfile {
  school_id?: string
  department_id?: string
  level_number?: number
  class_group_id?: string
}

export class CatchUpService {
  /**
   * Get all active catch-up items for the current user
   */
  static async getCatchUpItems(userProfile: UserProfile): Promise<CatchUpItem[]> {
    try {
      console.log('📡 Fetching catch-up items from database...')
      
      // Fetch all non-expired items
      const { data, error } = await supabase
        .from('catchups')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching catch-up items:', error)
        return []
      }

      console.log('📦 Raw data from database:', data?.length || 0, 'items')

      if (!data || data.length === 0) {
        console.log('⚠️ No catch-up items in database')
        return []
      }

      // Filter items based on targeting rules
      const filteredItems = data.filter(item => {
        const targets = item.targets as CatchUpItem['targets']

        console.log(`🎯 Checking item "${item.title}":`, {
          global: targets.global,
          targetSchools: targets.schools,
          targetDepts: targets.departments,
          targetLevels: targets.levels,
          targetClassGroups: targets.class_groups,
          userSchoolId: userProfile.school_id,
          userDeptId: userProfile.department_id,
          userLevel: userProfile.level_number,
          userClassGroupId: userProfile.class_group_id
        })

        // If global, show to everyone
        if (targets.global) {
          console.log(`✅ "${item.title}" - Matched (global)`)
          return true
        }

        // For non-global items, ALL specified criteria must match (AND logic)
        // If a criteria is empty/not specified, it's considered a match
        const matchesSchool = targets.schools.length === 0 || (userProfile.school_id && targets.schools.includes(userProfile.school_id))
        const matchesDepartment = targets.departments.length === 0 || (userProfile.department_id && targets.departments.includes(userProfile.department_id))
        const matchesLevel = targets.levels.length === 0 || (userProfile.level_number && targets.levels.includes(userProfile.level_number))
        const matchesClassGroup = !targets.class_groups?.length || (userProfile.class_group_id && targets.class_groups.includes(userProfile.class_group_id))

        // ALL criteria must match (AND logic)
        const matches = matchesSchool && matchesDepartment && matchesLevel && matchesClassGroup
        
        console.log(`  School: ${matchesSchool}, Dept: ${matchesDepartment}, Level: ${matchesLevel}, ClassGroup: ${matchesClassGroup}`)
        console.log(`${matches ? '✅' : '❌'} "${item.title}" - ${matches ? 'Matched' : 'Not matched'}`)
        
        return matches
      })

      console.log(`✅ Filtered to ${filteredItems.length} items for user`)
      return filteredItems as CatchUpItem[]
    } catch (error) {
      console.error('Failed to fetch catch-up items:', error)
      return []
    }
  }

  /**
   * Mark a catch-up item as viewed by storing in localStorage
   */
  static markAsViewed(itemId: string): void {
    try {
      const viewedItems = this.getViewedItems()
      if (!viewedItems.includes(itemId)) {
        viewedItems.push(itemId)
        localStorage.setItem('viewed_catchup_items', JSON.stringify(viewedItems))
      }
    } catch (error) {
      console.error('Failed to mark item as viewed:', error)
    }
  }

  /**
   * Get list of viewed catch-up item IDs
   */
  static getViewedItems(): string[] {
    try {
      const viewed = localStorage.getItem('viewed_catchup_items')
      return viewed ? JSON.parse(viewed) : []
    } catch (error) {
      console.error('Failed to get viewed items:', error)
      return []
    }
  }

  /**
   * Get unviewed catch-up items for a user
   */
  static async getUnviewedItems(userProfile: UserProfile): Promise<CatchUpItem[]> {
    const allItems = await this.getCatchUpItems(userProfile)
    const viewedIds = this.getViewedItems()
    return allItems.filter(item => !viewedIds.includes(item.id))
  }

  /**
   * Clear all viewed items (for testing)
   */
  static clearViewedItems(): void {
    try {
      localStorage.removeItem('viewed_catchup_items')
    } catch (error) {
      console.error('Failed to clear viewed items:', error)
    }
  }

  /**
   * Format target info for display
   */
  static formatTargetInfo(item: CatchUpItem): string {
    if (item.targets.global) {
      return 'All users'
    }

    const parts: string[] = []

    if (item.targets.schools.length > 0) {
      parts.push(`${item.targets.schools.length} school(s)`)
    }
    if (item.targets.departments.length > 0) {
      parts.push(`${item.targets.departments.length} department(s)`)
    }
    if (item.targets.levels.length > 0) {
      parts.push(`Level ${item.targets.levels.join(', ')}`)
    }
    if (item.targets.class_groups?.length > 0) {
      parts.push(`${item.targets.class_groups.length} class group(s)`)
    }

    return parts.length > 0 ? parts.join(' • ') : 'Specific users'
  }

  /**
   * Format expiry date for display
   */
  static formatExpiryDate(expiresAt?: string | null): string | null {
    if (!expiresAt) return null

    const date = new Date(expiresAt)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays < 0) return 'Expired'
    if (diffInDays === 0) return 'Expires today'
    if (diffInDays === 1) return 'Expires tomorrow'
    if (diffInDays <= 7) return `Expires in ${diffInDays} days`

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    })
  }
}
