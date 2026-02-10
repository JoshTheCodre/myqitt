export const DUMMY_USER = {
  id: 'user-1',
  name: 'Joshua Eze',
  email: 'joshua.eze@uniport.edu.ng',
  phone: '+234 812 345 6789',
  school: 'School of Science',
  department: 'Computer Science',
  level: '400',
  semester: 'First Semester',
  session: '2025/2026',
  bio: 'Passionate about building great software and helping others learn.',
  isCourseRep: true,
  courseRepName: 'Daniel Okafor',
  avatarInitials: 'JE',
}

export const DUMMY_COURSES = {
  compulsory: [
    { courseCode: 'CSC 401', courseTitle: 'Compiler Construction', courseUnit: 3, category: 'COMPULSORY' as const },
    { courseCode: 'CSC 403', courseTitle: 'Computer Networks', courseUnit: 3, category: 'COMPULSORY' as const },
    { courseCode: 'CSC 405', courseTitle: 'Operating Systems II', courseUnit: 3, category: 'COMPULSORY' as const },
    { courseCode: 'CSC 407', courseTitle: 'Artificial Intelligence', courseUnit: 3, category: 'COMPULSORY' as const },
    { courseCode: 'CSC 409', courseTitle: 'Software Engineering II', courseUnit: 3, category: 'COMPULSORY' as const },
    { courseCode: 'CSC 411', courseTitle: 'Operations Research', courseUnit: 2, category: 'COMPULSORY' as const },
  ],
  elective: [
    { courseCode: 'CSC 413', courseTitle: 'Human-Computer Interaction', courseUnit: 2, category: 'ELECTIVE' as const },
    { courseCode: 'CSC 415', courseTitle: 'Computer Graphics', courseUnit: 2, category: 'ELECTIVE' as const },
  ],
}

export const DUMMY_CARRYOVER_COURSES = [
  { id: 'co-1', courseCode: 'CSC 301', courseTitle: 'Data Structures & Algorithms', courseUnit: 3, isCompleted: false },
  { id: 'co-2', courseCode: 'MTH 201', courseTitle: 'Mathematical Methods', courseUnit: 3, isCompleted: true },
]

export const DUMMY_TIMETABLE: Record<string, Array<{ id: string; time: string; startTime: string; endTime: string; title: string; location: string; courseCode: string }>> = {
  Monday: [
    { id: 't-1', time: '8:00 AM - 10:00 AM', startTime: '08:00', endTime: '10:00', title: 'Compiler Construction', courseCode: 'CSC 401', location: 'LT 301' },
    { id: 't-2', time: '12:00 PM - 2:00 PM', startTime: '12:00', endTime: '14:00', title: 'Computer Networks', courseCode: 'CSC 403', location: 'Lab 2' },
  ],
  Tuesday: [
    { id: 't-3', time: '10:00 AM - 12:00 PM', startTime: '10:00', endTime: '12:00', title: 'Operating Systems II', courseCode: 'CSC 405', location: 'LT 201' },
    { id: 't-4', time: '2:00 PM - 4:00 PM', startTime: '14:00', endTime: '16:00', title: 'Artificial Intelligence', courseCode: 'CSC 407', location: 'LT 301' },
  ],
  Wednesday: [
    { id: 't-5', time: '8:00 AM - 10:00 AM', startTime: '08:00', endTime: '10:00', title: 'Software Engineering II', courseCode: 'CSC 409', location: 'Lab 1' },
    { id: 't-6', time: '12:00 PM - 2:00 PM', startTime: '12:00', endTime: '14:00', title: 'Operations Research', courseCode: 'CSC 411', location: 'LT 101' },
  ],
  Thursday: [
    { id: 't-7', time: '10:00 AM - 12:00 PM', startTime: '10:00', endTime: '12:00', title: 'Compiler Construction', courseCode: 'CSC 401', location: 'Lab 2' },
    { id: 't-8', time: '2:00 PM - 4:00 PM', startTime: '14:00', endTime: '16:00', title: 'Human-Computer Interaction', courseCode: 'CSC 413', location: 'LT 201' },
  ],
  Friday: [
    { id: 't-9', time: '8:00 AM - 10:00 AM', startTime: '08:00', endTime: '10:00', title: 'Computer Networks', courseCode: 'CSC 403', location: 'LT 301' },
  ],
}

