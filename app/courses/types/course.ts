export interface CourseItem {
  courseCode: string
  courseTitle: string
  courseUnit: number
  category: 'COMPULSORY' | 'ELECTIVE'
}

export interface CourseCurriculum {
  id: string
  school: string
  department: string
  description: string | null
  course_data: {
    [level: string]: {
      [semester: string]: CourseItem[]
    }
  }
  created_at?: string
  updated_at?: string
}

// Backward compatible Course interface for individual course items
export interface Course {
  id: string
  code: string
  title: string
  credits: number
  lecturer: string | null
  school: string
  department: string
  level: number
  semester: 'first' | 'second'
  description: string | null
  tags: string[]
  created_at?: string
  updated_at?: string
}

export interface CourseFilters {
  school?: string
  department?: string
  level?: number
  semester?: 'first' | 'second'
  tags?: string[]
}

export interface GroupedCourses {
  compulsory: CourseItem[]
  elective: CourseItem[]
}
