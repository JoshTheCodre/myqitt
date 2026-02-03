# 🔔 Push Notifications System

## ✅ What's Implemented

Full push notification system with Firebase Cloud Messaging (FCM) that sends notifications when:

- 📝 **Assignments** are created, updated, or deleted
- 📅 **Timetables** are updated
- 📚 **Course outlines** are added or updated
- ⏰ **Due date reminders** (configurable)

## 🎯 Features

### 1. Real-time In-App Notifications
- ✅ Instant delivery via Supabase Realtime
- ✅ Badge counts on navigation
- ✅ Notification dropdown
- ✅ Mark as read functionality
- ✅ Notification history

### 2. Push Notifications (Background)
- ✅ Works when app is closed or in background
- ✅ System notifications (Windows/Mac/Android/iOS)
- ✅ Click to open relevant page
- ✅ Customizable per notification type
- ✅ Token management (enable/disable)

## 📁 Files Created

### Frontend
```
lib/
├── firebase/
│   ├── config.ts              # Firebase configuration
│   └── messaging.ts           # FCM token & messaging setup
components/
└── push-notification-prompt.tsx  # UI for enabling notifications
```

### Backend
```
supabase/
└── functions/
    └── send-notification/
        └── index.ts           # Edge function for FCM delivery
```

### Service Worker
```
public/
└── firebase-messaging-sw.js   # Background message handler
```

### Configuration
```
.env.local.example             # Environment variables template
PUSH_NOTIFICATIONS_SETUP.md    # Complete setup guide
```

## 🚀 Quick Start

### 1. Firebase Setup (5 minutes)

1. Create Firebase project at https://console.firebase.google.com/
2. Register web app and copy config
3. Enable Cloud Messaging
4. Get VAPID key and Server key

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

### 3. Update Service Worker

Edit `public/firebase-messaging-sw.js` with your Firebase config.

### 4. Deploy Edge Function

```bash
npx supabase secrets set FCM_SERVER_KEY=your-server-key
npx supabase functions deploy send-notification
```

### 5. Test

```bash
npm run dev
```

Enable notifications when prompted, then test by creating an assignment or updating timetable.

## 📊 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Host Action (Create Assignment, Update Timetable, etc) │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Service Method (AssignmentService, etc)         │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│               NotificationService.sendNotification       │
└───────────────┬────────────────────────────┬────────────┘
                ↓                            ↓
    ┌───────────────────────┐    ┌──────────────────────┐
    │  Save to Database     │    │  Call Edge Function  │
    │  (notifications)      │    │  (send-notification) │
    └───────────┬───────────┘    └──────────┬───────────┘
                ↓                            ↓
    ┌───────────────────────┐    ┌──────────────────────┐
    │  Supabase Realtime    │    │  Fetch device tokens │
    │  broadcasts to        │    │  from device_tokens  │
    │  connected browsers   │    └──────────┬───────────┘
    └───────────┬───────────┘               ↓
                ↓                ┌──────────────────────┐
    ┌───────────────────────┐    │  Send to FCM API     │
    │  In-app notification  │    │  for each token      │
    │  • Badge update       │    └──────────┬───────────┘
    │  • Dropdown           │               ↓
    │  • History            │    ┌──────────────────────┐
    └───────────────────────┘    │  FCM delivers to     │
                                 │  Service Worker      │
                                 └──────────┬───────────┘
                                            ↓
                                 ┌──────────────────────┐
                                 │  System Notification │
                                 │  (background)        │
                                 └──────────────────────┘
```

### Notification Flow

1. **Host performs action** (e.g., creates assignment)
2. **Service method** saves to database
3. **NotificationService** triggered
4. **Gets connectees** from connections table
5. **Two parallel paths**:
   
   **Path A: In-App (Realtime)**
   - Saves to notifications table
   - Supabase Realtime broadcasts
   - Connected browsers receive instantly
   - Badge/dropdown updates
   
   **Path B: Push (Background)**
   - Calls edge function
   - Fetches device tokens
   - Sends to FCM
   - FCM delivers to devices
   - Service worker shows system notification

## 🔧 API Reference

### NotificationService Methods

```typescript
// Register FCM token
NotificationService.registerFCMToken(userId: string, token: string)

