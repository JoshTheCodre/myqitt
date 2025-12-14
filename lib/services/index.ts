// Re-export all services for easy importing
export { AssignmentService } from './assignmentService'
export { TimetableService } from './timetableService'
export { ClassmateService } from './classmateService'
export { ProfileService } from './profileService'
export { ConnectionService } from './connectionService'
export { TodaysClassService } from './todaysClassService'
export { NotificationService } from './notificationService'

// Re-export types
export type {
  Assignment,
  AssignmentDate,
  CreateAssignmentData
} from './assignmentService'

export type {
  TimetableEntry,
  CreateTimetableData,
  DaySchedule
} from './timetableService'

export type {
  Classmate,
  Connection
} from './classmateService'

export type {
  School,
  Department,
  UserProfile
} from './profileService'

export type {
  ConnectionType,
  ConnectionDetails,
  ExistingConnections
} from './connectionService'

export type {
  TodaysClass,
  MergedClass
} from './todaysClassService'

export type {
  NotificationPayload,
  NotificationPreferences,
  NotificationRecord
} from './notificationService'
