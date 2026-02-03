# Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in your app.

## 📋 Prerequisites

- Firebase account
- Supabase project
- Node.js and npm installed

## 🔥 Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard
4. Enable Google Analytics (optional)

### 1.2 Register Web App

1. In Firebase Console, go to Project Settings (⚙️ icon)
2. Scroll down to "Your apps" section
3. Click the Web icon (`</>`) to add a web app
4. Give your app a nickname (e.g., "Qitt Web App")
5. **DO NOT** check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the Firebase config object

### 1.3 Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging** tab
2. Under "Web configuration", click **Generate key pair** for Web Push certificates
3. Copy the **VAPID key** (it starts with `B...`)
4. Scroll up to find the **Server key** under "Cloud Messaging API (Legacy)"
   - If you don't see it, click "⋮" menu and enable "Cloud Messaging API (Legacy)"
5. Copy the **Server key** (starts with `AAAA...`)

## 🔐 Step 2: Environment Variables

### 2.1 Update .env.local

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2.2 Update Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder values with your Firebase config:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

## ☁️ Step 3: Supabase Edge Function

### 3.1 Set FCM Server Key Secret

The FCM Server Key must be stored as a Supabase secret (not in .env.local):

```bash
# Login to Supabase CLI
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Set the FCM Server Key
npx supabase secrets set FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY
```

### 3.2 Deploy Edge Function

```bash
# Deploy the send-notification function
npx supabase functions deploy send-notification

# Verify deployment
npx supabase functions list
```

## 🧪 Step 4: Testing

### 4.1 Test Locally

1. Start your development server:
```bash
npm run dev
```

2. Open the app in your browser
3. When prompted, click "Enable" to allow notifications
4. Check browser console for FCM token registration
5. Try creating an assignment or updating timetable to trigger a notification

### 4.2 Test Service Worker

1. Open DevTools > Application > Service Workers
2. Verify `firebase-messaging-sw.js` is registered
3. Check for any errors in the service worker

### 4.3 Test Edge Function

```bash
# Test the edge function directly
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["test-token"],
    "notification": {
      "title": "Test Notification",
      "body": "This is a test",
      "url": "/notifications"
    }
  }'
```

## 🎯 Step 5: Verification

### Check if everything works:

1. ✅ Service worker registered (DevTools > Application > Service Workers)
2. ✅ FCM token obtained (check console logs)
3. ✅ Token saved to `device_tokens` table (check Supabase dashboard)
4. ✅ Edge function deployed (check Supabase Functions dashboard)
5. ✅ Notifications appear when host updates timetable/assignments

## 🐛 Troubleshooting

### Issue: "Firebase config not found"
- **Solution**: Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`
- Restart dev server after updating env variables

### Issue: "Failed to register service worker"
- **Solution**: 
  - Ensure `firebase-messaging-sw.js` is in the `public` folder
  - Check service worker console for errors
  - Make sure you're running on `localhost` or HTTPS

### Issue: "No FCM token"
- **Solution**:
  - Grant notification permission in browser settings
  - Check if notifications are blocked for your site
  - Try in incognito mode

### Issue: "Edge function error"
- **Solution**:
  - Verify FCM_SERVER_KEY is set: `npx supabase secrets list`
  - Check edge function logs: `npx supabase functions logs send-notification`
  - Ensure Cloud Messaging API is enabled in Firebase

### Issue: "Notifications not received"
- **Solution**:
  - Check if device token is active in `device_tokens` table
  - Verify edge function is being called (check logs)
  - Check FCM Server Key is correct
  - Ensure user has notification permission granted

## 📱 Production Deployment

### Vercel Deployment

1. Add environment variables to Vercel:
   - Go to Project Settings > Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables
   - Add `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

2. Redeploy:
```bash
git push origin main
```

### Firebase Configuration

1. Add your production domain to Firebase authorized domains:
   - Firebase Console > Authentication > Settings > Authorized domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

## 🔔 How It Works

### Flow Diagram

```
Host Updates Timetable/Assignment
         ↓
Service Method Triggered
         ↓
Creates notifications in database
         ↓
    ┌────┴────┐
    ↓         ↓
In-App    Push Notification
(Realtime) (Edge Function)
    ↓         ↓
Supabase  Edge Function
Realtime  fetches tokens
    ↓         ↓
Browser   Sends to FCM
Updates       ↓
         FCM delivers
              ↓
         Service Worker
              ↓
         System Notification
```

### Notification Types

- `assignment_created` - New assignment posted
- `assignment_updated` - Assignment modified
- `assignment_deleted` - Assignment removed
- `timetable_updated` - Class schedule changed
- `course_outline_updated` - Course content updated
- `assignment_due_soon` - Due date reminder

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase Edge Function logs
3. Verify Firebase configuration
4. Test in incognito mode
5. Check Firebase Console for API usage

## ✅ Checklist

- [ ] Firebase project created
- [ ] Web app registered in Firebase
- [ ] Cloud Messaging enabled
- [ ] VAPID key generated
- [ ] Server key obtained
- [ ] Environment variables set
- [ ] Service worker updated with config
- [ ] FCM Server Key set in Supabase secrets
- [ ] Edge function deployed
- [ ] Tested notification permission prompt
- [ ] Verified FCM token registration
- [ ] Tested push notification delivery

Once all items are checked, your push notification system is ready! 🎉