// Unregister FCM token
NotificationService.unregisterFCMToken(userId: string)

// Send notification (used internally)
NotificationService.sendNotification(options: SendNotificationOptions)

// Get notifications
NotificationService.getAllNotifications(userId: string, limit?: number)
NotificationService.getUnreadNotifications(userId: string, limit?: number)
NotificationService.getUnreadCount(userId: string)

// Mark as read
NotificationService.markAsRead(notificationId: string)
NotificationService.markAllAsRead(userId: string)
```

### Notification Types

```typescript
type NotificationType =
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_deleted'
  | 'assignment_due_soon'
  | 'timetable_updated'
  | 'course_outline_updated'
  | 'class_reminder'
  | 'announcement'
  | 'general';
```

## 🎨 UI Components

### PushNotificationPrompt
- **Location**: `components/push-notification-prompt.tsx`
- **Features**:
  - Beautiful modal UI
  - Shows 3 seconds after page load
  - Lists notification benefits
  - Enable/Disable toggle button
  - Persists user choice
  - Shows active status when enabled

### Integration
Already integrated in `app/layout.tsx` - no additional setup needed.

## 🔒 Security

- ✅ FCM Server Key stored in Supabase secrets (not in code)
- ✅ RLS policies on notifications table
- ✅ Device tokens linked to authenticated users
- ✅ CORS configured on edge function
- ✅ Token validation before sending

## 📱 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 50+     | ✅ Full  |
| Firefox | 44+     | ✅ Full  |
| Safari  | 16+     | ✅ Full  |
| Edge    | 79+     | ✅ Full  |
| Opera   | 37+     | ✅ Full  |

## 🐛 Troubleshooting

### No notification permission prompt
- Check browser settings for blocked sites
- Try incognito mode
- Clear site data and reload

### Notifications not received
- Verify FCM_SERVER_KEY is set in Supabase
- Check edge function logs
- Ensure device token is active in database
- Check browser notification settings

### Service worker errors
- Ensure firebase-messaging-sw.js has correct config
- Check DevTools > Application > Service Workers
- Unregister and re-register service worker

## 📈 Monitoring

### Check notification delivery
```sql
-- Recent notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Unread count by user
SELECT user_id, COUNT(*) 
FROM notifications 
WHERE is_read = false 
GROUP BY user_id;

-- Active device tokens
SELECT user_id, device_type, created_at 
FROM device_tokens 
WHERE is_active = true;
```

### Edge function logs
```bash
npx supabase functions logs send-notification --tail
```

## 🎯 Testing Checklist

- [ ] Notification permission prompt appears
- [ ] Permission granted successfully
- [ ] FCM token saved to device_tokens table
- [ ] Create assignment triggers notification
- [ ] Update timetable triggers notification
- [ ] Update course outline triggers notification
- [ ] In-app notification appears instantly
- [ ] Badge count updates
- [ ] Notification history shows correctly
- [ ] Click notification navigates to correct page
- [ ] Background notification works when app closed
- [ ] Service worker registered successfully
- [ ] Edge function deploys without errors

## 📚 Documentation

- [Complete Setup Guide](./PUSH_NOTIFICATIONS_SETUP.md)
- [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🎉 Status

✅ **Fully Implemented** - Ready for Firebase configuration and deployment!

All code is in place. Just need to:
1. Create Firebase project
2. Add environment variables
3. Deploy edge function
4. Test!

See [PUSH_NOTIFICATIONS_SETUP.md](./PUSH_NOTIFICATIONS_SETUP.md) for step-by-step instructions.
