# Authentication Pattern - Quick Reference

## 🎯 The Core Principle

**NEVER redirect until `hydrated = true`**

```typescript
// ❌ WRONG
if (!user) {
  router.push('/auth')  // Fires before session loads!
}

// ✅ CORRECT
if (!hydrated) return  // Wait!
if (hydrated && !user) {
  router.push('/auth')  // Now safe
}
```

## 📦 Store Structure

```typescript
interface AuthStore {
  user: User | null           // Supabase auth user
  profile: UserProfile | null // Your custom profile
  hydrated: boolean           // ⭐ Session check complete?
  setAuth: (user, profile) => void
  setHydrated: (bool) => void
  login: (email, pass) => Promise<void>
  logout: () => Promise<void>
}
```

## 🔄 Hydration Flow

```
App Start
   ↓
hydrated = false  ← "Don't trust user yet"
   ↓
AuthProvider.hydrateSession()
   ↓
   ├─> Session exists
   │   ├─> Fetch profile
   │   ├─> setAuth(user, profile)
   │   └─> setHydrated(true) ✅
   │
   └─> No session
       ├─> setAuth(null, null)
       └─> setHydrated(true) ✅
   ↓
hydrated = true  ← "User value is accurate"
   ↓
AuthGuard can redirect
```

## 🛡️ AuthGuard Pattern

```typescript
export function AuthGuard({ children }) {
  const { user, hydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!hydrated) return  // ⭐ CRITICAL

    const isPublic = pathname === '/' || pathname.startsWith('/auth')

    if (!user && !isPublic) {
      router.push('/')  // Not logged in → go to login
    } else if (user && pathname === '/') {
      router.push('/dashboard')  // Logged in → go to dashboard
    }
  }, [user, hydrated, pathname, router])

  return <>{children}</>  // No loading screen
}
```

## 🔌 AuthProvider Pattern

```typescript
export function AuthProvider({ children }) {
  const { setAuth, setHydrated } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const hydrateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        if (mounted) {
          setAuth(null, null)
          setHydrated(true)
        }
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (mounted) {
        setAuth(session.user, profile)
        setHydrated(true)  // ⭐ Only after BOTH ready
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setAuth(null, null)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: profile } = await fetchProfile(session.user.id)
          setAuth(session.user, profile)
        }
      }
    )

    hydrateSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
```

## 🎨 Layout Structure

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>        {/* 1. Hydrates session */}
          <AuthGuard>         {/* 2. Protects routes */}
            <Toaster />
            {children}        {/* 3. App content */}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
```

## 🚀 Using in Pages

```typescript
// app/dashboard/page.tsx
'use client'
import { useAuthStore } from '@/lib/store/authStore'

export default function Dashboard() {
  const { user, profile, hydrated } = useAuthStore()

  // Optional: Show loading while hydrating
  if (!hydrated) {
    return <div>Loading...</div>
  }

  // At this point, user and profile are accurate
  return (
    <div>
      <h1>Welcome {profile?.name}</h1>
      <p>Email: {user?.email}</p>
    </div>
  )
}
```

## 🎯 Key Rules

1. **Always check `hydrated` before redirecting**
   ```typescript
   if (!hydrated) return  // Wait!
   ```

2. **Fetch profile BEFORE `setHydrated(true)`**
   ```typescript
   const profile = await fetchProfile()
   setAuth(user, profile)
   setHydrated(true)  // Last!
   ```

3. **No loading screens in guards**
   ```typescript
   return <>{children}</>  // Render immediately
   ```

4. **Single subscription per app**
   ```typescript
   // Only in AuthProvider, nowhere else
   supabase.auth.onAuthStateChange(...)
   ```

5. **Cleanup subscriptions**
   ```typescript
   return () => subscription.unsubscribe()
   ```

## ✅ Checklist

- [ ] Store has `hydrated` boolean (not `loading`)
- [ ] AuthProvider calls `getSession()` on mount
- [ ] Profile fetched before `setHydrated(true)`
- [ ] AuthGuard checks `if (!hydrated) return`
- [ ] No loading screen in AuthGuard
- [ ] Single `onAuthStateChange` subscription
- [ ] Subscription cleanup on unmount
- [ ] Layout wraps with AuthProvider then AuthGuard

## 🐛 Debugging

```typescript
// Add to any page
const { user, profile, hydrated } = useAuthStore()
console.log('🔍 Auth State:', { 
  hydrated, 
  hasUser: !!user, 
  hasProfile: !!profile 
})
```

**Expected Output:**
- On startup: `{ hydrated: false, hasUser: false, hasProfile: false }`
- After hydration (logged out): `{ hydrated: true, hasUser: false, hasProfile: false }`
- After hydration (logged in): `{ hydrated: true, hasUser: true, hasProfile: true }`

## 📚 Full Documentation

- **Detailed Explanation:** `HYDRATION_FIX_EXPLAINED.md`
- **Complete Auth Docs:** `AUTH_SYSTEM.md`

---

**Pattern:** Hydration-First Authentication  
**Result:** Zero race conditions, smooth UX, production-ready
