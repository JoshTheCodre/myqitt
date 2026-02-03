# 🚀 Push Notifications - Quick Start

## ✅ Implementation Status: COMPLETE

All code is implemented and ready. Just needs Firebase configuration!

## 📋 What You Need to Do (15 minutes)

### Step 1: Create Firebase Project (5 min)
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it (e.g., "Qitt")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Register Web App (3 min)
1. In Firebase Console, click the Web icon (`</>`)
2. Name your app: "Qitt Web"
3. **Copy the config object**
4. Click "Continue to console"

### Step 3: Enable Cloud Messaging (3 min)
1. Go to Project Settings (⚙️) > Cloud Messaging tab
2. Click "Generate key pair" under Web Push certificates
3. **Copy the VAPID key** (starts with `B...`)
4. Scroll up to "Cloud Messaging API (Legacy)"
5. Enable it if not enabled
6. **Copy the Server key** (starts with `AAAA...`)

### Step 4: Configure App (4 min)

**A. Create .env.local** (copy from .env.local.example):
```env
# Paste your Firebase config values here
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BXXXX...
```

**B. Update Service Worker**
Edit `public/firebase-messaging-sw.js` line 9-15:
```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",           // Replace with your values
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

**C. Set Supabase Secret**
```bash
npx supabase secrets set FCM_SERVER_KEY=YOUR_SERVER_KEY
```

**D. Deploy Edge Function**
```bash
npx supabase functions deploy send-notification
```

### Step 5: Test! (2 min)
```bash
npm run dev
```

1. Open http://localhost:3000
2. Wait 3 seconds for notification prompt
3. Click "Enable"
4. Test by creating an assignment or updating timetable
5. Check if notification appears!

## 📁 Files Already Created

✅ **Frontend**
- `lib/firebase/config.ts` - Firebase configuration
- `lib/firebase/messaging.ts` - FCM token management
- `components/push-notification-prompt.tsx` - Enable/disable UI
- `app/layout.tsx` - Already integrated

✅ **Backend**
- `supabase/functions/send-notification/index.ts` - FCM delivery
- `lib/services/notificationService.ts` - Token registration methods

✅ **Service Worker**
- `public/firebase-messaging-sw.js` - Background notifications

✅ **Config**
- `.env.local.example` - Template
- `PUSH_NOTIFICATIONS_SETUP.md` - Detailed guide
- `PUSH_NOTIFICATIONS.md` - Full documentation

## 🎯 What Works Out of the Box

✅ Assignment notifications (create/update/delete)
✅ Timetable update notifications
✅ Course outline update notifications
✅ In-app real-time notifications
✅ Badge counts
✅ Notification history
✅ Mark as read
✅ Auto-navigation on click
✅ Token management (enable/disable)
✅ Service worker for background
✅ Edge function for FCM delivery

## 🐛 Quick Troubleshooting

**"Firebase config not found"**
→ Restart dev server after adding env variables

**"Service worker failed"**
→ Check `public/firebase-messaging-sw.js` has your config

**"No notification permission"**
→ Check browser settings, try incognito mode

**"Edge function error"**
→ Verify FCM_SERVER_KEY is set: `npx supabase secrets list`

## 📞 Need Help?

Check the detailed guides:
- Setup: `PUSH_NOTIFICATIONS_SETUP.md`
- Documentation: `PUSH_NOTIFICATIONS.md`

## ✨ That's It!

Once you complete the 5 steps above, your app will have:
- 🔔 Real-time in-app notifications
- 📱 Background push notifications
- 🎯 Auto-navigation to content
- 📊 Complete notification history
- ⚙️ User-controllable settings

Total setup time: ~15 minutes 🚀
