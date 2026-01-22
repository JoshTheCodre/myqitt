// API Client utility for making requests to Next.js API routes
// Handles errors, auth tokens, and response parsing

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers: customHeaders, ...rest } = options

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    const config: RequestInit = {
      ...rest,
      headers,
      credentials: 'include', // Include cookies for auth
    }

    if (body) {
      config.body = JSON.stringify(body)
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config)

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type')
    let data: unknown

    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error: string }).error
        : 'An error occurred'
      throw new ApiError(errorMessage, response.status, data)
    }

    return data as T
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export a singleton instance
export const api = new ApiClient()

// Export individual API modules for organization
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: unknown; profile: unknown }>('/auth/login', { email, password }),

  loginWithPhone: (phone: string, password: string) =>
    api.post<{ user: unknown; profile: unknown }>('/auth/login', { phone, password }),

  register: (data: {
    email: string
    password: string
    name: string
    phone_number?: string
    school_id: string
    department_id: string
    level_number: number
    session_id?: string
    semester_id?: string
  }) => api.post<{ user: unknown; profile: unknown }>('/auth/register', data),

  logout: () => api.post<{ success: boolean }>('/auth/logout'),

  getSession: () => api.get<{ user: unknown; profile: unknown } | null>('/auth/session'),
}

export const assignmentsApi = {
  getAll: () =>
    api.get<{ assignments: unknown[]; grouped: unknown[]; isCourseRep: boolean; stats: unknown }>('/assignments'),

  getById: (id: string) => api.get<{ assignment: unknown }>(`/assignments/${id}`),

  create: (data: {
    course_id: string
    title: string
    description?: string
    due_at?: string
    attachment_urls?: string[]
  }) => api.post<{ assignment: unknown; message: string }>('/assignments', data),

  update: (id: string, data: Partial<{
    course_id?: string
    title?: string
    description?: string
    due_at?: string
    attachment_urls?: string[]
  }>) => api.put<{ assignment: unknown; message: string }>(`/assignments/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/assignments/${id}`),

  toggleSubmission: (id: string, submitted: boolean) =>
    api.patch<{ assignment: unknown; message: string }>(`/assignments/${id}/submit`, { submitted }),

  getStats: () => api.get<{ stats: unknown; nextAssignment: unknown; upcomingCount: number }>('/assignments/stats'),
}

export const timetableApi = {
  get: () =>
    api.get<{ timetable: unknown; hasTimetable: boolean; isCourseRep: boolean; timetableId?: string }>('/timetable'),

  getToday: () => api.get<{ schedule: unknown[]; nextClass: unknown | null }>('/timetable/today'),

  addEntry: (data: {
    course_id: string
    day_of_week: string
    start_time: string
    end_time: string
    location: string
    notes?: string
  }) => api.post<{ entry: unknown; timetableId: string; message: string }>('/timetable', data),

  updateEntry: (id: string, data: Partial<{
    course_id?: string
    day_of_week?: string
    start_time?: string
    end_time?: string
    location?: string
    notes?: string
  }>) => api.patch<{ entry: unknown; message: string }>(`/timetable/entries/${id}`, data),

  deleteEntry: (id: string) => api.delete<{ message: string }>(`/timetable/entries/${id}`),

  save: (timetableData: Record<string, Array<{ time: string; course_code: string; venue: string }>>) =>
    api.put<{ timetableId: string; entriesCount: number; message: string }>('/timetable', { timetableData }),
}

export const coursesApi = {
  getAll: () =>
    api.get<{ courses: unknown[]; grouped: { compulsory: unknown[]; elective: unknown[] }; totalCredits: number }>('/courses'),

  getById: (id: string) => api.get<{ course: unknown; assignmentCount: number; weeklySchedule: unknown[]; isCourseRep: boolean }>(`/courses/${id}`),

  search: (query: string) =>
    api.get<{ courses: unknown[] }>(`/courses/search?q=${encodeURIComponent(query)}`),

  getAllForClassGroup: () => api.get<{ courses: unknown[] }>('/courses/all'),

  create: (data: {
    code: string
    title: string
    description?: string
    credit_unit?: number
    is_compulsory?: boolean
  }) => api.post<{ course: unknown; message: string }>('/courses', data),

  update: (id: string, data: Partial<{
    code?: string
    title?: string
    description?: string
    credit_unit?: number
    is_compulsory?: boolean
    outline?: string
  }>) => api.put<{ course: unknown; message: string }>(`/courses/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/courses/${id}`),
}

export const classmatesApi = {
  getAll: () => api.get<{ classmates: unknown[]; count: number; courseRep: unknown | null }>('/classmates'),

  search: (query: string) => api.get<{ classmates: unknown[]; count: number }>(`/classmates?search=${encodeURIComponent(query)}`),

  getById: (id: string) => api.get<{ classmate: unknown }>(`/classmates/${id}`),

  getCourseRep: () => api.get<{ courseRep: unknown | null }>('/classmates/course-rep'),
}

export const profileApi = {
  get: () => api.get<{ profile: unknown; inviteCode: string | null }>('/profile'),

  update: (data: Partial<{
    name?: string
    phone_number?: string
    bio?: string
    avatar_url?: string
    current_session_id?: string
    current_semester_id?: string
  }>) => api.put<{ profile: unknown; message: string }>('/profile', data),

  getSchools: () => api.get<{ schools: { id: string; name: string; logo_url?: string }[] }>('/profile/schools'),

  getFaculties: (schoolId: string) =>
    api.get<{ faculties: { id: string; name: string; code?: string }[] }>(`/profile/faculties?schoolId=${schoolId}`),

  getDepartments: (facultyId?: string, schoolId?: string) => {
    const params = new URLSearchParams()
    if (facultyId) params.set('facultyId', facultyId)
    if (schoolId) params.set('schoolId', schoolId)
    return api.get<{ departments: { id: string; name: string; code?: string }[] }>(`/profile/departments?${params.toString()}`)
  },

  getLevels: (departmentId: string) =>
    api.get<{ levels: { id: string; level_number: number; name: string }[] }>(`/profile/levels?departmentId=${departmentId}`),

  getSessions: (schoolId: string) =>
    api.get<{ sessions: { id: string; name: string; is_active: boolean }[] }>(`/profile/sessions?schoolId=${schoolId}`),

  getSemesters: (schoolId: string) =>
    api.get<{ semesters: { id: string; name: string }[] }>(`/profile/semesters?schoolId=${schoolId}`),
}
