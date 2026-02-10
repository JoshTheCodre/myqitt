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
import { DUMMY_ASSIGNMENTS, DUMMY_USER } from '@/constants/dummyData'

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  // Find the assignment from dummy data
  const allAssignments = DUMMY_ASSIGNMENTS.flatMap(g =>
    g.dates.map(d => ({ ...d, courseCode: g.courseCode }))
  )
  const assignment = allAssignments.find(a => a.id === id) || allAssignments[0]

  const [submitted, setSubmitted] = useState(assignment.submitted)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.courseCodePill}>
            <Text style={styles.courseCodePillText}>{assignment.courseCode}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="copy-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{assignment.title}</Text>

        {/* Submission Status Card */}
        <View style={[
          styles.statusCard,
          submitted ? styles.statusCardSubmitted : styles.statusCardPending,
        ]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusIconCircle, submitted && styles.statusIconCircleGreen]}>
              <Ionicons
                name={submitted ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={submitted ? Colors.success : Colors.gray400}
              />
            </View>
            <View>
              <Text style={[styles.statusTitle, submitted && styles.statusTitleGreen]}>
                {submitted ? 'Submitted' : 'Not Submitted'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {submitted ? 'Great work! You\'re done.' : 'Tap the button to mark as done'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, submitted ? styles.toggleBtnSubmitted : styles.toggleBtnPending]}
            onPress={() => setSubmitted(!submitted)}
          >
            <Text style={[styles.toggleBtnText, submitted && styles.toggleBtnTextSubmitted]}>
              {submitted ? 'Undo' : 'Mark Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Due Date Card */}
        <View style={styles.dueDateCard}>
          <View style={styles.dueDateLeft}>
            <View style={styles.dueDateIcon}>
              <Text style={styles.dueDateEmoji}>📅</Text>
            </View>
            <View>
              <Text style={styles.dueDateLabel}>DUE DATE</Text>
              <Text style={styles.dueDateValue}>
                {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.descriptionCard}>
          <View style={styles.descriptionHeader}>
            <View style={styles.descriptionIcon}>
              <Text style={styles.descriptionEmoji}>📝</Text>
            </View>
            <Text style={styles.descriptionLabel}>DESCRIPTION</Text>
          </View>
          <Text style={styles.descriptionText}>{assignment.description}</Text>
        </View>

        {/* Attachment indicator */}
        {assignment.hasAttachment && (
          <View style={styles.attachmentCard}>
            <Ionicons name="attach" size={20} color={Colors.primary} />
            <Text style={styles.attachmentText}>1 attachment</Text>
            <TouchableOpacity style={styles.attachmentBtn}>
              <Text style={styles.attachmentBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons (Course Rep) */}
        {DUMMY_USER.isCourseRep && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="create-outline" size={18} color={Colors.white} />
              <Text style={styles.editBtnText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => Alert.alert('Delete', 'Delete this assignment?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' },
              ])}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  courseCodePill: {
    backgroundColor: Colors.blue100,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  courseCodePillText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  title: {
    fontSize: FontSize.display,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xl,
    lineHeight: 34,
  },
  statusCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statusCardSubmitted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusCardPending: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconCircleGreen: {
    backgroundColor: Colors.successLight,
  },
  statusTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  statusTitleGreen: {
    color: Colors.successDark,
  },
  statusSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  toggleBtnPending: {
    backgroundColor: Colors.success,
  },
  toggleBtnSubmitted: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  toggleBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  toggleBtnTextSubmitted: {
    color: Colors.success,
  },
  dueDateCard: {
    backgroundColor: '#fef2f2',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#fecaca',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  dueDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dueDateIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueDateEmoji: {
    fontSize: 24,
  },
  dueDateLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dueDateValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.dangerDark,
  },
  descriptionCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  descriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionEmoji: {
    fontSize: 24,
  },
  descriptionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: FontSize.lg,
    color: Colors.gray700,
    lineHeight: 26,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue50,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  attachmentText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  attachmentBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  attachmentBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  editBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.dangerLight,
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
})
