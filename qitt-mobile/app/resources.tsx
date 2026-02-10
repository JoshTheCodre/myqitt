import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_RESOURCES, DUMMY_COURSES } from '@/constants/dummyData'

const RESOURCE_SECTIONS = [
  { title: 'Past Questions', emoji: '📝', color: Colors.primary },
  { title: 'Lecture Notes', emoji: '📚', color: Colors.emerald },
  { title: 'Study Guides', emoji: '📖', color: Colors.purple },
]

export default function ResourcesScreen() {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

  const courseTabs = [
    { code: 'all', title: 'All Courses' },
    ...DUMMY_COURSES.compulsory.slice(0, 5).map(c => ({ code: c.courseCode, title: c.courseCode })),
  ]

  const filteredResources = selectedCourse === 'all'
    ? DUMMY_RESOURCES
    : DUMMY_RESOURCES.filter(r => r.course === selectedCourse)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>Study materials & past questions</Text>
        </View>
      </View>

      {/* Course Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}
      >
        {courseTabs.map(tab => (
          <TouchableOpacity
            key={tab.code}
            style={[styles.courseTab, selectedCourse === tab.code && styles.courseTabActive]}
            onPress={() => setSelectedCourse(tab.code)}
          >
            <Text style={[styles.courseTabText, selectedCourse === tab.code && styles.courseTabTextActive]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* For You Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="sparkles" size={24} color="#f59e0b" />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Resources for You ✨</Text>
            <Text style={styles.bannerSub}>Based on your courses and study patterns</Text>
          </View>
        </View>

        {/* Resource Sections */}
        {RESOURCE_SECTIONS.map((section, sIndex) => {
          const sectionResources = filteredResources.filter(
            (_, i) => i % RESOURCE_SECTIONS.length === sIndex
          )

          if (sectionResources.length === 0) return null

          return (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>{section.emoji}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={[styles.sectionCount, { backgroundColor: `${section.color}15` }]}>
                  <Text style={[styles.sectionCountText, { color: section.color }]}>
                    {sectionResources.length}
                  </Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCards}
              >
                {sectionResources.map(resource => (
                  <TouchableOpacity key={resource.id} style={styles.resourceCard} activeOpacity={0.7}>
                    <View style={[styles.resourceAccent, { backgroundColor: section.color }]} />
                    <View style={styles.resourceBody}>
                      <View style={styles.resourceCourseRow}>
                        <View style={styles.courseCodePill}>
                        <Text style={styles.courseCodePillText}>{resource.course}</Text>
                      </View>
                      <Text style={styles.resourceType}>{resource.type}</Text>
                      </View>
                      <Text style={styles.resourceTitle} numberOfLines={2}>{resource.title}</Text>
                      <View style={styles.resourceMeta}>
                        <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
                        <Text style={styles.resourceMetaText}>{resource.uploadedBy}</Text>
                      </View>
                      <View style={styles.resourceMeta}>
                        <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                        <Text style={styles.resourceMetaText}>{resource.uploadDate}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        })}

        {/* All resources flat list for remaining */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>📂</Text>
            <Text style={styles.sectionTitle}>All Resources</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{filteredResources.length}</Text>
            </View>
          </View>
          {filteredResources.map(resource => (
            <TouchableOpacity key={resource.id} style={styles.listCard} activeOpacity={0.7}>
              <View style={styles.listIconWrap}>
                <Ionicons
                  name={
                    resource.type === 'PDF' ? 'document-text' :
                    resource.type === 'DOC' ? 'document' : 'image'
                  }
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle} numberOfLines={1}>{resource.title}</Text>
                <Text style={styles.listSub}>{resource.course} • {resource.type} • {resource.uploadDate}</Text>
              </View>
              <Ionicons name="download-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tabsScroll: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  courseTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
  },
  courseTabActive: {
    backgroundColor: Colors.primary,
  },
  courseTabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  courseTabTextActive: {
    color: Colors.white,
  },
  body: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#fffbeb',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#92400e',
  },
  bannerSub: {
    fontSize: FontSize.sm,
    color: '#b45309',
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  sectionCount: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionCountText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  horizontalCards: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  resourceCard: {
    width: 240,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  resourceAccent: {
    height: 4,
    width: '100%',
  },
  resourceBody: {
    padding: Spacing.lg,
    gap: 8,
  },
  resourceCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseCodePill: {
    backgroundColor: Colors.blue50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  courseCodePillText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  resourceType: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  resourceTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  listIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  listSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
})
