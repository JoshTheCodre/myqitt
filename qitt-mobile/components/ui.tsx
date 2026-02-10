import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  noPadding?: boolean
}

export function Card({ children, style, noPadding }: CardProps) {
  return (
    <View style={[styles.card, noPadding ? {} : styles.padding, style]}>
      {children}
    </View>
  )
}

interface PillBadgeProps {
  text: string
  color?: string
  bgColor?: string
  style?: ViewStyle
  textStyle?: TextStyle
  size?: 'sm' | 'md'
}

export function PillBadge({ text, color = Colors.primary, bgColor = Colors.blue50, style, textStyle, size = 'sm' }: PillBadgeProps) {
  return (
    <View style={[
      styles.pill,
      { backgroundColor: bgColor },
      size === 'md' && styles.pillMd,
      style,
    ]}>
      <Text style={[
        styles.pillText,
        { color },
        size === 'md' && styles.pillTextMd,
        textStyle,
      ]}>
        {text}
      </Text>
    </View>
  )
}

interface EmptyStateProps {
  icon: string
  title: string
  subtitle?: string
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  )
}

interface StatItemProps {
  value: number | string
  label: string
  icon: string
  color?: string
}

export function StatItem({ value, label, icon, color = Colors.textSecondary }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  padding: {
    padding: Spacing.lg,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  pillMd: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pillTextMd: {
    fontSize: FontSize.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
})
