export interface Assignment {
  id: string
  user_id: string
  course_id?: string // Optional reference to courses table
  course_code: string
  course_title?: string
  description: string
  due_date: string // ISO format date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  attachments?: AssignmentAttachment[]
  created_at?: string
  updated_at?: string
  completed_at?: string
}

export interface AssignmentAttachment {
  id: string
  assignment_id: string
  file_name: string
  file_url: string
  file_type: string // 'image/png', 'application/pdf', etc.
  file_size: number // in bytes
  created_at?: string
}

export interface AssignmentFilters {
  user_id: string
  status?: string
  course_code?: string
  due_date_from?: string
  due_date_to?: string
}

export interface AssignmentStats {
  total: number
  completed: number
  pending: number
  overdue: number
  in_progress: number
}

export interface CreateAssignmentInput {
  course_code: string
  course_title?: string
  description: string
  due_date: string
  course_id?: string
}

export interface UpdateAssignmentInput extends Partial<CreateAssignmentInput> {
  id: string
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
}
