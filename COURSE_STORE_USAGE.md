# Course Store Usage Guide (Zustand)

## Why Zustand Over Hooks?

✅ **Better Performance** - No unnecessary re-renders  
✅ **Global State** - Share data across components  
✅ **Less Boilerplate** - No need for Context providers  
✅ **DevTools Support** - Easy debugging  
✅ **Simpler Code** - No useEffect dependencies to manage  
✅ **Built-in Selectors** - Optimized derived state  

## 📦 Basic Usage

### 1. Display User's Courses

```tsx
'use client'

import { useEffect } from 'react'
import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'
import { useAuthStore } from '@/lib/store/authStore'
import { GroupedCourseList } from '@/components/courses/course-list'

export default function MyCoursesPage() {
  const { user } = useAuthStore()
  const { userCourses, loading, error, fetchUserCourses } = useCourseStore()
  const { userTotalCount, userTotalCredits } = useCourseSelectors()

  // Fetch courses on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserCourses(user.id)
    }
  }, [user?.id, fetchUserCourses])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>My Courses ({userTotalCount})</h1>
      <p>Total Credits: {userTotalCredits}</p>
      
      {userCourses && (
        <GroupedCourseList
          compulsory={userCourses.compulsory}
          elective={userCourses.elective}
        />
      )}
    </div>
  )
}
```

### 2. Course Search with Filters

```tsx
'use client'

import { useState } from 'react'
import { useCourseStore } from '@/lib/store/courseStore'
import { CourseList } from '@/components/courses/course-list'

export default function CourseSearch() {
  const { 
    searchResults, 
    loading, 
    searchTerm,
    setSearchTerm,
    setFilters 
  } = useCourseStore()

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search courses..."
      />
      
      <select onChange={(e) => setFilters({ level: Number(e.target.value) })}>
        <option value="">All Levels</option>
        <option value="1">100 Level</option>
        <option value="2">200 Level</option>
        <option value="3">300 Level</option>
        <option value="4">400 Level</option>
      </select>

      {loading ? (
        <p>Searching...</p>
      ) : (
        <CourseList courses={searchResults} />
      )}
    </div>
  )
}
```

### 3. Course Selection (for Registration)

```tsx
'use client'

import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'
import { CourseList } from '@/components/courses/course-list'

export default function CourseRegistration() {
  const { 
    userCourses, 
    selectedCourses,
    toggleCourseSelection,
    clearSelection 
  } = useCourseStore()
  
  const { selectedCount, selectedCredits } = useCourseSelectors()

  const handleRegister = async () => {
    // Register selected courses
    console.log('Registering courses:', selectedCourses)
    // After successful registration:
    clearSelection()
  }

  return (
    <div>
      <div className="summary">
        <h2>Course Registration</h2>
        <p>Selected: {selectedCount} courses ({selectedCredits} credits)</p>
        <button onClick={handleRegister} disabled={selectedCount === 0}>
          Register Courses
        </button>
        <button onClick={clearSelection}>Clear Selection</button>
      </div>

      {userCourses && (
        <CourseList
          courses={[...userCourses.compulsory, ...userCourses.elective]}
          onCourseClick={(course) => toggleCourseSelection(course.id)}
          selectedCourses={selectedCourses}
        />
      )}
    </div>
  )
}
```

### 4. Level Selector with Filters

```tsx
'use client'

import { useEffect } from 'react'
import { useCourseStore } from '@/lib/store/courseStore'

export default function LevelCourses() {
  const [level, setLevel] = useState(1)
  const [semester, setSemester] = useState<'first' | 'second'>('first')
  
  const { groupedCourses, loading, fetchGroupedCourses } = useCourseStore()

  // Fetch when level or semester changes
  useEffect(() => {
    fetchGroupedCourses({
      level,
      semester,
      department: 'Computer Science'
    })
  }, [level, semester, fetchGroupedCourses])

  return (
    <div>
      <div className="filters">
        <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
          <option value={1}>100 Level</option>
          <option value={2}>200 Level</option>
          <option value={3}>300 Level</option>
          <option value={4}>400 Level</option>
        </select>

        <select value={semester} onChange={(e) => setSemester(e.target.value as any)}>
          <option value="first">First Semester</option>
          <option value="second">Second Semester</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      
      {groupedCourses && (
        <div>
          <h3>Compulsory ({groupedCourses.compulsory.length})</h3>
          <CourseList courses={groupedCourses.compulsory} />
          
          <h3>Elective ({groupedCourses.elective.length})</h3>
          <CourseList courses={groupedCourses.elective} />
        </div>
      )}
    </div>
  )
}
```

### 5. Using Selectors for Derived State

```tsx
'use client'

import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'

export default function CourseSummary() {
  const selectors = useCourseSelectors()

  return (
    <div className="stats-grid">
      <StatCard 
        title="Total Courses" 
        value={selectors.userTotalCount}
      />
      <StatCard 
        title="Compulsory" 
        value={selectors.userCompulsoryCount}
      />
      <StatCard 
        title="Elective" 
        value={selectors.userElectiveCount}
      />
      <StatCard 
        title="Total Credits" 
        value={selectors.userTotalCredits}
      />
      <StatCard 
        title="Selected" 
        value={selectors.selectedCount}
      />
      <StatCard 
        title="Selected Credits" 
        value={selectors.selectedCredits}
      />
    </div>
  )
}
```

