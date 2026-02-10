import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_COURSES, DAY_NAMES, DAY_SHORT, DUMMY_TIMETABLE } from '@/constants/dummyData'

interface ClassEntry {
  id: string
  startTime: string
  endTime: string
  course: string
  venue: string
}

export default function AddTimetableScreen() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState(0)
  const allCourses = [...DUMMY_COURSES.compulsory, ...DUMMY_COURSES.elective]

  const dayName = DAY_NAMES[selectedDay]
  const existingClasses = DUMMY_TIMETABLE[dayName] || []

  const [entries, setEntries] = useState<ClassEntry[]>(
    existingClasses.map(c => ({
      id: c.id,
      startTime: c.startTime,
      endTime: c.endTime,
      course: c.courseCode,
      venue: c.location,
    }))
  )

  const addEntry = () => {
    setEntries([...entries, {
      id: `new-${Date.now()}`,
      startTime: '',
      endTime: '',
      course: '',
      venue: '',
    }])
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id))
  }

  const handleSave = () => {
    Alert.alert('Saved!', 'Timetable updated successfully (dummy)', [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add/Update Classes</Text>
        <TouchableOpacity style={styles.venueBtn}>
          <Ionicons name="location-outline" size={16} color={Colors.success} />
          <Text style={styles.venueBtnText}>Venues</Text>
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {DAY_SHORT.map((day, idx) => {
          const count = DUMMY_TIMETABLE[DAY_NAMES[idx]]?.length || 0
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, selectedDay === idx && styles.dayBtnActive]}
              onPress={() => {
                setSelectedDay(idx)
                const dayClasses = DUMMY_TIMETABLE[DAY_NAMES[idx]] || []
                setEntries(dayClasses.map(c => ({
                  id: c.id,
                  startTime: c.startTime,
                  endTime: c.endTime,
                  course: c.courseCode,
                  venue: c.location,
                })))
              }}
            >
              <Text style={[styles.dayBtnText, selectedDay === idx && styles.dayBtnTextActive]}>{day}</Text>
              {count > 0 && (
                <View style={[styles.dayBadge, selectedDay === idx && styles.dayBadgeActive]}>
                  <Text style={[styles.dayBadgeText, selectedDay === idx && styles.dayBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.map((entry, index) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryNumber}>Class {index + 1}</Text>
              <TouchableOpacity onPress={() => removeEntry(entry.id)}>
                <Ionicons name="close-circle" size={24} color={Colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Time Row */}
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="08:00"
                  placeholderTextColor={Colors.textTertiary}
                  value={entry.startTime}
                  onChangeText={(val) => {
                    const newEntries = [...entries]
                    newEntries[index].startTime = val
                    setEntries(newEntries)
                  }}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="10:00"
                  placeholderTextColor={Colors.textTertiary}
                  value={entry.endTime}
                  onChangeText={(val) => {
                    const newEntries = [...entries]
                    newEntries[index].endTime = val
                    setEntries(newEntries)
                  }}
                />
              </View>
            </View>

            {/* Course & Venue Row */}
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Course</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="CSC 401"
                  placeholderTextColor={Colors.textTertiary}
                  value={entry.course}
                  onChangeText={(val) => {
                    const newEntries = [...entries]
                    newEntries[index].course = val
                    setEntries(newEntries)
                  }}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Venue</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="LT 301"
                  placeholderTextColor={Colors.textTertiary}
                  value={entry.venue}
                  onChangeText={(val) => {
                    const newEntries = [...entries]
                    newEntries[index].venue = val
                    setEntries(newEntries)
                  }}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Add Button */}
        <TouchableOpacity style={styles.addEntryBtn} onPress={addEntry}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addEntryBtnText}>Add Class</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  venueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  venueBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  daySelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
  dayBadge: {
    backgroundColor: Colors.blue50,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  dayBadgeTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  entryNumber: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.blue50,
  },
  addEntryBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    backgroundColor: Colors.danger,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
})
