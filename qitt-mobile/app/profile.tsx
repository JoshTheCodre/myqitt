import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { DUMMY_USER } from '@/constants/dummyData'

export default function ProfileScreen() {
  const router = useRouter()
  const user = DUMMY_USER

  const profileItems = [
    { icon: 'mail-outline' as const, label: 'Email', value: 'joshuaeze@uni.edu.ng' },
    { icon: 'call-outline' as const, label: 'Phone', value: '+234 812 345 6789' },
    { icon: 'school-outline' as const, label: 'School', value: 'School of Science' },
    { icon: 'business-outline' as const, label: 'Department', value: user.department },
    { icon: 'layers-outline' as const, label: 'Level', value: `${user.level}L` },
    { icon: 'calendar-outline' as const, label: 'Semester', value: user.semester },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Edit Profile', 'Edit profile modal would open here')}
          style={styles.editBtn}
        >
          <Ionicons name="create-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Profile Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroGradient}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.split(' ').map(n => n[0]).join('')}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroSub}>{user.department} • {user.level}L</Text>
          {user.isCourseRep && (
            <View style={styles.repBadge}>
              <Ionicons name="star" size={12} color="#d97706" />
              <Text style={styles.repBadgeText}>Course Representative</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Bio section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <View style={styles.card}>
            <Text style={styles.bioText}>
              Computer Science student passionate about mobile development and AI. Always looking for new ways to learn and grow! 🚀
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            {profileItems.map((item, index) => (
              <View key={index} style={[styles.infoRow, index < profileItems.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoLeft}>
                  <View style={styles.infoIcon}>
                    <Ionicons name={item.icon} size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                </View>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.notifRow}>
              <View style={styles.notifLeft}>
                <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.notifLabel}>Push Notifications</Text>
              </View>
              <View style={styles.enabledBadge}>
                <Text style={styles.enabledText}>Enabled</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert('Sign Out', 'You would be signed out here')
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  editBtn: {
    padding: Spacing.xs,
  },
  heroSection: {
    overflow: 'hidden',
  },
  heroGradient: {
    backgroundColor: Colors.primary,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.sm,
    alignItems: 'center',
    position: 'relative',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarWrap: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.white,
  },
  heroName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: Spacing.md,
  },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  repBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#fbbf24',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  bioText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: '50%',
    textAlign: 'right',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  notifLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  enabledBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  enabledText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.danger,
  },
})
