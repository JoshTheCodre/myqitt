import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_COURSES, DUMMY_ASSIGNMENTS, DUMMY_TIMETABLE } from '@/constants/dummyData'

export default function CourseDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()

  // Find course
  const allCourses = [...DUMMY_COURSES.compulsory, ...DUMMY_COURSES.elective]
  const course = allCourses.find(c => c.courseCode.replace(' ', '') === code) || allCourses[0]
  const assignmentGroup = DUMMY_ASSIGNMENTS.find(g => g.courseCode === course.courseCode)
  const assignmentCount = assignmentGroup?.assignmentCount || 0

  // Find timetable entries for this course
  const scheduleEntries: { day: string; time: string; location: string }[] = []
  for (const [day, entries] of Object.entries(DUMMY_TIMETABLE)) {
    for (const entry of entries) {
      if (entry.courseCode === course.courseCode) {
        scheduleEntries.push({ day, time: entry.time, location: entry.location })
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtnHero} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroCourseCode}>{course.courseCode}</Text>
            <Text style={styles.heroTitle}>{course.courseTitle}</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroBadgeText}>{course.courseUnit} Credit Units</Text>
            </View>
          </View>
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.blue50 }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statCardValue}>{scheduleEntries.length}</Text>
              <Text style={styles.statCardLabel}>Sessions/week</Text>
            </View>
            <TouchableOpacity style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.blue50 }]}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statCardValue}>{assignmentCount}</Text>
              <Text style={styles.statCardLabel}>Assignments</Text>
            </TouchableOpacity>
          </View>

          {/* Course Outline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Course Outline</Text>
              <TouchableOpacity style={styles.editOutlineBtn}>
                <Ionicons name="create-outline" size={16} color={Colors.primary} />
                <Text style={styles.editOutlineBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.outlineCard}>
              <Text style={styles.outlineText}>
                This course covers the fundamental concepts of {course.courseTitle.toLowerCase()}.
                Topics include theoretical foundations, practical applications, and modern approaches to problem-solving in this domain.
                {'\n\n'}
                <Text style={{ fontWeight: '700' }}>Topics covered:</Text>
                {'\n'}• Introduction and fundamentals
                {'\n'}• Core concepts and theory
                {'\n'}• Practical applications
                {'\n'}• Advanced topics
                {'\n'}• Case studies and projects
              </Text>
            </View>
          </View>

          {/* Weekly Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Schedule</Text>
            {scheduleEntries.length > 0 ? (
              scheduleEntries.map((entry, idx) => (
                <View key={idx} style={styles.scheduleEntry}>
                  <View style={styles.scheduleDay}>
                    <Ionicons name="calendar" size={16} color={Colors.primary} />
                    <Text style={styles.scheduleDayText}>{entry.day}</Text>
                  </View>
                  <View style={styles.scheduleDetails}>
                    <View style={styles.scheduleDetailRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.scheduleDetailText}>{entry.time}</Text>
                    </View>
                    <View style={styles.scheduleDetailRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.scheduleDetailText}>{entry.location}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptySchedule}>
                <Text style={styles.emptyScheduleText}>No scheduled sessions</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  backBtnHero: {
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  heroContent: {
    zIndex: 1,
  },
  heroCourseCode: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.white,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    right: 60,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
    marginTop: -Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  statCardLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  editOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.blue50,
    borderRadius: BorderRadius.full,
  },
  editOutlineBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  outlineCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  outlineText: {
    fontSize: FontSize.md,
    color: Colors.gray700,
    lineHeight: 22,
  },
  scheduleEntry: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  scheduleDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  scheduleDayText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  scheduleDetails: {
    gap: Spacing.sm,
    paddingLeft: Spacing.xxl,
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scheduleDetailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptySchedule: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyScheduleText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
})
