# Database Schema Update - Session and Invite System

## Migration Applied: `fix_role_and_add_session`

### Changes Made

#### 1. **Fixed Role Column Issue**
- ✅ Removed single `role` column (was causing schema cache error)
- ✅ Uses existing `roles` array column (supports multiple roles per user)
- ✅ Fixed "Could not find the 'role' column" error

#### 2. **Added Session Tracking**
- ✅ Added `session` column (VARCHAR 20) to `users` table
- ✅ Format: "YYYY/YYYY" (e.g., "2022/2023", "2025/2026")
- ✅ Auto-calculated based on current date and user's level
- ✅ Indexed for fast queries

#### 3. **Course Rep Invite System**
- ✅ Added `invite_code` column (unique 6-character code)
- ✅ Added `course_rep_id` column (FK to users table)
- ✅ Auto-generates invite codes for course reps
- ✅ Codes are unique and use easy-to-read characters

### Session Calculation Logic

The system automatically calculates the academic session based on:
- **Current date**: Academic year starts in September
- **User level**: Level 1 = current year, Level 2 = 1 year back, etc.

**Examples (as of January 2026):**
- Level 1 student → Session: 2025/2026 (started this year)
- Level 2 student → Session: 2024/2025 (started last year)
- Level 4 student → Session: 2022/2023 (started 3 years ago)

### Database Functions

#### `calculate_session(user_level INTEGER)`
Calculates the academic session for a user based on their level.
```sql
SELECT calculate_session(4); -- Returns: "2022/2023"
```

#### `generate_invite_code()`
Generates a unique 6-character invite code.
```sql
SELECT generate_invite_code(); -- Returns: "XQF39K" (example)
```

#### `get_current_academic_session()`
Returns the current academic session.
```sql
SELECT get_current_academic_session(); -- Returns: "2025/2026"
```

### Triggers

**`trigger_auto_generate_invite_code`**
- Automatically generates invite codes when a user becomes a course rep
- Automatically calculates session when a user's level is set
- Runs on INSERT and UPDATE

### Updated Users Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | TEXT | User email (unique) |
| `name` | TEXT | Full name |
| `avatar_url` | TEXT | Profile picture URL |
| `school` | UUID | FK to schools table |
| `department` | TEXT | Department name |
| `level` | INTEGER | Academic level (1-6) |
| `roles` | TEXT[] | User roles array (e.g., ['student', 'course_rep']) |
| `bio` | TEXT | User bio |
| `followers_count` | INTEGER | Follower count |
| `phone_number` | TEXT | Phone number |
| `semester` | TEXT | Current semester |
| **`session`** | VARCHAR(20) | **Academic session (e.g., "2025/2026")** |
| **`invite_code`** | VARCHAR(20) | **Unique invite code (for course reps)** |
| **`course_rep_id`** | UUID | **FK to course rep who invited this user** |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Usage Examples

#### 1. Get all users with their session
```sql
SELECT name, level, session, roles 
FROM users 
WHERE level IS NOT NULL;
```

#### 2. Make a user a course rep (auto-generates invite code)
```sql
UPDATE users 
SET roles = ARRAY['course_rep', 'student']
WHERE email = 'rep@example.com';
```

#### 3. Find course rep by invite code
```sql
SELECT name, department, level, invite_code 
FROM users 
WHERE invite_code = 'XQF39K' 
AND 'course_rep' = ANY(roles);
```

#### 4. Get all course reps with their invite links
```sql
SELECT 
    name,
    department,
    level,
    session,
    invite_code,
    'https://yourdomain.com/join/' || invite_code as invite_link
FROM users
WHERE 'course_rep' = ANY(roles);
```

#### 5. Register student via invite code
```sql
-- First, verify the invite code and get course rep details
SELECT id, school, department, level, session
FROM users
WHERE invite_code = 'XQF39K' AND 'course_rep' = ANY(roles);

-- Then create the new user with course_rep_id set
INSERT INTO users (email, name, phone_number, school, department, level, session, course_rep_id)
VALUES (
    'student@example.com',
    'New Student',
    '+1234567890',
    (SELECT school FROM users WHERE invite_code = 'XQF39K'),
    (SELECT department FROM users WHERE invite_code = 'XQF39K'),
    (SELECT level FROM users WHERE invite_code = 'XQF39K'),
    (SELECT session FROM users WHERE invite_code = 'XQF39K'),
    (SELECT id FROM users WHERE invite_code = 'XQF39K')
);
```

### Current Data

All existing users have been automatically updated:
- ✅ Sessions calculated based on their level
- ✅ Course reps now have invite codes
- ✅ No manual intervention required

**Test Result:**
- User: Jimmy Gift (Level 4)
- Session: 2022/2023 ✅
- Roles: ['course_rep', 'student'] ✅
- Invite Code: XQF39K ✅

### Frontend Integration

Update your TypeScript types:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  school?: string;
  department?: string;
  level?: number;
  roles: string[]; // e.g., ['student', 'course_rep']
  bio?: string;
  followers_count?: number;
  phone_number?: string;
  semester?: string;
  session?: string; // NEW: e.g., "2025/2026"
  invite_code?: string; // NEW: e.g., "XQF39K"
  course_rep_id?: string; // NEW: ID of course rep who invited this user
  created_at: string;
  updated_at: string;
}
```

### Next Steps

1. Update your frontend to display session information
2. Implement invite link sharing for course reps
3. Create registration flow for students using invite codes
4. Update user profile to show which course rep invited them
