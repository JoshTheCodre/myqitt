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
import { DUMMY_TIMETABLE, DAY_NAMES, DAY_SHORT, DUMMY_USER } from '@/constants/dummyData'

export default function TimetableScreen() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay()
    // Map 0=Sun..6=Sat to Mon(0)..Fri(4)
    return today >= 1 && today <= 5 ? today - 1 : 0
  })
  const [showFreeTime, setShowFreeTime] = useState(false)

  const dayName = DAY_NAMES[selectedDay]
  const classes = DUMMY_TIMETABLE[dayName] || []

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Timetable</Text>
            <View style={styles.lastUpdated}>
              <Ionicons name="time-outline" size={12} color={Colors.primary} />
              <Text style={styles.lastUpdatedText}>Last updated: Feb 5, 2026</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.freeTimeBtn, showFreeTime && styles.freeTimeBtnActive]}
              onPress={() => setShowFreeTime(!showFreeTime)}
            >
              <Ionicons name="hourglass-outline" size={16} color={showFreeTime ? Colors.white : Colors.purple} />
              <Text style={[styles.freeTimeBtnText, showFreeTime && styles.freeTimeBtnTextActive]}>Free Time</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            {DUMMY_USER.isCourseRep && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/timetable/add')}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Day Selector */}
        <View style={styles.daySelector}>
          {DAY_SHORT.map((day, idx) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, selectedDay === idx && styles.dayBtnActive]}
              onPress={() => setSelectedDay(idx)}
            >
              <Text style={[styles.dayBtnText, selectedDay === idx && styles.dayBtnTextActive]}>
                {day}
              </Text>
              {(DUMMY_TIMETABLE[DAY_NAMES[idx]]?.length || 0) > 0 && (
                <View style={[styles.dayDot, selectedDay === idx && styles.dayDotActive]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Class List */}
      <ScrollView
        contentContainerStyle={styles.classList}
        showsVerticalScrollIndicator={false}
      >
        {classes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>No classes!</Text>
            <Text style={styles.emptySubtitle}>Enjoy your free day</Text>
          </View>
        ) : (
          classes.map((cls) => (
            <View key={cls.id} style={styles.classCard}>
              <View style={styles.classCardContent}>
                <View style={styles.classLeft}>
                  <Text style={styles.classTitle}>{cls.title}</Text>
                  <Text style={styles.classCourseCode}>{cls.courseCode}</Text>
                </View>
                <Text style={styles.classTime}>{cls.time}</Text>
              </View>
              <View style={styles.classLocationRow}>
                <View style={styles.locationPill}>
                  <Ionicons name="location-outline" size={12} color={Colors.primary} />
                  <Text style={styles.locationText}>{cls.location}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {showFreeTime && classes.length > 0 && (
          <View style={styles.freeTimeCard}>
            <Text style={styles.freeTimeIcon}>⏰</Text>
            <Text style={styles.freeTimeTitle}>Free Periods</Text>
            <Text style={styles.freeTimeSubtitle}>
              You have {5 - classes.length} free period{5 - classes.length !== 1 ? 's' : ''} today
            </Text>
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
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.blue50,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  lastUpdatedText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  freeTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleLight,
  },
  freeTimeBtnActive: {
    backgroundColor: Colors.purple,
  },
  freeTimeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.purple,
  },
  freeTimeBtnTextActive: {
    color: Colors.white,
  },
  shareBtn: {
    padding: Spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  daySelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    gap: 4,
  },
  dayBtnActive: {
    backgroundColor: Colors.primary,
  },
  dayBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.gray700,
  },
  dayBtnTextActive: {
    color: Colors.white,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  dayDotActive: {
    backgroundColor: Colors.white,
  },
  classList: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  classCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classLeft: {
    flex: 1,
  },
  classTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  classCourseCode: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  classTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  classLocationRow: {
    marginTop: Spacing.md,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8ECFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  freeTimeCard: {
    backgroundColor: Colors.purpleLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.purple + '40',
  },
  freeTimeIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  freeTimeTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.purple,
  },
  freeTimeSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.purple,
    marginTop: 4,
    opacity: 0.8,
  },
})
