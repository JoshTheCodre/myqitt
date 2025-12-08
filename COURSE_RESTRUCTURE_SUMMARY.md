# Course Database Restructure - Summary

## Overview
Restructured the course management system to use JSONB storage for better scalability and data organization. Each department's full curriculum is now stored as a single row with nested course data.

## Database Changes

### Old Structure (Individual Rows)
- Each course was a separate row in the `courses` table
- Columns: `id`, `code`, `title`, `credits`, `lecturer`, `level`, `semester`, `tags`, `school`, `department`

### New Structure (JSONB)
- One row per department containing all courses
- Columns: `id`, `school`, `department`, `description`, `course_data` (JSONB), `created_at`, `updated_at`
- Department names use snake_case: `computer_science`, `educational_psychology_guidance_and_counselling`

### JSONB Structure
```json
{
  "100": {
    "1": [
      {
        "courseCode": "COS101.2",
        "courseTitle": "INTRODUCTION TO COMPUTER SCIENCE",
        "courseUnit": 3,
        "category": "COMPULSORY"
      }
    ],
    "2": [...]
  },
  "200": {...},
  "300": {...},
  "400": {...}
}
```

**Key Mapping:**
- Level keys: "100", "200", "300", "400", "500", "600" (user level 1-6 × 100)
- Semester keys: "1" (first semester), "2" (second semester)
- Category: "COMPULSORY" or "ELECTIVE" (replaces tags array)

## Current Data
- **Computer Science**: 68 courses (100-400 level)
- **Educational Psychology, Guidance and Counselling**: 52 courses (100-400 level)

## Code Changes

### 1. Type Definitions (`lib/types/course.ts`)
**New Types:**
- `CourseItem` - Individual course within curriculum
  - `courseCode: string`
  - `courseTitle: string`
  - `courseUnit: number`
  - `category: 'COMPULSORY' | 'ELECTIVE'`
  
- `CourseCurriculum` - Full department curriculum
  - `course_data: {[level: string]: {[semester: string]: CourseItem[]}}`
  
- `GroupedCourses` - Now uses `CourseItem[]` instead of `Course[]`

### 2. Service Layer (`lib/services/courseService.ts`)
**New Methods:**
- `getCourseCurriculum(department, school)` - Fetch department's full curriculum
- `getCoursesByLevelAndSemester(dept, level, semester, school)` - Extract courses from JSONB
  - Converts level (1→"100", 2→"200", etc.)
  - Converts semester ("first"→"1", "second"→"2")

**Updated Methods:**
- `getCourses()` - Now uses new structure internally
- `getGroupedCourses()` - Filters by category instead of tags
- `getCourseByCode()` - Searches through JSONB structure
- `searchCourses()` - Full-text search within JSONB
- `calculateTotalCredits()` - Uses `courseUnit` instead of `credits`
- `getCoursesForUser()` - Adapted for new structure

### 3. State Management (`lib/store/courseStore.ts`)
**Changes:**
- Updated all state types from `Course[]` to `CourseItem[]`
- `toggleCourseSelection()` now uses `courseCode` instead of `id`
- Selectors updated to use `courseUnit` instead of `credits`
- `selectedCoursesData` filters by `courseCode`

### 4. Hooks (`lib/hooks/useCourses.ts`)
**Changes:**
- `useCourses()` returns `CourseItem[]`
- `useCourseSearch()` returns `CourseItem[]`
- All hook states updated to use `CourseItem` type

### 5. Components (`components/courses/course-list.tsx`)
**Changes:**
- `CourseCard` props use `CourseItem` type
- Display properties updated:
  - `course.code` → `course.courseCode`
  - `course.title` → `course.courseTitle`
  - `course.credits` → `course.courseUnit`
  - `course.tags?.includes('compulsory')` → `course.category === 'COMPULSORY'`
- Removed lecturer display (not in CourseItem)
- Removed description display (not in CourseItem)
- `GroupedCourseList` uses `courseUnit` for credit calculations

