import { create } from 'zustand'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import toast from 'react-hot-toast'

export interface UserProfile {
  uid: string
  fullName: string
  email: string
  phoneNumber: string
  school: string
  department: string
  level: string
  semester: string
  createdAt: string
}

interface AuthStore {
  user: any
  profile: UserProfile | null
  loading: boolean
  register: (email: string, password: string, userData: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: false,

  register: async (email: string, password: string, userData: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    set({ loading: true })
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid,
        ...userData,
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, 'users', uid), userProfile)
      set({ user: userCredential.user, profile: userProfile, loading: false })
      toast.success('Account created successfully!')
    } catch (error: any) {
      set({ loading: false })
      const msg = error?.message || 'Registration failed'
      toast.error(msg)
      throw error
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      // Set up real-time listener for user profile
      onSnapshot(doc(db, 'users', uid), (snapshot) => {
        const profile = snapshot.exists() ? (snapshot.data() as UserProfile) : null
        set({ user: userCredential.user, profile, loading: false })
      })

      toast.success('Logged in successfully!')
    } catch (error: any) {
      set({ loading: false })
      const msg = error?.message || 'Login failed'
      toast.error(msg)
      throw error
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      await signOut(auth)
      set({ user: null, profile: null, loading: false })
      toast.success('Logged out successfully!')
    } catch (error: any) {
      set({ loading: false })
      const msg = error?.message || 'Logout failed'
      toast.error(msg)
    }
  },

  initAuth: () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set up real-time listener for user profile
        onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
          const profile = snapshot.exists() ? (snapshot.data() as UserProfile) : null
          set({ user, profile })
        })
      } else {
        set({ user: null, profile: null })
      }
    })
  },
}))
