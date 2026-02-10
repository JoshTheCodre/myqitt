import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_COURSES } from '@/constants/dummyData'

export default function AddAssignmentScreen() {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showCoursePicker, setShowCoursePicker] = useState(false)

  const allCourses = [...DUMMY_COURSES.compulsory, ...DUMMY_COURSES.elective]

  const handleSave = () => {
    Alert.alert('Saved!', 'Assignment created successfully (dummy)', [
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
        <Text style={styles.headerTitle}>Add Assignment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Course Selector */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="book-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.label}>Course</Text>
          </View>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowCoursePicker(!showCoursePicker)}
          >
            <Text style={[styles.selectText, !selectedCourse && styles.placeholder]}>
              {selectedCourse || 'Select a course'}
            </Text>
            <Ionicons name={showCoursePicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.gray400} />
          </TouchableOpacity>
          {showCoursePicker && (
            <View style={styles.pickerDropdown}>
              {allCourses.map(course => (
                <TouchableOpacity
                  key={course.courseCode}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCourse(course.courseCode)
                    setShowCoursePicker(false)
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedCourse === course.courseCode && styles.pickerItemSelected,
                  ]}>
                    {course.courseCode} - {course.courseTitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="text-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.label}>Title</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Assignment title"
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Due Date */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.label}>Due Date</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textTertiary}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.label}>Description</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe the assignment..."
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            numberOfLines={8}
          />
        </View>

        {/* Attachment */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Ionicons name="attach-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.label}>Attachments</Text>
          </View>
          <TouchableOpacity style={styles.uploadZone}>
            <Ionicons name="cloud-upload-outline" size={32} color={Colors.gray400} />
            <Text style={styles.uploadText}>Tap to upload files</Text>
            <Text style={styles.uploadSubtext}>Images & PDFs, max 5MB each</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
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
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.gray700,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  textarea: {
    height: 160,
    paddingTop: Spacing.md,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  selectText: {
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    marginTop: Spacing.sm,
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  pickerItemSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gray50,
  },
  uploadText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  uploadSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
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