export const DUMMY_TODAYS_CLASSES = [
  {
    id: 'tc-1',
    courseCode: 'CSC 401',
    courseName: 'Compiler Construction',
    startTime: '08:00',
    endTime: '10:00',
    location: 'LT 301',
    status: 'completed' as const,
    isCancelled: false,
    hasUpdate: false,
  },
  {
    id: 'tc-2',
    courseCode: 'CSC 403',
    courseName: 'Computer Networks',
    startTime: '12:00',
    endTime: '14:00',
    location: 'Lab 2',
    status: 'ongoing' as const,
    isCancelled: false,
    hasUpdate: true,
    timeChanged: true,
    originalStartTime: '11:00',
    originalEndTime: '13:00',
  },
  {
    id: 'tc-3',
    courseCode: 'CSC 407',
    courseName: 'Artificial Intelligence',
    startTime: '14:00',
    endTime: '16:00',
    location: 'LT 301',
    status: 'upcoming' as const,
    isCancelled: false,
    hasUpdate: false,
  },
  {
    id: 'tc-4',
    courseCode: 'CSC 411',
    courseName: 'Operations Research',
    startTime: '16:00',
    endTime: '18:00',
    location: 'LT 101',
    status: 'upcoming' as const,
    isCancelled: true,
    hasUpdate: false,
  },
]

export const DUMMY_ASSIGNMENTS = [
  {
    courseCode: 'CSC 401',
    assignmentCount: 3,
    submittedCount: 2,
    dates: [
      { id: 'a-1', label: 'Assignment 1', title: 'Lexical Analyzer Implementation', description: 'Implement a lexical analyzer for a simple programming language. The analyzer should tokenize input source code and produce a list of tokens.', submitted: true, dueDate: '2026-02-15', hasAttachment: false },
      { id: 'a-2', label: 'Assignment 2', title: 'Parser Design', description: 'Design and implement a recursive descent parser for the grammar provided in class. Include error recovery mechanisms.', submitted: true, dueDate: '2026-02-20', hasAttachment: true },
      { id: 'a-3', label: 'Assignment 3', title: 'Code Generation', description: 'Generate intermediate code (three-address code) from an AST. Implement optimizations for common subexpression elimination.', submitted: false, dueDate: '2026-03-01', hasAttachment: false },
    ],
  },
  {
    courseCode: 'CSC 403',
    assignmentCount: 2,
    submittedCount: 0,
    dates: [
      { id: 'a-4', label: 'Assignment 1', title: 'Network Protocols Analysis', description: 'Analyze TCP/IP protocol stack and write a detailed report on the handshake process, including diagrams.', submitted: false, dueDate: '2026-02-18', hasAttachment: false },
      { id: 'a-5', label: 'Assignment 2', title: 'Socket Programming', description: 'Implement a simple client-server chat application using TCP sockets in Python or Java.', submitted: false, dueDate: '2026-02-28', hasAttachment: true },
    ],
  },
  {
    courseCode: 'CSC 405',
    assignmentCount: 1,
    submittedCount: 1,
    dates: [
      { id: 'a-6', label: 'Assignment 1', title: 'Process Scheduling Simulation', description: 'Simulate FCFS, SJF, and Round Robin scheduling algorithms. Compare their performance with a report.', submitted: true, dueDate: '2026-02-10', hasAttachment: false },
    ],
  },
  {
    courseCode: 'CSC 407',
    assignmentCount: 2,
    submittedCount: 1,
    dates: [
      { id: 'a-7', label: 'Assignment 1', title: 'Search Algorithms', description: 'Implement BFS and DFS on a graph. Apply A* search to solve a pathfinding problem.', submitted: true, dueDate: '2026-02-12', hasAttachment: false },
      { id: 'a-8', label: 'Assignment 2', title: 'Neural Network Basics', description: 'Build a simple perceptron that can classify XOR problem. Document your approach and results.', submitted: false, dueDate: '2026-03-05', hasAttachment: false },
    ],
  },
]

export const DUMMY_ASSIGNMENT_STATS = {
  total: 8,
  submitted: 4,
  pending: 3,
  overdue: 1,
}

export const DUMMY_CLASSMATES = [
  { id: 'c-1', name: 'Daniel Okafor', isCourseRep: true, isConnected: true, avatarLetter: 'D' },
  { id: 'c-2', name: 'Amina Bello', isCourseRep: false, isConnected: true, avatarLetter: 'A' },
  { id: 'c-3', name: 'Chidi Nwosu', isCourseRep: false, isConnected: false, avatarLetter: 'C' },
  { id: 'c-4', name: 'Funke Adeyemi', isCourseRep: false, isConnected: true, avatarLetter: 'F' },
  { id: 'c-5', name: 'Emeka Ike', isCourseRep: false, isConnected: false, avatarLetter: 'E' },
  { id: 'c-6', name: 'Grace Obi', isCourseRep: true, isConnected: false, avatarLetter: 'G' },
  { id: 'c-7', name: 'Ibrahim Musa', isCourseRep: false, isConnected: true, avatarLetter: 'I' },
  { id: 'c-8', name: 'Joy Eze', isCourseRep: false, isConnected: false, avatarLetter: 'J' },
  { id: 'c-9', name: 'Kelechi Udo', isCourseRep: false, isConnected: true, avatarLetter: 'K' },
  { id: 'c-10', name: 'Lola Bankole', isCourseRep: false, isConnected: false, avatarLetter: 'L' },
]

