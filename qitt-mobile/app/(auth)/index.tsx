import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme'
import { SCHOOLS, DEPARTMENTS, LEVELS, SEMESTERS } from '@/constants/dummyData'
import { SafeAreaView } from 'react-native-safe-area-context'

type Tab = 'signin' | 'signup'

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('signin')
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>Q</Text>
            </View>
            <Text style={styles.appName}>Qitt</Text>
            <Text style={styles.tagline}>Your academic companion</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
              onPress={() => setActiveTab('signin')}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Forms */}
          {activeTab === 'signin' ? (
            <SignInForm onSuccess={() => router.replace('/(tabs)')} />
          ) : (
            <SignUpForm onSuccess={() => router.replace('/(tabs)')} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setKeepSignedIn(!keepSignedIn)}
      >
        <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>
          {keepSignedIn && <Ionicons name="checkmark" size={14} color={Colors.white} />}
        </View>
        <Text style={styles.checkboxLabel}>Keep me signed in</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={onSuccess} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  )
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Dropdown states
  const [showSchoolPicker, setShowSchoolPicker] = useState(false)
  const [showDeptPicker, setShowDeptPicker] = useState(false)
  const [showLevelPicker, setShowLevelPicker] = useState(false)
  const [showSemesterPicker, setShowSemesterPicker] = useState(false)

  const departments = selectedSchool ? DEPARTMENTS[selectedSchool] || [] : []

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="call-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="+234 812 345 6789"
            placeholderTextColor={Colors.textTertiary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* School Dropdown */}
      <DropdownField
        label="School"
        value={selectedSchool}
        placeholder="Select your school"
        icon="school-outline"
        options={SCHOOLS}
        isOpen={showSchoolPicker}
        onToggle={() => {
          setShowSchoolPicker(!showSchoolPicker)
          setShowDeptPicker(false)
          setShowLevelPicker(false)
          setShowSemesterPicker(false)
        }}
        onSelect={(val) => {
          setSelectedSchool(val)
          setSelectedDept('')
          setShowSchoolPicker(false)
        }}
      />

      {/* Department Dropdown */}
      <DropdownField
        label="Department"
        value={selectedDept}
        placeholder="Select your department"
        icon="business-outline"
        options={departments}
        isOpen={showDeptPicker}
        onToggle={() => {
          setShowDeptPicker(!showDeptPicker)
          setShowSchoolPicker(false)
          setShowLevelPicker(false)
          setShowSemesterPicker(false)
        }}
        onSelect={(val) => {
          setSelectedDept(val)
          setShowDeptPicker(false)
        }}
        disabled={!selectedSchool}
      />

      {/* Level & Semester Row */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <DropdownField
            label="Level"
            value={selectedLevel ? `${selectedLevel} Level` : ''}
            placeholder="Level"
            icon="layers-outline"
            options={LEVELS}
            isOpen={showLevelPicker}
            onToggle={() => {
              setShowLevelPicker(!showLevelPicker)
              setShowSchoolPicker(false)
              setShowDeptPicker(false)
              setShowSemesterPicker(false)
            }}
            onSelect={(val) => {
              setSelectedLevel(val)
              setShowLevelPicker(false)
            }}
            displayFn={(val) => `${val} Level`}
          />
        </View>
        <View style={styles.halfField}>
          <DropdownField
            label="Semester"
            value={selectedSemester}
            placeholder="Semester"
            icon="calendar-outline"
            options={SEMESTERS}
            isOpen={showSemesterPicker}
            onToggle={() => {
              setShowSemesterPicker(!showSemesterPicker)
              setShowSchoolPicker(false)
              setShowDeptPicker(false)
              setShowLevelPicker(false)
            }}
            onSelect={(val) => {
              setSelectedSemester(val)
              setShowSemesterPicker(false)
            }}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Create a password"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgreeTerms(!agreeTerms)}
      >
        <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
          {agreeTerms && <Ionicons name="checkmark" size={14} color={Colors.white} />}
        </View>
        <Text style={styles.checkboxLabel}>I agree to the Terms & Conditions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={onSuccess} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  )
}

interface DropdownFieldProps {
  label: string
  value: string
  placeholder: string
  icon: keyof typeof Ionicons.glyphMap
  options: string[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (val: string) => void
  disabled?: boolean
  displayFn?: (val: string) => string
}

function DropdownField({ label, value, placeholder, icon, options, isOpen, onToggle, onSelect, disabled, displayFn }: DropdownFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputWrapper, disabled && styles.disabledInput]}
        onPress={disabled ? undefined : onToggle}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Ionicons name={icon} size={18} color={Colors.gray400} style={styles.inputIcon} />
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.gray400} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => onSelect(option)}
            >
              <Text style={[
                styles.dropdownItemText,
                value === option && styles.dropdownItemSelected,
              ]}>
                {displayFn ? displayFn(option) : option}
              </Text>
              {value === option && (
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.xxl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  formContainer: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.gray700,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 50,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.text,
    height: '100%',
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  disabledInput: {
    backgroundColor: Colors.gray50,
    opacity: 0.6,
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textTertiary,
  },
  dropdownList: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dropdownItemSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  checkboxLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
})