## 🎯 Store API Reference

### State Properties

```typescript
{
  courses: Course[]              // All fetched courses
  groupedCourses: GroupedCourses | null  // Compulsory/Elective split
  userCourses: GroupedCourses | null     // User's specific courses
  searchResults: Course[]        // Search results
  selectedCourses: string[]      // IDs of selected courses
  loading: boolean               // Loading state
  error: string | null           // Error message
  filters: CourseFilters         // Current filters
  searchTerm: string             // Current search term
}
```

### Actions

```typescript
{
  // Fetch all courses with optional filters
  fetchCourses(filters?: CourseFilters): Promise<void>
  
  // Fetch courses grouped by compulsory/elective
  fetchGroupedCourses(filters?: CourseFilters): Promise<void>
  
  // Fetch courses for specific user (auto-matches profile)
  fetchUserCourses(userId: string): Promise<void>
  
  // Search courses by title or code
  searchCourses(searchTerm: string, filters?: CourseFilters): Promise<void>
  
  // Update filters (auto-refetches)
  setFilters(filters: CourseFilters): void
  
  // Update search term (debounced)
  setSearchTerm(term: string): void
  
  // Toggle course selection
  toggleCourseSelection(courseId: string): void
  
  // Clear all selections
  clearSelection(): void
  
  // Reset entire store
  reset(): void
}
```

### Selectors (Derived State)

```typescript
{
  totalCoursesCount: number          // Total courses fetched
  userCompulsoryCount: number        // User's compulsory courses count
  userElectiveCount: number          // User's elective courses count
  userTotalCount: number             // Total user courses
  totalCredits: number               // Total credits of all courses
  userTotalCredits: number           // Total credits of user courses
  selectedCount: number              // Number of selected courses
  selectedCoursesData: Course[]      // Full data of selected courses
  selectedCredits: number            // Credits of selected courses
  hasUserCourses: boolean            // User has any courses
  hasSearchResults: boolean          // Search has results
  isSearching: boolean               // Currently searching
}
```

## 🔥 Advanced Patterns

### Combining Multiple Stores

```tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { fetchUserCourses } = useCourseStore()
  const { userTotalCount, userTotalCredits } = useCourseSelectors()

  useEffect(() => {
    if (user?.id) {
      fetchUserCourses(user.id)
    }
  }, [user?.id, fetchUserCourses])

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>You're taking {userTotalCount} courses ({userTotalCredits} credits)</p>
    </div>
  )
}
```

### Optimistic Updates

```tsx
const registerCourses = async () => {
  const { selectedCourses, clearSelection } = useCourseStore.getState()
  
  // Optimistically clear selection
  clearSelection()
  
  try {
    await api.registerCourses(selectedCourses)
    toast.success('Courses registered!')
  } catch (error) {
    // Restore selection on error
    selectedCourses.forEach(id => {
      useCourseStore.getState().toggleCourseSelection(id)
    })
    toast.error('Failed to register courses')
  }
}
```

### Direct Store Access (Outside Components)

```typescript
import { useCourseStore } from '@/lib/store/courseStore'

// Server actions, utility functions, etc.
export async function getUserCoursesData(userId: string) {
  const store = useCourseStore.getState()
  await store.fetchUserCourses(userId)
  return store.userCourses
}
```

## 💡 Best Practices

1. **Use selectors for derived state** - Prevents unnecessary re-renders
2. **Fetch in useEffect** - Load data when component mounts
3. **Reset on logout** - Clear store when user logs out
4. **Combine with auth store** - Access user info seamlessly
5. **Error handling** - Always check error state
6. **Loading states** - Show spinners during fetch operations

## 🆚 Comparison: Hooks vs Zustand

### Old Way (Hooks)
```tsx
const { groupedCourses, loading, error } = useUserCourses(user?.id)
// Re-fetches every time component re-renders
// Can't share state between components
// Need separate hook for each data type
```

### New Way (Zustand)
```tsx
const { userCourses, loading, error, fetchUserCourses } = useCourseStore()
const { userTotalCount } = useCourseSelectors()

useEffect(() => {
  if (user?.id) fetchUserCourses(user.id)
}, [user?.id])
// Fetches once, stores globally
// All components share same data
// Single store for all operations
```

## 🎓 Migration Guide

If you have existing code using hooks:

```tsx
// Before (Hooks)
import { useUserCourses } from '@/lib/hooks/useCourses'
const { groupedCourses, loading, error } = useUserCourses(userId)

// After (Zustand)
import { useCourseStore, useCourseSelectors } from '@/lib/store/courseStore'
const { userCourses, loading, error, fetchUserCourses } = useCourseStore()
const { userTotalCount } = useCourseSelectors()

useEffect(() => {
  if (userId) fetchUserCourses(userId)
}, [userId, fetchUserCourses])
```
