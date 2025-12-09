# Authentication & Session System

## Architecture Overview

The MyQitt app uses **Supabase Auth** for authentication with a **hydration-first pattern** that eliminates session loading race conditions.

### Critical Concept: Hydration vs Loading

**Hydration** = The one-time process of restoring session state on app startup.

```typescript
hydrated: boolean  // false → "Don't trust user yet"
                   // true  → "Session check complete, user is accurate"
```

This prevents:
- ❌ Redirects before session loads
- ❌ Blank screens during startup
- ❌ User flashing from null to authenticated
- ❌ Protected pages showing "not authorized" to logged-in users

### Database Structure

```
┌─────────────────┐         ┌──────────────────┐
│   auth.users    │◄────────│  public.users    │
│  (Supabase)     │         │  (Custom Table)  │
├─────────────────┤         ├──────────────────┤
│ id (UUID)       │         │ id (FK)          │
│ email           │         │ name             │
│ encrypted_pwd   │         │ email            │
│ created_at      │         │ school           │
│ ...             │         │ department       │
└─────────────────┘         │ level            │
                            │ semester         │
                            │ ...              │
                            └──────────────────┘
```

- **`auth.users`** - Managed by Supabase Auth
  - Stores credentials (email, encrypted password)
  - Issues and validates JWT tokens
  - Handles session lifecycle
  
- **`public.users`** - Custom profile table
  - Foreign key to `auth.users.id`
  - Stores student profile information
  - Used for classmate matching and app features

## Session Management

### The Hydration Pattern

**Problem:** Traditional `loading` states don't distinguish between "app starting up" and "user performing action."

**Solution:** Use `hydrated` to track the one-time session restoration.

- **Zustand Store:** `useAuthStore` in `lib/store/authStore.ts`
- **Global State:** Provides `user`, `profile`, and `hydrated`
- **Hydration:** AuthProvider restores session on mount
- **Live Updates:** `onAuthStateChange` keeps state synced

### JWT Tokens
- **Storage:** Browser localStorage and httpOnly cookies
- **Auto-refresh:** Supabase client handles token refresh
- **Expiry:** 1 hour (access), 30 days (refresh)
  profile: UserProfile | null
  hydrated: boolean  // ⭐ KEY: Only true after getSession() completes
}
```

### Hydration Flow

```
1. App starts → hydrated = false
2. AuthProvider calls supabase.auth.getSession()
3. If session exists:
   a. Fetch user profile from database
   b. setAuth(user, profile)
   c. setHydrated(true)
4. If no session:
   a. setAuth(null, null)
   b. setHydrated(true)
5. Guards now safe to redirect
```
## Authentication Flows

### App Initialization (Hydration)

**Most Important Flow** - Runs once on app startup.

```
1. User opens app
   ↓
2. AuthProvider mounts
   ↓
3. Call supabase.auth.getSession()
   ↓
4. Session exists?
   ├─> YES: Fetch profile → setAuth(user, profile) → setHydrated(true)
   └─> NO:  setAuth(null, null) → setHydrated(true)
   ↓
5. AuthGuard checks hydrated + user
   ↓
6. Redirect if needed (to /auth or /dashboard)
```

**Code Location:** `components/auth-provider.tsx`
**Code Location:** `app/auth/register-form.tsx`

```typescript
// In authStore
register: async (email, password, userData) => {
  // 1. Create auth user
  const { data: authData } = await supabase.auth.signUp({ email, password })

  // 2. Create profile
  await supabase.from('users').insert({
    id: authData.user.id,
    email,
    ...userData
  })

  // 3. Update state (onAuthStateChange will also fire)
  setAuth(authData.user, { id: authData.user.id, email, ...userData })
  toast.success('Account created!')
}
```
    hydrateSession()
    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>  // No loading screen
}
```

### Registration Flow`useAuthStore` in `lib/store/authStore.ts`
- **Global State:** Provides `user` (auth) and `profile` (public.users) objects
- **Persistence:** State synced with localStorage for page reloads