export const DUMMY_NOTIFICATIONS = [
  { id: 'n-1', type: 'assignment', title: 'New Assignment', message: 'CSC 401 - Code Generation has been posted', isRead: false, createdAt: '2026-02-08T10:30:00Z', emoji: '📝' },
  { id: 'n-2', type: 'timetable', title: 'Class Rescheduled', message: 'CSC 403 class moved from 11:00 AM to 12:00 PM', isRead: false, createdAt: '2026-02-08T08:00:00Z', emoji: '📅' },
  { id: 'n-3', type: 'course', title: 'Course Outline Updated', message: 'CSC 407 Artificial Intelligence outline has been updated', isRead: true, createdAt: '2026-02-07T15:00:00Z', emoji: '📚' },
  { id: 'n-4', type: 'general', title: 'Welcome to Qitt!', message: 'Start by connecting with your course rep to get updates', isRead: true, createdAt: '2026-02-06T09:00:00Z', emoji: '🔔' },
  { id: 'n-5', type: 'announcement', title: 'Department Notice', message: 'Mid-semester test schedule will be released next week', isRead: true, createdAt: '2026-02-05T14:00:00Z', emoji: '📢' },
  { id: 'n-6', type: 'assignment', title: 'Assignment Due Soon', message: 'CSC 403 - Network Protocols Analysis is due in 2 days', isRead: false, createdAt: '2026-02-08T07:00:00Z', emoji: '📝' },
]

export const DUMMY_RESOURCES = [
  { id: 'r-1', title: 'CSC 401 Past Questions 2024', type: 'Past Questions', course: 'CSC 401', uploadedBy: 'Daniel Okafor', uploadDate: '2026-01-15', downloadCount: 45, fileSize: '2.3 MB' },
  { id: 'r-2', title: 'Computer Networks Notes', type: 'Lecture Notes', course: 'CSC 403', uploadedBy: 'Amina Bello', uploadDate: '2026-01-20', downloadCount: 32, fileSize: '5.1 MB' },
  { id: 'r-3', title: 'OS II Study Guide', type: 'Study Guides', course: 'CSC 405', uploadedBy: 'Chidi Nwosu', uploadDate: '2026-02-01', downloadCount: 28, fileSize: '1.8 MB' },
  { id: 'r-4', title: 'AI Assignment Solutions', type: 'Past Questions', course: 'CSC 407', uploadedBy: 'Grace Obi', uploadDate: '2026-02-03', downloadCount: 15, fileSize: '3.2 MB' },
  { id: 'r-5', title: 'SE II Project Template', type: 'Lecture Notes', course: 'CSC 409', uploadedBy: 'Funke Adeyemi', uploadDate: '2026-01-28', downloadCount: 22, fileSize: '0.5 MB' },
]

export const DUMMY_ANNOUNCEMENTS = [
  { id: 'ann-1', title: 'Mid-Semester Test Schedule', content: 'The mid-semester tests will commence from March 10th. Please check the department notice board for specific dates.', author: 'Daniel Okafor', time: '2 hours ago', createdAt: '2026-02-08T09:00:00Z', isAdmin: true, isPinned: true },
  { id: 'ann-2', title: 'Lab Equipment Setup', content: 'All students should ensure their lab computers are set up with the required software before next week.', author: 'Daniel Okafor', time: '1 day ago', createdAt: '2026-02-07T14:00:00Z', isAdmin: true, isPinned: false },
  { id: 'ann-3', title: 'Course Registration Deadline', content: 'Reminder: Course registration closes on February 28th. Please ensure all forms are submitted.', author: 'Grace Obi', time: '2 days ago', createdAt: '2026-02-06T11:00:00Z', isAdmin: false, isPinned: false },
]

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
export const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const

export const SCHOOLS = [
  'School of Science',
  'School of Engineering',
  'School of Management Sciences',
  'School of Humanities',
  'School of Social Sciences',
]

export const DEPARTMENTS: Record<string, string[]> = {
  'School of Science': ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
  'School of Engineering': ['Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
  'School of Management Sciences': ['Accounting', 'Business Administration', 'Finance'],
  'School of Humanities': ['English', 'History', 'Philosophy', 'Linguistics'],
  'School of Social Sciences': ['Economics', 'Political Science', 'Sociology', 'Psychology'],
}

export const LEVELS = ['100', '200', '300', '400', '500']
export const SEMESTERS = ['First Semester', 'Second Semester']
