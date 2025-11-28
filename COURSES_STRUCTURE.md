# Course Management System

Clean, maintainable structure for managing courses in the myqitt platform.

## 📁 File Structure

```
lib/
├── types/
│   └── course.ts              # TypeScript interfaces and types
├── services/
│   └── courseService.ts       # Database queries and business logic
├── hooks/
│   └── useCourses.ts          # React hooks for course data
└── courses/
    └── index.ts               # Barrel export for easy imports

components/
└── courses/
    └── course-list.tsx        # Reusable course display components

app/
└── courses/
    └── page.tsx               # Courses page using the system
```

## 🎯 Usage Examples

### 1. Display User's Courses

```tsx
'use client'

import { useUserCourses } from '@/lib/hooks/useCourses'
import { GroupedCourseList } from '@/components/courses/course-list'
import { useAuthStore } from '@/lib/store/authStore'

export default function MyCoursesPage() {
  const { user } = useAuthStore()
  const { groupedCourses, loading, error } = useUserCourses(user?.id)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <GroupedCourseList
      compulsory={groupedCourses.compulsory}
      elective={groupedCourses.elective}
      showCredits={true}
    />
  )
}
```

### 2. Filter Courses by Level and Semester

```tsx
import { useGroupedCourses } from '@/lib/hooks/useCourses'

function LevelCourses({ level, semester }: { level: number; semester: 'first' | 'second' }) {
  const { groupedCourses, loading } = useGroupedCourses({
    level,
    semester,
    department: 'Computer Science'
  })

  return <GroupedCourseList {...groupedCourses} />
}
```

### 3. Search Courses

```tsx
import { useCourseSearch } from '@/lib/hooks/useCourses'

function CourseSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const { courses, loading } = useCourseSearch(searchTerm)

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search courses..."
      />
      <CourseList courses={courses} />
    </div>
  )
}
```

### 4. Direct Service Calls

```tsx
import { CourseService } from '@/lib/services/courseService'

// Get all courses for a department
const courses = await CourseService.getCourses({
  department: 'Computer Science',
  level: 2
})

// Get specific course by code
const course = await CourseService.getCourseByCode('CSC203.1')

// Search courses
const results = await CourseService.searchCourses('database')

// Calculate total credits
const totalCredits = CourseService.calculateTotalCredits(courses)
```

## 🔧 Service Methods

### `CourseService`

- `getCourses(filters?)` - Fetch courses with optional filters
- `getGroupedCourses(filters?)` - Get courses grouped by compulsory/elective
- `getCoursesByLevelAndSemester(level, semester, filters?)` - Get courses for specific level/semester
- `getCourseById(id)` - Get single course by ID
- `getCourseByCode(code)` - Get single course by code
- `searchCourses(searchTerm, filters?)` - Search courses by title or code
- `calculateTotalCredits(courses)` - Calculate total credits
- `getCoursesForUser(userId)` - Get courses matching user's profile

## 🎨 Components

### `CourseCard`

Display single course with:
- Course code and title
- Credits
- Compulsory/Elective badge
- Lecturer info
- Description
- Clickable with selection state

**Props:**
```tsx
interface CourseCardProps {
  course: Course
  onClick?: (course: Course) => void
  selected?: boolean
}
```

### `CourseList`

Display list of courses in a grid:

**Props:**
```tsx
interface CourseListProps {
  courses: Course[]
  title?: string
  emptyMessage?: string
  onCourseClick?: (course: Course) => void
  selectedCourses?: string[]
}
```

### `GroupedCourseList`

Display compulsory and elective courses separately with credit summary:

**Props:**
```tsx
interface GroupedCourseListProps {
  compulsory: Course[]
  elective: Course[]
  onCourseClick?: (course: Course) => void
  selectedCourses?: string[]
  showCredits?: boolean
}
```

## 🪝 Hooks

### `useCourses(filters?)`

Fetch courses with filters.

**Returns:** `{ courses, loading, error }`

### `useGroupedCourses(filters?)`

Fetch courses grouped by compulsory/elective.

**Returns:** `{ groupedCourses, loading, error }`

### `useUserCourses(userId?)`

Fetch courses for authenticated user based on their profile.

**Returns:** `{ groupedCourses, loading, error }`

### `useCourseSearch(searchTerm, filters?)`

Search courses with debouncing (300ms).

**Returns:** `{ courses, loading, error }`

## 🔍 Filters

All methods accept optional `CourseFilters`:

```tsx
interface CourseFilters {
  school?: string        // UUID of school
  department?: string    // Department name
  level?: number        // 1-6
  semester?: 'first' | 'second'
  tags?: string[]       // ['compulsory'], ['elective'], etc.
}
```

## 💾 Database Schema

```sql
courses (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  credits INTEGER NOT NULL,
  lecturer TEXT,
  school UUID REFERENCES schools(id),
  department TEXT NOT NULL,
  level INTEGER CHECK (level >= 1 AND level <= 6),
  semester TEXT CHECK (semester IN ('first', 'second')),
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🎯 Best Practices

1. **Use hooks in components** - Let hooks handle data fetching and state management
2. **Use service methods in server actions** - Direct database queries for server-side operations
3. **Type safety** - All methods are fully typed with TypeScript
4. **Error handling** - All methods handle errors gracefully
5. **Loading states** - Hooks provide loading states for better UX
6. **Reusable components** - Course display components are highly reusable

## 📝 Adding New Features

To add new course-related features:

1. Add new types to `lib/types/course.ts`
2. Add service methods to `lib/services/courseService.ts`
3. Create hooks in `lib/hooks/useCourses.ts` if needed
4. Build UI components in `components/courses/`
5. Use in pages under `app/`

## 🔗 Related Files

- User authentication: `lib/store/authStore.ts`
- Supabase client: `lib/supabase/client.ts`
- Layout components: `components/layout/`