## Authentication Flows

### Registration Flow

```
1. User fills registration form
   ↓
2. Submit → Supabase Auth
   - Creates record in auth.users
   - Hashes password
   - Returns session + JWT
   ↓
3. Create public.users record
   - Insert profile data
   - Link via auth.users.id
   ↓
4. Auto sign-in
   - JWT stored in client
   - useAuthStore populated
   ↓
5. Redirect to dashboard
```
**Code Location:** `app/auth/login-form.tsx`

```typescript
// In authStore
login: async (email, password) => {
  // 1. Authenticate
  const { data: authData } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  // 2. Fetch profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  // 3. Update state (onAuthStateChange will also fire)
  setAuth(authData.user, profile)
  toast.success('Logged in!')
}
```)

// 3. Update global state
useAuthStore.setState({
  user: authData.user,
  profile: profileData
})
```

### Login Flow

```
1. User submits credentials
   ↓
2. Supabase Auth validates
   - Checks email + password
   - Generates JWT
   ↓
3. Fetch profile data
   - Query public.users by auth.users.id
   ↓
4. Update useAuthStore
   - Store user + profile
   ↓
5. Redirect to dashboard
```

**Code Location:** `app/auth/login-form.tsx`

**Key Steps:**
```typescript
// 1. Authenticate
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password
})

// 2. Fetch profile
const { data: profileData } = await supabase
  .from('users')
  .select('*')
  .eq('id', authData.user.id)
  .single()

// 3. Update state
useAuthStore.setState({
  user: authData.user,
  profile: profileData
})
```

### Logout Flow

```
1. User clicks logout
   ↓
2. Call supabase.auth.signOut()
   - Invalidates JWT
   - Clears server session
   ↓
3. Clear client state
   - Reset useAuthStore
   - Clear localStorage
   ↓
4. Redirect to login page
```

## Protected Routes

All app pages (dashboard, timetable, assignments, classmates) are protected and require authentication.

### Protection Pattern

```typescript
'use client'
import { useAuthStore } from '@/lib/store/authStore'
## Protected Routes

All app pages (dashboard, timetable, assignments, classmates) require authentication.

### AuthGuard Pattern

**Critical:** Guards must wait for `hydrated = true` before redirecting.

```typescript
export function AuthGuard({ children }) {
  const { user, hydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ⭐ CRITICAL: Don't redirect until hydration completes
    if (!hydrated) return

    const publicPaths = ['/', '/auth']
    const isPublic = publicPaths.some(p => pathname.startsWith(p))

    if (!user && !isPublic) {
      router.push('/')  // Protected page, no user
    } else if (user && pathname === '/') {
      router.push('/dashboard')  // Logged in user on home page
    }
  }, [user, hydrated, pathname, router])

  return <>{children}</>  // Render immediately (no loading screen)
}
```

**Why this works:**
- ✅ `if (!hydrated) return` prevents premature redirects
- ✅ Authenticated users don't get kicked to login
- ✅ No blank screens (children render immediately)
- ✅ Redirect happens smoothly after hydrationusers FOR SELECT
USING (auth.uid() = id);

-- Users can only modify their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

## Classmate Connection System

### How Connections Work

Users can connect with classmates who match **all three criteria:**

1. **Same School** - Ensures university context
2. **Same Department** - Ensures course relevance  
3. **Same Level** - Ensures appropriate peer group

### Connection Logic

**Code Location:** `app/classmates/page.tsx`

```typescript
// Fetch potential classmates
const { data: classmates } = await supabase
  .from('users')
  .select('*')
  .eq('school', profile.school)           // ✅ Same university
  .eq('department', profile.department)   // ✅ Same department
  .eq('level', profile.level)             // ✅ Same level
  .neq('id', user.id)                     // ❌ Exclude self
```

