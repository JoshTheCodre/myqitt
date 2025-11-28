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
  compulsory: Course[]
  elective: Course[]
}
