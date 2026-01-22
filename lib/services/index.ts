// Re-export all services for easy importing
export { AssignmentService } from './assignmentService'
export { TimetableService } from './timetableService'
export { ClassmateService } from './classmateService'
export { ProfileService } from './profileService'
export { TodaysClassService } from './todaysClassService'
export { CatchUpService } from './catchUpService'
export { CourseService } from './courseService'
// export { NotificationService } from './notificationService' // DISABLED: Service worker related

// Re-export types
export type {
  Assignment,
  AssignmentDate,
  GroupedAssignment,
  CreateAssignmentData,
  AssignmentStats
} from './assignmentService'

export type {
  TimetableEntry,
  Timetable,
  CreateTimetableEntryData,
  DaySchedule,
  UserClassGroupInfo
} from './timetableService'

export type {
  Classmate
} from './classmateService'

export type {
  School,
  Faculty,
  Department,
  Level,
  Session,
  Semester
} from './profileService'

export type {
  TodaysClass,
  MergedClass
} from './todaysClassService'

export type {
  CatchUpItem
} from './catchUpService'

export type {
  Course,
  CourseItem,
  GroupedCourses
} from './courseService'

// export type {
//   NotificationPayload
// } from './notificationService' // DISABLED: Service worker related