### Connection Table

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES users(id),   -- Current user
  following_id UUID REFERENCES users(id),  -- Classmate they connect to
  created_at TIMESTAMP
);
```

### Connected Data Viewing

When viewing timetables or assignments, the app shows:
- **Own data** (blue/primary color)
- **Connected users' data** (green/secondary color)

**Example from timetable page:**

```typescript
// 1. Fetch own timetable
const { data: ownTimetable } = await supabase
  .from('timetable')
  .select('*')
  .eq('user_id', user.id)
  .single()

// 2. Get connections
const { data: connections } = await supabase
  .from('connections')
  .select('following_id')
  .eq('follower_id', user.id)

// 3. Fetch connected users' timetables
const connectedUserIds = connections.map(c => c.following_id)
const { data: connectedTimetables } = await supabase
  .from('timetable')
  .select('*')
  .in('user_id', connectedUserIds)

// 4. Merge and display with owner labels
const combinedSchedule = [
  ...ownClasses.map(c => ({ ...c, isOwner: true })),
  ...connectedClasses.map(c => ({ ...c, isOwner: false, ownerName: 'John Doe' }))
]
```
## Session Troubleshooting

### Common Issues & Solutions

**1. User logged out unexpectedly**
- Check if `hydrated = true` before assuming no user
- Verify token hasn't expired (check browser DevTools → Application → Local Storage)
- Look for `onAuthStateChange` SIGNED_OUT events in console

**2. "Not authenticated" errors**
### Debug Checklist

```typescript
// 1. Check hydration state
const { hydrated, user, profile } = useAuthStore()
console.log('Hydrated:', hydrated, 'User:', user, 'Profile:', profile)

// 2. Check Supabase session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// 3. Check profile in database
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user?.id)
  .single()
console.log('Profile from DB:', profile)

// 4. Check RLS policies
// Run in Supabase SQL Editor:
SELECT * FROM users WHERE id = auth.uid();
```LS policy blocking access

### Debug Checklist

```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// Check if JWT is valid
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Check profile data
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user?.id)
  .single()
console.log('Profile:', profile)
```

## Security Best Practices
## Related Files

- **Auth Store:** `lib/store/authStore.ts` - Zustand store with `hydrated` flag
- **Auth Provider:** `components/auth-provider.tsx` - Handles session hydration
- **Auth Guard:** `components/auth-guard.tsx` - Protects routes after hydration
- **Supabase Client:** `lib/supabase/client.ts` - Supabase initialization
- **Login Form:** `app/auth/login-form.tsx`
- **Register Form:** `app/auth/register-form.tsx`
- **Layout:** `app/layout.tsx` - Wraps app with AuthProvider + AuthGuard

## Key Architecture Decisions

1. **`hydrated` over `loading`**
   - Distinguishes startup from ongoing operations
   - Prevents premature redirects

2. **Fetch profile before `setHydrated(true)`**
   - Ensures atomic user+profile update
   - Pages never see user without profile

3. **No loading screens**
   - Children render immediately
   - Better UX, no blank screens
   - Redirects happen smoothly in useEffect

4. **Single subscription in AuthProvider**
   - Prevents memory leaks
   - One source of truth
   - Cleanup on unmount

5. **Guards wait for hydration**
   - `if (!hydrated) return` is critical
   - Prevents race conditions
   - Smooth navigation experience

---

**Last Updated:** December 2025  
**System Version:** Supabase Auth v2 + Next.js 15 + Zustand  
**Pattern:** Hydration-First Authentication
- Disable RLS policies in production

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Related Files

- **Auth Store:** `lib/store/authStore.ts`
- **Supabase Config:** `lib/firebase/config.ts` (contains Supabase client)
- **Login Form:** `app/auth/login-form.tsx`
- **Register Form:** `app/auth/register-form.tsx`
- **Classmates Page:** `app/classmates/page.tsx`
- **Protected Pages:** All pages in `app/` directory

---

**Last Updated:** January 2025  
**System Version:** Supabase Auth v2 + Next.js 15