### 6. Pages
**`app/courses/page.tsx`:**
- No changes needed (uses GroupedCourseList component)

**`app/timetable/add/page.tsx`:**
- Course dropdown updated:
  - `key={course.courseCode}` instead of `course.id`
  - `value={course.courseTitle}` instead of `course.title`
  - Display `course.courseCode` instead of `course.code`

**`app/assignment/add/page.tsx`:**
- Course dropdown updated:
  - `key={course.courseCode}` instead of `course.id`
  - `value={course.courseCode}` instead of `course.code`
  - Display `{course.courseCode} - {course.courseTitle}`

### 7. Registration Form (`app/auth/register-form.tsx`)
- Added "Educational Psychology, Guidance and Counselling" to department dropdown

## Migration Notes

### Property Mapping
| Old Property | New Property | Notes |
|-------------|--------------|-------|
| `code` | `courseCode` | No change in format |
| `title` | `courseTitle` | No change in format |
| `credits` | `courseUnit` | Same numeric value |
| `tags[]` | `category` | Array → Enum ("COMPULSORY"/"ELECTIVE") |
| `id` | `courseCode` | Used as unique identifier |
| `lecturer` | *removed* | Not in CourseItem |
| `description` | *removed* | Not in CourseItem |
| `level` | *embedded in structure* | Converted to "100", "200", etc. |
| `semester` | *embedded in structure* | Converted to "1", "2" |

### Level/Semester Conversions
```typescript
// User input → JSONB key
level 1-6 → "100", "200", "300", "400", "500", "600"
semester "first"/"second" → "1"/"2"

// Example access
course_data['100']['1']  // 100 level, first semester
course_data['200']['2']  // 200 level, second semester
```

## Benefits of New Structure
1. **Scalability**: Single row per department vs hundreds of individual course rows
2. **Consistency**: All department courses stored together
3. **Performance**: Single query fetches entire curriculum
4. **Flexibility**: Easy to add new levels/semesters by adding JSONB keys
5. **Data Integrity**: Course data stays synchronized per department

## Testing Checklist
- [x] TypeScript compilation passes with no errors
- [ ] Course listing page displays courses correctly
- [ ] Timetable creation with course selection works
- [ ] Assignment creation with course selection works
- [ ] Course search functionality works
- [ ] Compulsory/Elective filtering works
- [ ] Credit calculations are accurate
- [ ] Both departments (Computer Science & Educational Psychology) accessible

## Verification Queries

### Check course counts
```sql
SELECT 
  department,
  jsonb_array_length(course_data->'100'->'1') as first_sem_100_count,
  jsonb_array_length(course_data->'100'->'2') as second_sem_100_count,
  jsonb_array_length(course_data->'200'->'1') as first_sem_200_count
FROM courses
ORDER BY department;
```

### Access specific level/semester
```sql
SELECT 
  department,
  course_data->'100'->'1' as first_semester_100_level
FROM courses 
WHERE department = 'computer_science';
```

### Search for specific course
```sql
SELECT 
  department,
  jsonb_path_query(course_data, '$.**[*] ? (@.courseCode == "COS101.2")')
FROM courses;
```

## Files Modified
1. `lib/types/course.ts` - Type definitions
2. `lib/services/courseService.ts` - Data access layer
3. `lib/store/courseStore.ts` - State management
4. `lib/hooks/useCourses.ts` - React hooks
5. `components/courses/course-list.tsx` - UI components
6. `app/courses/page.tsx` - Course listing (no changes needed)
7. `app/timetable/add/page.tsx` - Timetable creation
8. `app/assignment/add/page.tsx` - Assignment creation
9. `app/auth/register-form.tsx` - Registration form

## Next Steps
1. Test the application thoroughly
2. Verify all course-related features work correctly
3. Add more departments as needed
4. Consider adding course descriptions back if needed
5. Consider adding lecturer information if needed (could be separate JSONB field)
