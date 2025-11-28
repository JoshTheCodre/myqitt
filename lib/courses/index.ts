// Course Types
export type { Course, CourseFilters, GroupedCourses } from '../types/course'

// Course Service
export { CourseService } from '../services/courseService'

// Course Store (Zustand - Recommended)
export { useCourseStore, useCourseSelectors } from '../store/courseStore'

// Course Hooks (Legacy - use Zustand store instead)
export {
  useCourses,
  useGroupedCourses,
  useUserCourses,
  useCourseSearch
} from '../hooks/useCourses'
