import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_ASSIGNMENTS, DUMMY_ASSIGNMENT_STATS, DUMMY_USER } from '@/constants/dummyData'
import { Card, PillBadge } from '@/components/ui'

export default function AssignmentsScreen() {
  const router = useRouter()
  const stats = DUMMY_ASSIGNMENT_STATS

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Assignments</Text>
          <PillBadge
            text={`${stats.pending} pending`}
            color={Colors.primary}
            bgColor={Colors.blue50}
          />
        </View>
        {DUMMY_USER.isCourseRep && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/assignment/add')}
          >
            <Ionicons name="add" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.submitted}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⏰</Text>
            <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
        </View>

        {/* Assignment Groups */}
        {DUMMY_ASSIGNMENTS.map((group) => {
          const progress = group.assignmentCount > 0
            ? (group.submittedCount / group.assignmentCount) * 100
            : 0
          const hasNew = group.dates.some(d => !d.submitted)

          return (
            <TouchableOpacity
              key={group.courseCode}
              style={styles.assignmentCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/assignment/${group.dates[0].id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardCourseCode}>{group.courseCode}</Text>
                  <Text style={styles.cardAssignmentCount}>
                    {group.assignmentCount} assignment{group.assignmentCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                {hasNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {group.submittedCount}/{group.assignmentCount} done
                </Text>
              </View>

              {/* Due Dates */}
              <View style={styles.dueDates}>
                {group.dates.map((date) => (
                  <View
                    key={date.id}
                    style={[
                      styles.dueDatePill,
                      date.submitted ? styles.dueDateSubmitted : styles.dueDatePending,
                    ]}
                  >
                    <Ionicons
                      name={date.submitted ? 'checkmark-circle' : 'calendar-outline'}
                      size={12}
                      color={date.submitted ? Colors.success : Colors.primary}
                    />
                    <Text style={[
                      styles.dueDateText,
                      { color: date.submitted ? Colors.success : Colors.primary },
                    ]}>
                      {new Date(date.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )
        })}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.blue200,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    gap: 2,
  },
  cardCourseCode: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardAssignmentCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  newBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dueDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dueDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dueDatePending: {
    backgroundColor: Colors.blue50,
  },
  dueDateSubmitted: {
    backgroundColor: Colors.successLight,
  },
  dueDateText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
})
