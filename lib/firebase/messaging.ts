import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';
import { firebaseConfig, vapidKey } from './config';

let app: FirebaseApp;
let messaging: Messaging | null = null;

// Initialize Firebase
export const initializeFirebase = () => {
  if (typeof window === 'undefined') return null;
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  return app;
};

// Initialize Firebase Messaging
export const initializeMessaging = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    if (!messaging) {
      initializeFirebase();
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
    }

    // Get FCM token
    const messagingInstance = initializeMessaging();
    if (!messagingInstance) {
      console.error('Failed to initialize messaging');
      return null;
    }

    const token = await getToken(messagingInstance, { 
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.error('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: MessagePayload) => void) => {
  const messagingInstance = initializeMessaging();
  if (!messagingInstance) return () => {};

  return onMessage(messagingInstance, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Check if notifications are enabled
export const isNotificationEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
};
