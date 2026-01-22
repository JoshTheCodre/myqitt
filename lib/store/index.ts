// Export all stores
export * from './auth'
export * from './assignment'
export * from './timetable'
export * from './course'
export * from './classmate'
// Export profile store but not types that conflict with auth
export { useProfileStore, useUserProfile, useInviteCode, useSchools } from './profile'
export type { School, Faculty, Department, Level, Session, Semester } from './profile'
