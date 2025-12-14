# 🤝 Connection System

## Overview
The connection system allows students to connect with up to **2 classmates** - one for timetable sharing and one for assignments. Students can also connect to the same person for both if that person has both resources available.

## Features

### ✨ Smart Connection Modal
- **Beautiful UI**: Gradient cards, smooth animations, and responsive design
- **Content-aware**: Only shows options for what the classmate has available
- **Bio Display**: Shows user bio if available
- **Last Updated**: Displays when timetable/assignments were last modified
- **Connection Limits**: Prevents over-connecting (max 1 timetable, 1 assignment)
- **Visual Feedback**: Icons, colors, and badges for different states

### 🎯 Connection Types
1. **Timetable Only** - Access classmate's class schedule
2. **Assignments Only** - Access classmate's assignment list  
3. **Both** - Access both timetable and assignments (if available)

### 🔒 Restrictions
- Can only connect to classmates in the **same school, department, and level**
- Maximum **1 timetable connection** at a time
- Maximum **1 assignment connection** at a time
- Cannot connect if classmate has no shared content
- Shows warning if trying to connect when already at limit

## User Flow

### Connecting to a Classmate

1. Navigate to **Classmates** page
2. Find a classmate card showing:
   - Name and avatar
   - Follower count
   - Timetable status (✓ Shared or ✗ None)
   - Assignments status (✓ Shared or ✗ None)
3. Click **"Connect"** button
4. Connection modal appears with:
   - Classmate's bio
   - Last update times for timetable/assignments
   - Available connection options:
     - 📅 Timetable (if they have it)
     - 📝 Assignments (if they have it)  
     - ✓ Both (if they have both and you have no connections)
   - Info box explaining connection limits
5. Select desired connection type
6. Click **"Connect"** button
7. Success! Their content is now accessible

### Disconnecting

1. Click on connected user's card (shows "✓ Connected")
2. Automatically disconnects (no modal needed)
3. Connection slot is now available for someone else

## Technical Implementation

### Database Schema

#### Connections Table
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id),
  following_id UUID REFERENCES auth.users(id),
  connection_type TEXT CHECK (connection_type IN ('timetable', 'assignments', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Services

#### ConnectionService
Located at: `lib/services/connectionService.ts`

**Key Methods:**
- `getExistingConnections(userId)` - Get user's current connections
- `canConnect(userId, targetId, type)` - Validate if connection is allowed
- `connectToUser(userId, targetId, type)` - Create new connection
- `disconnectUser(userId, targetId)` - Remove connection
- `getUserContent(userId)` - Check what content user has available

#### ClassmateService  
Located at: `lib/services/classmateService.ts`

**Updated to:**
- Include `hasTimetable` and `hasAssignments` flags
- Filter by school, department, AND level
- Show connection status

### Components

#### ConnectionModal
Located at: `components/connection-modal.tsx`

**Features:**
- Responsive design (bottom sheet on mobile, centered on desktop)
- Dynamic option rendering based on available content
- Real-time last update checks
- Connection limit warnings
- Loading states
- Error handling

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  classmate: {
    id: string
    name: string
    bio?: string
    hasTimetable: boolean
    hasAssignments: boolean
  }
  currentUserId: string
  onConnect: (type: 'timetable' | 'assignments' | 'both') => Promise<void>
}
```

## Color Scheme & Branding

### Connection Types Colors
- **Timetable**: Blue (`blue-500`, `blue-100`)
- **Assignments**: Emerald (`emerald-500`, `emerald-100`)
- **Both**: Purple gradient (`blue-500` to `emerald-500`)

### States
- **Available**: Amber (`amber-50`, `amber-600`)
- **Connected**: Emerald (`emerald-50`, `emerald-600`)
- **Current User**: Blue (`blue-50`, `blue-600`)
- **Disabled**: Gray (`gray-300`, `gray-500`)

## Example Scenarios

### Scenario 1: User has no connections
- Can connect to any classmate for timetable
- Can connect to any classmate for assignments
- Can connect to same classmate for both

### Scenario 2: User connected to Alice (timetable)
- Cannot connect to another timetable
- Can still connect to assignments (same or different person)
- If connecting to Alice again, only "Assignments" option shows

### Scenario 3: User connected to Bob (both)
- Cannot connect to any other timetable
- Cannot connect to any other assignments
- Modal shows warnings for both slots taken

### Scenario 4: Classmate has no content
- Modal shows "No shared content available" message
- No connection options displayed
- Encourages waiting for classmate to add content

## Future Enhancements

- [ ] Push notifications when connected user updates content
- [ ] Connection requests (pending/accepted flow)
- [ ] Bulk connection management page
- [ ] Analytics on most-connected users
- [ ] Mutual connection badges
- [ ] Connection recommendations based on activity

## Migration Applied

Migration: `add_connection_type`
- Added `connection_type` column to connections table
- Set default to 'both' for backward compatibility
- Added CHECK constraint for valid types
- Created index for faster queries
