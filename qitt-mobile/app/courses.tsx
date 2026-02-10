import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_COURSES, DUMMY_CARRYOVER_COURSES, DUMMY_USER } from '@/constants/dummyData'

export default function CoursesScreen() {
  const router = useRouter()
  const [showCarryoverModal, setShowCarryoverModal] = useState(false)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>My Courses</Text>
          <Text style={styles.subtitle}>{DUMMY_USER.level} Level • {DUMMY_USER.semester}</Text>
        </View>
        <TouchableOpacity
          style={styles.carryoverBtn}
          onPress={() => setShowCarryoverModal(true)}
        >
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.carryoverBtnText}>Carryover</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compulsory Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compulsory Courses</Text>
          {DUMMY_COURSES.compulsory.map((course) => (
            <TouchableOpacity
              key={course.courseCode}
              style={styles.courseCard}
              onPress={() => router.push(`/course/${course.courseCode.replace(' ', '')}`)}
            >
              <View style={styles.courseLeft}>
                <View style={styles.courseIconBg}>
                  <Ionicons name="book" size={18} color={Colors.primary} />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseCode}>{course.courseCode}</Text>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.courseTitle}</Text>
                </View>
              </View>
              <View style={styles.courseRight}>
                <View style={styles.unitBadge}>
                  <Text style={styles.unitText}>{course.courseUnit}u</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Elective Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elective Courses</Text>
          {DUMMY_COURSES.elective.map((course) => (
            <TouchableOpacity
              key={course.courseCode}
              style={styles.courseCard}
              onPress={() => router.push(`/course/${course.courseCode.replace(' ', '')}`)}
            >
              <View style={styles.courseLeft}>
                <View style={[styles.courseIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="book-outline" size={18} color={Colors.success} />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseCode}>{course.courseCode}</Text>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.courseTitle}</Text>
                </View>
              </View>
              <View style={styles.courseRight}>
                <View style={[styles.unitBadge, { backgroundColor: '#f0fdf4' }]}>
                  <Text style={[styles.unitText, { color: Colors.success }]}>{course.courseUnit}u</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Carryover Section */}
        {DUMMY_CARRYOVER_COURSES.length > 0 && (
          <View style={styles.section}>
            <View style={styles.carryoverHeader}>
              <View style={styles.carryoverIconBg}>
                <Ionicons name="reload" size={18} color={Colors.orange} />
              </View>
              <Text style={styles.carryoverTitle}>Carryover Courses</Text>
              <View style={styles.carryoverBadge}>
                <Text style={styles.carryoverBadgeText}>CARRYOVER</Text>
              </View>
            </View>
            {DUMMY_CARRYOVER_COURSES.map((course) => (
              <View
                key={course.id}
                style={[styles.courseCard, styles.carryoverCard]}
              >
                <View style={styles.courseLeft}>
                  <View style={[styles.courseIconBg, { backgroundColor: Colors.orangeLight }]}>
                    <Ionicons name="reload" size={18} color={Colors.orange} />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseCode}>{course.courseCode}</Text>
                    <Text style={styles.courseTitle} numberOfLines={1}>{course.courseTitle}</Text>
                  </View>
                </View>
                <View style={styles.courseRight}>
                  {course.isCompleted ? (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text style={styles.completedText}>Done</Text>
                    </View>
                  ) : (
                    <View style={[styles.unitBadge, { backgroundColor: Colors.orangeLight }]}>
                      <Text style={[styles.unitText, { color: Colors.orange }]}>{course.courseUnit}u</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Total Credits */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Credit Units</Text>
          <Text style={styles.totalValue}>
            {DUMMY_COURSES.compulsory.reduce((s, c) => s + c.courseUnit, 0) +
             DUMMY_COURSES.elective.reduce((s, c) => s + c.courseUnit, 0)}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  carryoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  carryoverBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  courseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  courseIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  courseTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  courseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  unitBadge: {
    backgroundColor: Colors.blue50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  unitText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  carryoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  carryoverIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carryoverTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  carryoverBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  carryoverBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#9a3412',
  },
  carryoverCard: {
    borderColor: '#fed7aa',
    backgroundColor: Colors.orangeLight,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.success,
  },
  totalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
})
