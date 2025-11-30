export interface TimetableEntry {
  id: string
  user_id: string
  course_id?: string // Optional reference to courses table
  course_code: string
  course_title: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  start_time: string // Format: "HH:MM"
  end_time: string // Format: "HH:MM"
  location: string
  created_at?: string
  updated_at?: string
}

export interface TimetableFilters {
  user_id: string
  day?: string
  course_code?: string
}

export interface GroupedTimetable {
  Monday: TimetableEntry[]
  Tuesday: TimetableEntry[]
  Wednesday: TimetableEntry[]
  Thursday: TimetableEntry[]
  Friday: TimetableEntry[]
  Saturday: TimetableEntry[]
  Sunday: TimetableEntry[]
}

export interface CreateTimetableEntryInput {
  course_code: string
  course_title: string
  day: string
  start_time: string
  end_time: string
  location: string
  course_id?: string
}

export interface UpdateTimetableEntryInput extends Partial<CreateTimetableEntryInput> {
  id: string
}
