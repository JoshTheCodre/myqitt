import { create } from 'zustand'
import { api } from '@/utils/api-client'

// ============ TYPES ============
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

// ============ STATE ============
interface CatchUpState {
  items: CatchUpItem[]
  unviewedItems: CatchUpItem[]
  loading: boolean

  // Actions
  fetchCatchUpItems: () => Promise<void>
  markAsViewed: (itemId: string) => void
  getViewedItems: () => string[]
  clearViewedItems: () => void
  reset: () => void
}

// ============ HELPERS ============
export function formatTargetInfo(item: CatchUpItem): string {
  if (item.targets.global) return 'All users'
  const parts: string[] = []
  if (item.targets.schools.length > 0) parts.push(`${item.targets.schools.length} school(s)`)
  if (item.targets.departments.length > 0) parts.push(`${item.targets.departments.length} department(s)`)
  if (item.targets.levels.length > 0) parts.push(`Level ${item.targets.levels.join(', ')}`)
  if (item.targets.class_groups?.length > 0) parts.push(`${item.targets.class_groups.length} class group(s)`)
  return parts.length > 0 ? parts.join(' • ') : 'Specific users'
}

export function formatExpiryDate(expiresAt?: string | null): string | null {
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

const initialState = {
  items: [],
  unviewedItems: [],
  loading: false,
}

export const useCatchUpStore = create<CatchUpState>((set, get) => ({
  ...initialState,

  fetchCatchUpItems: async () => {
    set({ loading: true })
    try {
      const items = await api.get<CatchUpItem[]>('/api/catchup')
      const viewedIds = get().getViewedItems()
      const unviewedItems = items.filter(item => !viewedIds.includes(item.id))
      set({ items, unviewedItems, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  markAsViewed: (itemId: string) => {
    try {
      const viewedItems = get().getViewedItems()
      if (!viewedItems.includes(itemId)) {
        viewedItems.push(itemId)
        localStorage.setItem('viewed_catchup_items', JSON.stringify(viewedItems))
      }
      set(state => ({
        unviewedItems: state.unviewedItems.filter(item => item.id !== itemId)
      }))
    } catch (error) {
      console.error('Failed to mark item as viewed:', error)
    }
  },

  getViewedItems: (): string[] => {
    try {
      const viewed = localStorage.getItem('viewed_catchup_items')
      return viewed ? JSON.parse(viewed) : []
    } catch {
      return []
    }
  },

  clearViewedItems: () => {
    try {
      localStorage.removeItem('viewed_catchup_items')
      set(state => ({ unviewedItems: state.items }))
    } catch (error) {
      console.error('Failed to clear viewed items:', error)
    }
  },

  reset: () => set(initialState),
}))
