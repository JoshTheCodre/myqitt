# Service Worker and Notifications - DISABLED

## Files Moved to /disabled folder:

### Components:
- `components/install-popup.tsx` - PWA install popup
- `components/notification-settings.tsx` - User notification preferences

### Services:
- `lib/services/notificationService.ts` - FCM notification service
- `lib/hooks/usePushNotifications.ts` - Push notification React hook

### Firebase:
- `lib/firebase/config.ts` - Firebase configuration and messaging setup
- `public/sw.js` - Service worker file
- `public/firebase-messaging-sw.js` - Firebase messaging service worker

### API Routes:
- `app/api/send-notification/` - Server-side notification sending endpoint

### Pages:
- `app/test-notifications/` - Admin page for testing notifications

### Database:
- `supabase/migrations/003_notifications_schema.sql` - Notification tables schema
- `supabase/functions/send-push-notification/` - Supabase edge function for FCM

## Changes Made:

### Code Changes (commented out, not deleted):
1. **Dashboard** (`app/dashboard/page.tsx`):
   - Commented out InstallPopup import and usage

2. **Profile Page** (`app/profile/page.tsx`):
   - Commented out NotificationSettings import and usage
   - Removed notification settings button from UI

3. **Timetable Add** (`app/timetable/add/page.tsx`):
   - Commented out NotificationService import
   - Commented out notification sending code after timetable updates

4. **Services Index** (`lib/services/index.ts`):
   - Commented out NotificationService export

### Firebase Packages:
- Left `firebase` and `firebase-admin` packages in package.json for easy reconnection
- All Firebase messaging functionality is disabled

## To Re-enable:
1. Move files back from `/disabled` folder to their original locations
2. Uncomment all the commented code marked with "// DISABLED: Service worker related"
3. Ensure Firebase environment variables are set
4. Re-run database migrations for notification schema
5. Deploy Supabase edge function for notifications

## Status:
✅ App runs without service worker dependencies
✅ No notification functionality active
✅ All main features working (dashboard, timetable, profile, etc.)
✅ Easy to reconnect later by moving files back