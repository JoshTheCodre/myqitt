import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_USER, DUMMY_TODAYS_CLASSES, DUMMY_ASSIGNMENT_STATS } from '@/constants/dummyData'

const STATUS_COLORS = {
  upcoming: '#fbbf24',
  ongoing: '#10b981',
  completed: '#9ca3af',
  cancelled: '#ef4444',
} as const

export default function DashboardScreen() {
  const router = useRouter()
  const user = DUMMY_USER

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]}</Text>
            <Text style={styles.headerSubtitle}>{user.department} • {user.level} Level</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.supportBtn}>
              <Ionicons name="headset-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.avatarText}>{user.avatarInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCards}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.9}
            onPress={() => router.push('/courses')}
          >
            <View style={[styles.actionCardBg, { backgroundColor: 'rgba(10, 50, 248, 0.85)' }]}>
              <Ionicons name="book-outline" size={32} color={Colors.white} />
              <Text style={styles.actionCardTitle}>Courses</Text>
              <Text style={styles.actionCardSub}>8 courses this semester</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.9}
            onPress={() => router.push('/classmates' as never)}
          >
            <View style={[styles.actionCardBg, { backgroundColor: 'rgba(70, 210, 143, 0.85)' }]}>
              <Ionicons name="people-outline" size={32} color={Colors.white} />
              <Text style={styles.actionCardTitle}>Classmates</Text>
              <Text style={styles.actionCardSub}>10 in your class</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/notifications')}>
            <View style={[styles.quickLinkIcon, { backgroundColor: Colors.blue50 }]}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLinkText}>Notifications</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/resources')}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="folder-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.quickLinkText}>Resources</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/department')}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#faf5ff' }]}>
              <Ionicons name="megaphone-outline" size={20} color={Colors.purple} />
            </View>
            <Text style={styles.quickLinkText}>Department</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Classes</Text>
            <Text style={styles.sectionCount}>{DUMMY_TODAYS_CLASSES.length} classes</Text>
          </View>

          {DUMMY_TODAYS_CLASSES.map((cls) => (
            <View
              key={cls.id}
              style={[
                styles.classCard,
                { borderLeftColor: STATUS_COLORS[cls.status] },
                cls.isCancelled && styles.cancelledCard,
              ]}
            >
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[cls.status] + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[cls.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLORS[cls.status] }]}>
                  {cls.isCancelled ? 'Cancelled' : cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                </Text>
              </View>

              <View style={styles.classInfo}>
                <View style={styles.classMain}>
                  <Text style={[styles.courseCode, cls.isCancelled && styles.cancelledText]}>
                    {cls.courseCode}
                  </Text>
                  <Text style={[styles.courseName, cls.isCancelled && styles.cancelledText]}>
                    {cls.courseName}
                  </Text>
                </View>
                <View style={styles.classMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {cls.startTime} - {cls.endTime}
                    </Text>
                  </View>
                  <View style={styles.locationPill}>
                    <Ionicons name="location-outline" size={12} color={Colors.primary} />
                    <Text style={styles.locationText}>{cls.location}</Text>
                  </View>
                </View>
              </View>

              {/* Change badges */}
              {cls.timeChanged && (
                <View style={styles.changeBadge}>
                  <Ionicons name="time" size={12} color={Colors.warningDark} />
                  <Text style={styles.changeBadgeText}>Time changed</Text>
                </View>
              )}
            </View>
          ))}
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  supportBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  actionCards: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  actionCardBg: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'flex-end',
  },
  actionCardTitle: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  actionCardSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  quickLinks: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  quickLink: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    position: 'relative',
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  classCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelledCard: {
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  classInfo: {
    gap: Spacing.sm,
  },
  classMain: {
    gap: 2,
  },
  courseCode: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  courseName: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  cancelledText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8ECFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  locationText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  changeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.warningDark,
  },
})
